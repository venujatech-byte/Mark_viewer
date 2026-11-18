"""Native startup check. Run after cargo build with tauri-driver on PATH."""
import argparse
import base64
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.request

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--driver", default="tauri-driver")
parser.add_argument("--screenshot", type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
session = None

def request(method, path, payload=None):
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request("http://127.0.0.1:4444" + path, data=data,
                                 headers={"Content-Type": "application/json"}, method=method)
    with urllib.request.urlopen(req, timeout=30) as response:
        value = json.load(response)["value"]
    if isinstance(value, dict) and "error" in value:
        raise RuntimeError(value)
    return value

environment = dict(os.environ, GDK_BACKEND="x11")
with subprocess.Popen([args.driver], env=environment) as driver:
    try:
        deadline = time.monotonic() + 10
        while True:
            try:
                request("GET", "/status")
                break
            except (urllib.error.URLError, ConnectionError):
                if driver.poll() is not None or time.monotonic() >= deadline:
                    raise RuntimeError("tauri-driver did not start")
                time.sleep(0.1)
        result = request("POST", "/session", {"capabilities": {"alwaysMatch": {
            "tauri:options": {"application": str(root / "target/debug/mark-desktop")}
        }}})
        session = result["sessionId"]
        def evaluate(script):
            return request("POST", f"/session/{session}/execute/sync", {"script": script, "args": []})
        assert evaluate("return document.title") == "Mark"
        assert evaluate("return document.querySelector('#welcome-title').textContent") == "Your markdown, ready to read."
        assert evaluate("return typeof window.__TAURI__.core.invoke") == "function"
        assert evaluate("return document.querySelector('#open').disabled") is False
        source = "\ufeff---\r\nname: skill\r\n---\r\n# Old  "
        updated = "---\nname: skill\n---\n# New  "
        result = request("POST", f"/session/{session}/execute/async", {
            "script": "const done = arguments[arguments.length - 1]; window.__TAURI__.core.invoke('edit_source', {source: arguments[0], updated: arguments[1]}).then(source => window.__TAURI__.core.invoke('render_document', {source}).then(html => done({source, html}))).catch(error => done({error: String(error)}));",
            "args": [source, updated]
        })
        assert result["source"] == source.replace("Old", "New"), result
        assert "<h1>New</h1>" in result["html"], result
        assert evaluate("return document.querySelector('#source').readOnly") is False
        if args.screenshot:
            args.screenshot.write_bytes(base64.b64decode(request("GET", f"/session/{session}/screenshot")))
        print("Native Tauri startup, close protection, UTF-8 editing and rendering IPC passed.")
    finally:
        if session:
            request("DELETE", f"/session/{session}")
        driver.terminate()
        driver.wait(timeout=10)
