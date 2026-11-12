import asyncio
import ast
import json
import ntpath
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from tornado.httpclient import AsyncHTTPClient, HTTPClientError, HTTPRequest
from tornado.testing import AsyncHTTPTestCase, gen_test
from tornado.websocket import websocket_connect

BRIDGE_DIRECTORY = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BRIDGE_DIRECTORY))

from bridge_handlers import LanguageServerWebSocketHandler, create_application
from bridge_security import (
    ALLOWED_ORIGINS, MAX_CODE_BYTES, SourceFiles, is_allowed_origin, is_loopback_authority,
    require_loopback_host,
)


def update(**overrides):
    message = {
        "type": "update", "workspace": "cpp_workspace",
        "filename": "12345678", "fileExtension": ".cpp",
        "code": "int main() { return 0; }\n",
    }
    return {**message, **overrides}


class SecurityPolicyTests(unittest.TestCase):
    def test_only_explicit_https_origins(self):
        for origin in ALLOWED_ORIGINS:
            self.assertTrue(is_allowed_origin(origin))
        for origin in [
            None, "", "null", "https://evil.example", "http://codeforces.com",
            "https://codeforces.com.evil.example", "https://codeforces.com@evil.example",
            "https://evil.codeforces.com", "https://atcoder.jp:443",
            "https://atcoder.jp/", "https://atcoder.jp:8443",
        ]:
            with self.subTest(origin=origin):
                self.assertFalse(is_allowed_origin(origin))

    def test_refuses_network_bind(self):
        for host in ["127.0.0.1", "::1", "localhost"]:
            require_loopback_host(host)
        for host in ["0.0.0.0", "::", "192.168.1.1", "attacker.example", None]:
            with self.assertRaises(ValueError):
                require_loopback_host(host)

    def test_host_header_accepts_only_loopback_authorities(self):
        for authority in ["127.0.0.1:2323", "[::1]:2323", "localhost", "localhost:80"]:
            self.assertTrue(is_loopback_authority(authority))
        for authority in [
            "evil.example:2323", "127.0.0.1.evil.example:2323",
            "user@localhost:2323", "localhost:2323/path",
            "localhost:2323?query", "localhost:2323#fragment",
            "localhost:0", "localhost:99999", "", None,
        ]:
            self.assertFalse(is_loopback_authority(authority))

    def test_both_servers_use_shared_handlers_without_shell_launches(self):
        for filename in ["server_cli.py", "server_gui.py"]:
            source = (BRIDGE_DIRECTORY / filename).read_text()
            tree = ast.parse(source)
            self.assertIn("create_application(", source)
            self.assertIn("require_loopback_host(", source)
            self.assertNotIn("def check_origin", source)
            self.assertNotIn("shell=True", source)
            self.assertFalse(any(
                isinstance(node, ast.ClassDef) and node.name.endswith("WebSocketHandler")
                for node in ast.walk(tree)))

    def test_windows_process_arguments_preserve_spaces_without_a_shell(self):
        handler = object.__new__(LanguageServerWebSocketHandler)
        command = [r"C:\Program Files\LLVM\bin\clangd.exe", "--log=error"]
        root = r"C:\Users\Test User\OJBetter_Bridge\workspaces"
        handler.initialize(commands={"cpp": command},
                           source_files=SimpleNamespace(root=root))
        with patch("bridge_handlers.subprocess.CREATE_NO_WINDOW", 0x08000000, create=True), patch(
                "bridge_handlers.subprocess.Popen") as spawn, patch(
                "bridge_handlers.os", SimpleNamespace(path=ntpath)), patch(
                "bridge_handlers.threading.Thread"), patch("bridge_handlers.ioloop.IOLoop.current"):
            handler.open("cpp")
            args, options = spawn.call_args
            self.assertEqual(args, (command,))
            self.assertFalse(options.get("shell", False))
            self.assertEqual(options["creationflags"], 0x08000000)
            self.assertEqual(options["cwd"], root + r"\cpp_workspace")


class SourceFileTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.install = Path(self.temporary.name).resolve()
        self.files = SourceFiles(self.install)
        self.owner = object()

    def tearDown(self):
        for owner in list(self.files.owners):
            self.files.close(owner)
        self.temporary.cleanup()

    def test_source_lifecycle_and_all_languages(self):
        for workspace, filename, extension in [
            ("cpp_workspace", "12345678", ".cpp"),
            ("python_workspace", "12345678", ".py"),
            ("java_workspace", "hello/src/12345678", ".java"),
        ]:
            owner = object()
            message = update(workspace=workspace, filename=filename,
                             fileExtension=extension, code="源代码\n")
            path = Path(self.files.update(owner, message))
            self.assertEqual(path.read_text(), "源代码\n")
            self.files.update(owner, {**message, "code": "x"})
            self.assertEqual(path.read_text(), "x")
            self.files.close(owner)
            self.assertFalse(path.exists())

    def test_install_overwrite_and_arbitrary_names_are_rejected(self):
        protected = self.install / "config.yml"
        protected.write_text("original")
        cases = [
            update(workspace=".", filename="config", fileExtension=".yml"),
            update(workspace=".", filename="path_utils", fileExtension=".py"),
            update(workspace="../", filename="server_cli", fileExtension=".py"),
            update(workspace="/tmp", filename="12345678"),
            update(filename="../../config"),
            update(filename="12345678/../../config"),
            update(filename=r"..\..\config"),
            update(filename="hello/src/../../config"),
            update(filename="12345678", fileExtension=".py"),
            update(filename="12345678", fileExtension=".cpp/../../../config.yml"),
            update(filename=None), update(workspace=[]), update(code=42),
            update(code="x" * (MAX_CODE_BYTES + 1)), None, [], {"type": "delete"},
        ]
        for message in cases:
            with self.subTest(message=str(message)[:100]):
                with self.assertRaises((ValueError, TypeError)):
                    self.files.update(self.owner, message)
        self.assertEqual(protected.read_text(), "original")

    def test_preexisting_files_and_other_connections_are_not_overwritten(self):
        existing = Path(self.files.root) / "cpp_workspace/12345678.cpp"
        existing.write_text("keep")
        with self.assertRaises(FileExistsError):
            self.files.update(self.owner, update())
        self.files.close(self.owner)
        self.assertEqual(existing.read_text(), "keep")
        existing.unlink()
        self.files.update(self.owner, update())
        with self.assertRaises(FileExistsError):
            self.files.update(object(), update(code="overwrite"))
        self.files.close(object())
        self.assertEqual(existing.read_text(), update()["code"])

    def test_symlink_and_hardlink_targets_are_not_overwritten(self):
        victim = self.install / "path_utils.py"
        victim.write_text("original")
        target = Path(self.files.root) / "cpp_workspace/12345678.cpp"
        target.symlink_to(victim)
        with self.assertRaises((ValueError, FileExistsError)):
            self.files.update(self.owner, update())
        target.unlink()
        os.link(victim, target)
        with self.assertRaises(FileExistsError):
            self.files.update(self.owner, update())
        self.assertEqual(victim.read_text(), "original")

    def test_replaced_path_does_not_redirect_descriptor_or_cleanup(self):
        target = Path(self.files.update(self.owner, update()))
        victim = self.install / "config.yml"
        victim.write_text("original")
        try:
            target.unlink()
        except PermissionError:
            # Windows may prevent replacing an open file altogether.
            self.assertEqual(os.name, "nt")
            self.files.close(self.owner)
            self.assertFalse(target.exists())
            self.assertEqual(victim.read_text(), "original")
            return
        os.link(victim, target)
        self.files.update(self.owner, update(code="new source"))
        self.files.close(self.owner)
        self.assertEqual(victim.read_text(), "original")
        self.assertEqual(target.read_text(), "original")

    def test_workspace_symlinks_are_rejected(self):
        parent = self.install / "other"
        parent.mkdir()
        self.files.close(self.owner)
        python_dir = Path(self.files.root) / "python_workspace"
        python_dir.rmdir()
        python_dir.symlink_to(parent, target_is_directory=True)
        with self.assertRaises(ValueError):
            self.files.update(self.owner, update(
                workspace="python_workspace", fileExtension=".py"))
        with self.assertRaises(ValueError):
            SourceFiles(self.install)

    def test_one_connection_cannot_create_multiple_files(self):
        first = Path(self.files.update(self.owner, update()))
        with self.assertRaises(ValueError):
            self.files.update(self.owner, update(filename="87654321"))
        self.files.close(self.owner)
        self.assertFalse(first.exists())

    def test_windows_java_path_accepts_userscript_forward_slashes(self):
        files = SourceFiles.__new__(SourceFiles)
        files.root = r"C:\Users\Test User\OJBetter_Bridge\workspaces"
        expected = files.root + r"\java_workspace\hello\src\12345678.java"
        with patch("bridge_security.os", SimpleNamespace(path=ntpath)), patch(
                "bridge_security.resolve_path_within", return_value=expected):
            self.assertEqual(files.source_path(
                "java_workspace", "hello/src/12345678", ".java"), expected)

    def test_cleanup_closes_own_handle_before_unlinking(self):
        target = Path(self.files.update(self.owner, update()))
        descriptor = self.files.owners[self.owner][str(target)]
        unlink = os.unlink

        def windows_unlink(path):
            # Model Windows refusing deletion while our descriptor is open.
            with self.assertRaises(OSError):
                os.fstat(descriptor)
            unlink(path)

        with patch("bridge_security.os.unlink", side_effect=windows_unlink):
            self.files.close(self.owner)
        self.assertFalse(target.exists())

    def test_cleanup_tolerates_a_file_locked_by_another_program(self):
        target = Path(self.files.update(self.owner, update()))
        with patch("bridge_security.os.unlink", side_effect=PermissionError("File in use")):
            self.files.close(self.owner)
        self.assertEqual(self.files.owners, {})
        self.assertTrue(target.exists())


