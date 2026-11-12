"""Exercise the packaged Windows GUI, its buttons and WebSocket endpoints."""

import argparse
import asyncio
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import tempfile
import time

from tornado.httpclient import AsyncHTTPClient, HTTPClientError, HTTPRequest
from tornado.websocket import websocket_connect


async def exercise(package, report):
    from pywinauto import Application

    with tempfile.TemporaryDirectory(prefix="ojbetter-smoke-") as directory:
        root = Path(directory) / "Bridge 测试 with spaces"
        shutil.copytree(package, root)
        with socket.socket() as reservation:
            reservation.bind(("127.0.0.1", 0))
            port = reservation.getsockname()[1]
        clangd = shutil.which("clangd")
        if not clangd:
            llvm = Path(r"C:\Program Files\LLVM\bin\clangd.exe")
            if llvm.is_file():
                clangd = str(llvm)
        if not clangd:
            raise RuntimeError("clangd is required for the packaged language-server test")
        configuration = json.dumps({
            "host": "127.0.0.1", "port": port,
            "commands": {"cpp": [clangd, "--log=error"]},
        })
        (root / "config.yml").write_text(configuration, encoding="utf-8")
        executable = root / "server_gui.exe"
        proc = subprocess.Popen([str(executable)], cwd=directory)
        http = AsyncHTTPClient(force_instance=True)
        clients = []
        events = []

        def record(message):
            events.append(message)
            (report / "result.json").write_text(
                json.dumps({"events": events}, ensure_ascii=False, indent=2), encoding="utf-8")
            print(message, flush=True)

        async def ready(expected=True):
            deadline = time.monotonic() + 60
            while time.monotonic() < deadline:
                if proc.poll() is not None:
                    raise RuntimeError(f"GUI exited with status {proc.returncode}")
                try:
                    response = await http.fetch(
                        f"http://127.0.0.1:{port}/", request_timeout=1)
                    available = response.code == 200
                except (OSError, HTTPClientError):
                    available = False
                if available == expected:
                    return
                await asyncio.sleep(0.2)
            raise TimeoutError(f"GUI service did not become {'available' if expected else 'unavailable'}")

        async def connect(endpoint, origin="https://atcoder.jp", host=None):
            headers = {}
            if origin is not None:
                headers["Origin"] = origin
            if host is not None:
                headers["Host"] = host
            client = await websocket_connect(HTTPRequest(
                f"ws://127.0.0.1:{port}/{endpoint}", headers=headers))
            clients.append(client)
            return client

        try:
            await ready()
            record("Packaged GUI started from a path with spaces and Unicode.")
            app = Application(backend="uia").connect(process=proc.pid, timeout=20)
            window = app.window(title="OJBetter_Bridge")
            window.wait("visible", timeout=20)
            window.capture_as_image().save(str(report / "gui.png"))
            for endpoint in ["file", "cpp"]:
                for origin, host in [
                    ("https://evil.example", None), (None, None),
                    ("https://atcoder.jp", "evil.example:2323"),
                ]:
                    try:
                        await connect(endpoint, origin, host)
                    except HTTPClientError as error:
                        if error.code != 403:
                            raise
                    else:
                        raise AssertionError("Unsafe handshake was accepted")
            record("Malicious origins, missing Origin and rebinding Hosts rejected.")

            files = await connect("file")
            files.write_message(json.dumps({"type": "info"}))
            info = json.loads(await asyncio.wait_for(files.read_message(), 10))
            if (info.get("bridge") != "OJBetter_Bridge" or
                    info.get("protocolVersion") != 1 or
                    info.get("workspaceRoot") != (root / "workspaces").resolve().as_posix() or
                    info.get("languages") != ["cpp"]):
                raise AssertionError(f"Unexpected Bridge information: {info}")
            record("Version discovery returned the actual Unicode workspace path.")
            files.write_message(json.dumps({
                "type": "update", "workspace": ".", "filename": "config",
                "fileExtension": ".yml", "code": "overwrite",
            }))
            if json.loads(await asyncio.wait_for(files.read_message(), 10))["result"] != "error":
                raise AssertionError("Installation overwrite was accepted")
            if (root / "config.yml").read_text(encoding="utf-8") != configuration:
                raise AssertionError("Configuration was changed")
            code = "int answer = 42;\nint main() { return answer; }\n"
            files.write_message(json.dumps({
                "type": "update", "workspace": "cpp_workspace", "filename": "12345678",
                "fileExtension": ".cpp", "code": code,
            }))
            if json.loads(await asyncio.wait_for(files.read_message(), 10))["result"] != "ok":
                raise AssertionError("Source update failed")
            source = Path(info["workspaceRoot"]) / "cpp_workspace/12345678.cpp"
            if source.read_text(encoding="utf-8") != code:
                raise AssertionError("Source file contents differ")
            record("Source synchronized; installation files protected.")

            language = await connect("cpp")

            async def response(request_id):
                async def read():
                    while True:
                        raw = await language.read_message()
                        if raw is None:
                            raise RuntimeError("Language server connection closed")
                        message = json.loads(raw)
                        if message.get("id") == request_id:
                            return message
                return await asyncio.wait_for(read(), 30)

            language.write_message(json.dumps({
                "jsonrpc": "2.0", "id": 1, "method": "initialize",
                "params": {"processId": None, "rootUri": source.parent.as_uri(), "capabilities": {}},
            }))
            if "capabilities" not in (await response(1)).get("result", {}):
                raise AssertionError("clangd initialize failed")
            language.write_message(json.dumps({
                "jsonrpc": "2.0", "method": "initialized", "params": {}}))
            language.write_message(json.dumps({
                "jsonrpc": "2.0", "method": "textDocument/didOpen",
                "params": {"textDocument": {
                    "uri": source.as_uri(), "languageId": "cpp", "version": 1, "text": code}},
            }))
            language.write_message(json.dumps({
                "jsonrpc": "2.0", "id": 2, "method": "textDocument/hover",
                "params": {"textDocument": {"uri": source.as_uri()},
                           "position": {"line": 1, "character": 22}},
            }))
            if "answer" not in json.dumps((await response(2)).get("result")):
                raise AssertionError("clangd hover failed")
            record("Packaged GUI launched real clangd; initialize and C++ hover passed.")
            language.close()
            files.close()
            for _ in range(100):
                if not source.exists():
                    break
                await asyncio.sleep(0.1)
            if source.exists():
                raise AssertionError("Source was not removed after disconnect")
            record("Windows source cleanup passed.")

            window.child_window(title="Stop", control_type="Button").invoke()
            await ready(False)
            window.child_window(title="Start", control_type="Button").invoke()
            await ready()
            # Keep a socket open so restart completion is observable.
            before_restart = await connect("file")
            window.child_window(title="Restart", control_type="Button").invoke()
            if await asyncio.wait_for(before_restart.read_message(), 15) is not None:
                raise AssertionError("Restart did not close the old connection")
            await ready()
            reconnected = await connect("file")
            reconnected.close()
            record("Native GUI Stop, Start and Restart buttons passed.")
            window.capture_as_image().save(str(report / "gui.png"))
            window.child_window(title="Stop", control_type="Button").invoke()
            await ready(False)
            record("PASS")
        except BaseException:
            try:
                from PIL import ImageGrab
                ImageGrab.grab().save(report / "failure.png")
            except Exception:
                pass
            raise
        finally:
            for client in clients:
                client.close()
            await asyncio.sleep(0.2)
            http.close()
            # Include children on failure so clangd cannot survive the test.
            subprocess.run(
                ["taskkill", "/PID", str(proc.pid), "/T", "/F"],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
            await asyncio.to_thread(proc.wait, timeout=10)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()
    if sys.platform != "win32":
        parser.error("Run the packaged GUI check on Windows.")
    args.report.mkdir(parents=True, exist_ok=True)
    asyncio.run(exercise(args.package.resolve(), args.report.resolve()))


if __name__ == "__main__":
    main()
