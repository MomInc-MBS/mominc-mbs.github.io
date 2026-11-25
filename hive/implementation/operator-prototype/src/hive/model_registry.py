"""Loopback-only cached Ollama model discovery."""
from urllib.parse import urlparse
from urllib.request import Request,urlopen,HTTPRedirectHandler,build_opener
import json
MAX_BODY_BYTES=1_000_000


def _endpoint(value):
    u=urlparse(value)
    if u.scheme!="http" or u.hostname not in ("127.0.0.1","localhost","::1") or u.username or u.password: raise ValueError("model endpoint must be loopback HTTP")
    return value.rstrip("/")

class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl): raise RuntimeError("Ollama redirect refused")

def discover(endpoint="http://127.0.0.1:11434",timeout_s=3.0):
    base=_endpoint(endpoint)
    try:
        req=Request(base+"/api/tags",headers={"Accept":"application/json"})
        with build_opener(_NoRedirect()).open(req,timeout=min(float(timeout_s),3.0)) as response: raw=response.read(MAX_BODY_BYTES+1)
        if len(raw)>MAX_BODY_BYTES: raise ValueError("model catalog response exceeded size cap")
        data=json.loads(raw)
        if not isinstance(data,dict): raise ValueError("model catalog must be an object")
        models=[]
        for m in data.get("models",[]):
            if not isinstance(m,dict): continue
            model_id=m.get("name") or m.get("model")
            if model_id: models.append({"id":model_id,"digest":m.get("digest"),"available":True})
        return {"endpoint":base,"available":True,"models":models,"error":None}
    except Exception as exc:
        return {"endpoint":base,"available":False,"models":[],"error":f"{type(exc).__name__}: {exc}"}
