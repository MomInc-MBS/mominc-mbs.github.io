"""Minimal bounded Ollama adapter. Requests stay on loopback; no generated code runs."""
from __future__ import annotations
import json
from urllib.request import Request,urlopen,HTTPRedirectHandler,build_opener
from urllib.parse import urlparse

MAX_BODY_BYTES=1_000_000
SYSTEM_PROMPT="Return exactly one JSON object matching the requested schema. Do not use markdown."


def _loopback(endpoint:str)->str:
    p=urlparse(endpoint)
    if p.scheme!="http" or p.hostname not in ("127.0.0.1","localhost","::1") or p.username or p.password:
        raise ValueError("Ollama endpoint must be loopback HTTP")
    return endpoint.rstrip("/")


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        raise RuntimeError("Ollama redirect refused")


def make_payload(model:str,prompt:str,*,seed=42,max_tokens=128)->dict:
    if not 1<=int(max_tokens)<=128: raise ValueError("max_tokens must be between 1 and 128")
    payload={"model":model,"messages":[{"role":"system","content":SYSTEM_PROMPT},{"role":"user","content":prompt}],"stream":False,"think":False,"format":"json","options":{"num_ctx":2048,"num_predict":int(max_tokens),"temperature":0,"seed":int(seed)}}
    if len(json.dumps(payload,separators=(",",":"),ensure_ascii=False).encode())>MAX_BODY_BYTES: raise ValueError("request exceeded size cap")
    return payload


def post_json(url:str,payload:dict,timeout_s:float)->dict:
    body=json.dumps(payload,separators=(",",":"),ensure_ascii=False).encode()
    if len(body)>MAX_BODY_BYTES: raise ValueError("request exceeded size cap")
    req=Request(url,data=body,headers={"Content-Type":"application/json","Accept":"application/json"},method="POST")
    with build_opener(_NoRedirect()).open(req,timeout=timeout_s) as resp:
        raw=resp.read(MAX_BODY_BYTES+1)
    if len(raw)>MAX_BODY_BYTES: raise ValueError("response exceeded size cap")
    data=json.loads(raw)
    if not isinstance(data,dict): raise ValueError("Ollama response must be a JSON object")
    return data


class OllamaAdapter:
    def __init__(self,endpoint="http://127.0.0.1:11434",timeout_s=120,transport=None):
        self.endpoint=_loopback(endpoint); self.timeout_s=float(timeout_s)
        if not 0<self.timeout_s<=120: raise ValueError("timeout must be between 0 and 120 seconds")
        self.transport=transport or post_json

    def generate(self,model:str,prompt:str,*,seed=42,max_tokens=128,expected_digest=None)->tuple[str,str,str|None,int]:
        payload=make_payload(model,prompt,seed=seed,max_tokens=max_tokens)
        from hive.model_registry import discover
        catalog=discover(self.endpoint)
        if not catalog.get("available"): raise RuntimeError("model catalog unavailable for digest verification")
        record=next((item for item in catalog.get("models",[]) if item.get("id")==model),None)
        if not record or not record.get("digest"): raise RuntimeError("requested model ID has no discovered manifest digest")
        if expected_digest is not None and record["digest"] != expected_digest: raise RuntimeError("model manifest digest changed since mission intake")
        data=self.transport(self.endpoint+"/api/chat",payload,self.timeout_s)
        if not isinstance(data,dict) or not isinstance(data.get("message"),dict): raise RuntimeError("malformed Ollama response")
        content=data["message"].get("content")
        if not isinstance(content,str) or len(content.encode("utf-8"))>MAX_BODY_BYTES: raise RuntimeError("model output exceeded size cap")
        actual=data.get("model")
        if not isinstance(actual,str) or actual!=model: raise RuntimeError("Ollama returned a different model ID than requested")
        count=data.get("eval_count")
        if type(count) is not int or count<0: raise RuntimeError("Ollama generated-token count missing or invalid")
        return content,actual,record["digest"],count