class BridgeWebSocketTests(AsyncHTTPTestCase):
    def get_app(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name).resolve()
        self.sockets = []
        (self.root / "config.yml").write_text("safe configuration")
        (self.root / "mycomplet").mkdir()
        (self.root / "mycomplet/template.json").write_text('{"safe": true}')
        self.connections = []
        # A deterministic harmless JSON-RPC echo process, not clangd or pylsp.
        echo = (
            "import sys,json\n"
            "while True:\n"
            " line=sys.stdin.buffer.readline()\n"
            " if not line: break\n"
            " if not line.lower().startswith(b'content-length:'): continue\n"
            " n=int(line.split(b':')[1])\n"
            " while sys.stdin.buffer.readline().strip(): pass\n"
            " msg=json.loads(sys.stdin.buffer.read(n))\n"
            " out=json.dumps({'jsonrpc':'2.0','id':msg['id'],'result':{'echo':msg['method']}}).encode()\n"
            " sys.stdout.buffer.write(b'Content-Length: '+str(len(out)).encode()+b'\\r\\n\\r\\n'+out);sys.stdout.buffer.flush()\n"
        )
        return create_application(
            self.root, {"cpp": [sys.executable, "-u", "-c", echo]},
            self.connections)

    def tearDown(self):
        for socket in self.sockets:
            socket.close()
        self.io_loop.run_sync(lambda: asyncio.sleep(0.03))
        self.temporary.cleanup()
        super().tearDown()

    async def connect(self, endpoint="file", origin="https://atcoder.jp",
                      host=None):
        headers = {}
        if origin is not None:
            headers["Origin"] = origin
        if host:
            headers["Host"] = host
        request = HTTPRequest(self.get_url("/" + endpoint).replace("http:", "ws:"),
                              headers=headers)
        socket = await websocket_connect(request)
        self.sockets.append(socket)
        return socket

    @gen_test
    async def test_rejects_untrusted_handshakes_before_any_process(self):
        with patch("bridge_handlers.subprocess.Popen") as spawn:
            for endpoint in ["file", "cpp", "python"]:
                for origin in [None, "null", "https://evil.example",
                               "https://atcoder.jp.evil.example",
                               "http://atcoder.jp"]:
                    with self.subTest(endpoint=endpoint, origin=origin):
                        with self.assertRaises(HTTPClientError) as error:
                            await self.connect(endpoint, origin=origin)
                        self.assertEqual(error.exception.code, 403)
            spawn.assert_not_called()
        self.assertEqual(self.connections, [])

    @gen_test
    async def test_rejects_rebinding_host(self):
        with self.assertRaises(HTTPClientError) as error:
            await self.connect(host="evil.example:2323")
        self.assertEqual(error.exception.code, 403)

    @gen_test
    async def test_trusted_origins_connect_without_credentials_or_subprotocol(self):
        for origin in ALLOWED_ORIGINS:
            client = await self.connect(origin=origin)
            self.assertIsNone(client.selected_subprotocol)
            client.write_message(json.dumps(update()))
            self.assertEqual(json.loads(await client.read_message())["result"], "ok")
            client.close()
            target = self.root / "workspaces/cpp_workspace/12345678.cpp"
            for _ in range(30):
                if not target.exists():
                    break
                await asyncio.sleep(0.01)
            self.assertFalse(target.exists())

    @gen_test
    async def test_trusted_origin_file_updates_reject_the_reported_overwrite(self):
        socket = await self.connect()
        self.assertIsNone(socket.selected_subprotocol)
        socket.write_message(json.dumps(update(
            workspace=".", filename="config", fileExtension=".yml", code="attack")))
        self.assertEqual(json.loads(await socket.read_message())["result"], "error")
        self.assertEqual((self.root / "config.yml").read_text(), "safe configuration")
        socket.write_message("{invalid")
        self.assertEqual(json.loads(await socket.read_message())["result"], "error")
        socket.write_message(json.dumps(update()))
        self.assertEqual(json.loads(await socket.read_message())["result"], "ok")
        target = self.root / "workspaces/cpp_workspace/12345678.cpp"
        self.assertEqual(target.read_text(), update()["code"])
        socket.close()
        for _ in range(30):
            if not target.exists():
                break
            await asyncio.sleep(0.01)
        self.assertFalse(target.exists())
        self.assertTrue((self.root / "config.yml").exists())

    @gen_test
    async def test_bridge_info_is_read_only_and_reports_the_actual_workspace(self):
        with patch("bridge_handlers.subprocess.Popen") as spawn:
            client = await self.connect()
            client.write_message(json.dumps({"type": "info"}))
            info = json.loads(await client.read_message())
            self.assertEqual(info, {
                "type": "info", "bridge": "OJBetter_Bridge",
                "version": "1.0.0", "protocolVersion": 1,
                "capabilities": ["workspace-info"],
                "workspaceRoot": (self.root / "workspaces").as_posix(),
                "languages": ["cpp"],
            })
            spawn.assert_not_called()
            self.assertEqual(list((self.root / "workspaces").rglob("*.cpp")), [])
            # Querying info on a file-owning connection must not change ownership.
            client.write_message(json.dumps(update()))
            self.assertEqual(json.loads(await client.read_message())["result"], "ok")
            client.write_message(json.dumps({"type": "info"}))
            self.assertEqual(json.loads(await client.read_message()), info)
            target = self.root / "workspaces/cpp_workspace/12345678.cpp"
            self.assertEqual(target.read_text(), update()["code"])
            client.close()
            for _ in range(100):
                if not target.exists():
                    break
                await asyncio.sleep(0.01)
            self.assertFalse(target.exists())

    @gen_test
    async def test_only_owner_connection_can_update_or_delete_a_file(self):
        first, second = await self.connect(), await self.connect(origin="https://codeforces.com")
        first.write_message(json.dumps(update()))
        self.assertEqual(json.loads(await first.read_message())["result"], "ok")
        second.write_message(json.dumps(update(code="overwrite")))
        self.assertEqual(json.loads(await second.read_message())["result"], "error")
        second.close()
        await asyncio.sleep(0.03)
        target = self.root / "workspaces/cpp_workspace/12345678.cpp"
        self.assertEqual(target.read_text(), update()["code"])

    @gen_test
    async def test_legitimate_language_server_request_still_works(self):
        socket = await self.connect("cpp", origin="https://codeforces.com")
        socket.write_message(json.dumps({"jsonrpc": "2.0", "id": 1, "method": "initialize"}))
        response = json.loads(await socket.read_message())
        self.assertEqual(response["result"]["echo"], "initialize")
        handler = self.connections[0]
        proc = handler.proc
        socket.close()
        for _ in range(100):
            if proc.poll() is not None:
                break
            await asyncio.sleep(0.01)
        self.assertIsNotNone(proc.poll())

    @gen_test
    async def test_http_does_not_expose_installation_files(self):
        home = await self.http_client.fetch(self.get_url("/"))
        self.assertNotIn("Access-Control-Allow-Origin", home.headers)
        for endpoint in ["/server_cli.py", "/config.yml", "/mycomplet/../config.yml"]:
            response = await self.http_client.fetch(self.get_url(endpoint), raise_error=False)
            self.assertIn(response.code, [400, 404])
        completion = await self.http_client.fetch(self.get_url("/mycomplet/template.json"))
        self.assertEqual(json.loads(completion.body), {"safe": True})


