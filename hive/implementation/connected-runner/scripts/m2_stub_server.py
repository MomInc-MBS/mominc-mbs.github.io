"""Stub OpenAI-compatible server for M2-1 harness tests (no model, loopback only).
Usage: python scripts/m2_stub_server.py [--port 1235] [--replies replies.json] [--log requests.jsonl]
replies.json: {"R": [...], "C": [...]}; each item is a steps list (-> {"steps": [...]} after some prose), a raw string reply,
{"http_status": 500} (fail), or {"content": "..."}. Items are consumed per effect in order and the last one repeats.
Smoke requests (seed in the smoke range) get {"smoke":"ok"}. The effect is read from the prompt's "Target type" line.
Every reply also carries a `reasoning_content` holding a bogus steps object, to prove the harness ignores it."""
import argparse, json, sys, threading
from http.server import BaseHTTPRequestHandler, HTTPServer

MODEL_ID = "openai/gpt-oss-20b"
DEFAULT = {"R": [["identity"], ["parse_whole", "to_json"]], "C": [["each(parse_whole)", "aggregate"]]}


def make_server(replies=None, port=0, log=None, model_id=MODEL_ID):
    replies, counters, lock = replies or DEFAULT, {"R": 0, "C": 0, "total": 0}, threading.Lock()

    class H(BaseHTTPRequestHandler):
        def log_message(self, *a): pass

        def _send(self, code, obj):
            raw = json.dumps(obj).encode("utf-8")
            self.send_response(code); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(raw))); self.end_headers(); self.wfile.write(raw)

        def do_GET(self):
            if self.path.rstrip("/") == "/v1/models": self._send(200, {"data": [{"id": model_id, "object": "model"}]})
            else: self._send(404, {"error": "not found"})

        def do_POST(self):
            body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            text = "\n".join(m["content"] for m in body["messages"])
            with lock:
                counters["total"] += 1
                if log:
                    with open(log, "a", encoding="utf-8", newline="\n") as f: f.write(json.dumps(body, sort_keys=True) + "\n")
                if 2026119000 <= body.get("seed", 0) < 2026120000:
                    item, eff = '{"smoke":"ok"}', None
                else:
                    eff = "C" if "Target type: Report" in text else "R"
                    seq = replies.get(eff) or DEFAULT[eff]
                    item = seq[min(counters[eff], len(seq) - 1)]; counters[eff] += 1
            if isinstance(item, dict) and "http_status" in item:
                return self._send(item["http_status"], {"error": "scripted failure"})
            content = item["content"] if isinstance(item, dict) else item if isinstance(item, str) else "Thinking done.\n" + json.dumps({"steps": item})
            ptok = len(text.encode("utf-8")) // 4
            self._send(200, {"id": "stub", "object": "chat.completion", "model": body.get("model", model_id),
                             "choices": [{"index": 0, "message": {"role": "assistant", "content": content, "reasoning_content": 'scratch {"steps": ["aggregate"]}'}, "finish_reason": "stop"}],
                             "usage": {"prompt_tokens": ptok, "completion_tokens": max(1, len(content) // 4), "total_tokens": ptok + max(1, len(content) // 4)}})

    srv = HTTPServer(("127.0.0.1", port), H)
    srv.counters = counters
    return srv


def serve_thread(replies=None, log=None):
    srv = make_server(replies, 0, log)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_port}/v1"


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--port", type=int, default=1235); ap.add_argument("--replies"); ap.add_argument("--log")
    a = ap.parse_args()
    srv = make_server(json.load(open(a.replies, encoding="utf-8")) if a.replies else None, a.port, a.log)
    print(f"stub listening on http://127.0.0.1:{a.port}/v1", file=sys.stderr)
    srv.serve_forever()