@unittest.skipUnless(shutil.which("clangd"), "Requires a local clangd installation")
class CLIClangdIntegrationTests(unittest.IsolatedAsyncioTestCase):
    async def test_real_cli_file_and_language_server_without_credentials(self):
        """Boot an isolated install and exercise the real C++ server over WS."""
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            for filename in ["server_cli.py", "bridge_handlers.py", "bridge_security.py", "path_utils.py"]:
                shutil.copyfile(BRIDGE_DIRECTORY / filename, root / filename)
            with socket.socket() as reservation:
                reservation.bind(("127.0.0.1", 0))
                port = reservation.getsockname()[1]
            (root / "config.yml").write_text(json.dumps({
                "host": "127.0.0.1", "port": port,
                "commands": {"cpp": [shutil.which("clangd"), "--log=error"]},
            }))
            server = subprocess.Popen(
                [sys.executable, "-u", str(root / "server_cli.py")],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            clients = []
            http = AsyncHTTPClient(force_instance=True)
            try:
                for _ in range(100):
                    self.assertIsNone(server.poll(), "Bridge exited during startup")
                    try:
                        await http.fetch(f"http://127.0.0.1:{port}/", request_timeout=0.2)
                        break
                    except (OSError, HTTPClientError):
                        await asyncio.sleep(0.03)
                else:
                    self.fail("Bridge failed to start")

                async def connect(endpoint, origin="https://codeforces.com"):
                    request = HTTPRequest(
                        f"ws://127.0.0.1:{port}/{endpoint}",
                        headers={"Origin": origin})
                    client = await websocket_connect(request)
                    clients.append(client)
                    return client

                for endpoint in ["cpp", "file"]:
                    with self.assertRaises(HTTPClientError) as denied:
                        await connect(endpoint, "https://evil.example")
                    self.assertEqual(denied.exception.code, 403)

                files = await connect("file")
                files.write_message(json.dumps({"type": "info"}))
                info = json.loads(await files.read_message())
                self.assertEqual(info["protocolVersion"], 1)
                self.assertEqual(info["workspaceRoot"], (root / "workspaces").as_posix())
                self.assertEqual(info["languages"], ["cpp"])
                code = "int answer = 42;\nint main() { return answer; }\n"
                files.write_message(json.dumps(update(code=code)))
                self.assertEqual(json.loads(await files.read_message())["result"], "ok")
                workspace = root / "workspaces/cpp_workspace"
                source = workspace / "12345678.cpp"
                self.assertEqual(source.read_text(), code)

                language = await connect("cpp")

                async def response(request_id):
                    async def read():
                        while True:
                            raw = await language.read_message()
                            self.assertIsNotNone(raw, "Language server closed unexpectedly")
                            message = json.loads(raw)
                            if message.get("id") == request_id:
                                return message
                    return await asyncio.wait_for(read(), timeout=15)

                language.write_message(json.dumps({
                    "jsonrpc": "2.0", "id": 1, "method": "initialize",
                    "params": {"processId": None, "rootUri": workspace.as_uri(),
                               "capabilities": {}},
                }))
                initialized = await response(1)
                self.assertIn("capabilities", initialized["result"])
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
                hover = await response(2)
                self.assertIn("answer", json.dumps(hover["result"]))
                language.write_message(json.dumps({
                    "jsonrpc": "2.0", "id": 3, "method": "shutdown", "params": None}))
                self.assertIsNone((await response(3))["result"])
                language.write_message(json.dumps({"jsonrpc": "2.0", "method": "exit"}))
                language.close()
                files.close()
                for _ in range(100):
                    if not source.exists():
                        break
                    await asyncio.sleep(0.02)
                self.assertFalse(source.exists())
                self.assertTrue((root / "config.yml").exists())
            finally:
                for client in clients:
                    client.close()
                await asyncio.sleep(0.05)
                http.close()
                server.terminate()
                output, _ = await asyncio.to_thread(server.communicate, timeout=5)
                self.assertNotIn("Traceback", output.decode(errors="replace"))
                self.assertFalse((root / ".bridge-token").exists())


class GUIBackendTests(unittest.IsolatedAsyncioTestCase):
    async def test_real_gui_backend_start_stop_restart_without_qt(self):
        """Run the GUI's actual backend class with only UI notifications replaced."""
        import threading
        import yaml
        from tornado import httpserver, ioloop

        tree = ast.parse((BRIDGE_DIRECTORY / "server_gui.py").read_text())
        backend = ast.Module(body=[
            node for node in tree.body
            if isinstance(node, ast.ClassDef) and node.name in ("CommandChecker", "WebServer")
        ], type_ignores=[])
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            with socket.socket() as reservation:
                reservation.bind(("127.0.0.1", 0))
                port = reservation.getsockname()[1]
            namespace = dict(
                asyncio=asyncio, os=os, threading=threading, shutil=shutil,
                yaml=yaml, httpserver=httpserver, ioloop=ioloop,
                create_application=create_application, require_loopback_host=require_loopback_host,
                rootUri=str(root),
                config=SimpleNamespace(host="127.0.0.1", port=port, commands={}))
            exec(compile(backend, "server_gui.py", "exec"), namespace)
            events = []
            server = namespace["WebServer"](
                lambda *args: events.append(args),
                lambda *args: events.append(args),
                lambda *args: events.append(args))
            http = AsyncHTTPClient(force_instance=True)
            clients = []

            async def settled():
                for _ in range(200):
                    if not server._pending:
                        return
                    await asyncio.sleep(0.01)
                self.fail("GUI backend operation timed out")

            async def connect(origin="https://atcoder.jp"):
                client = await websocket_connect(HTTPRequest(
                    f"ws://127.0.0.1:{port}/file", headers={"Origin": origin}))
                clients.append(client)
                return client

            try:
                server.start_server()
                # Double-clicking Start must not launch a second worker.
                server.start_server()
                await settled()
                self.assertIsNotNone(server.webserver, events)
                worker = server.server_thread
                response = await http.fetch(f"http://127.0.0.1:{port}/")
                self.assertEqual(response.code, 200)
                with self.assertRaises(HTTPClientError) as denied:
                    await connect("https://evil.example")
                self.assertEqual(denied.exception.code, 403)
                client = await connect()
                client.write_message(json.dumps({"type": "info"}))
                self.assertEqual(json.loads(await client.read_message())["workspaceRoot"],
                                 (root / "workspaces").as_posix())
                client.write_message(json.dumps(update()))
                self.assertEqual(json.loads(await client.read_message())["result"], "ok")
                target = root / "workspaces/cpp_workspace/12345678.cpp"
                self.assertTrue(target.exists())

                server.restart_server()
                await settled()
                self.assertIs(server.server_thread, worker)
                self.assertEqual((await http.fetch(f"http://127.0.0.1:{port}/")).code, 200)
                self.assertIsNone(await asyncio.wait_for(client.read_message(), 5))
                for _ in range(100):
                    if not target.exists():
                        break
                    await asyncio.sleep(0.01)
                self.assertFalse(target.exists())

                server.stop_server()
                await settled()
                self.assertIsNone(server.webserver)
                with self.assertRaises((OSError, HTTPClientError)):
                    await http.fetch(f"http://127.0.0.1:{port}/", request_timeout=0.5)
                # A failed bind must leave Start usable and reuse the worker.
                with socket.socket() as occupied:
                    occupied.bind(("127.0.0.1", 0))
                    occupied.listen()
                    namespace["config"].port = occupied.getsockname()[1]
                    server.start_server()
                    await settled()
                    self.assertIsNone(server.webserver)
                namespace["config"].port = port
                server.start_server()
                await settled()
                self.assertIs(server.server_thread, worker)
                self.assertEqual((await http.fetch(f"http://127.0.0.1:{port}/")).code, 200)
            finally:
                for client in clients:
                    client.close()
                await settled()
                if server.webserver is not None:
                    server.stop_server()
                    await settled()
                if server.server_loop is not None:
                    server.server_loop.add_callback(server.server_loop.stop)
                    await asyncio.to_thread(server.server_thread.join, 5)
                    self.assertFalse(server.server_thread.is_alive())
                http.close()


if __name__ == "__main__":
    unittest.main()
