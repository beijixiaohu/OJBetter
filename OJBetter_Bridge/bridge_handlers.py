"""Shared HTTP/WebSocket implementation for both bridge entry points."""

import json
import os
import subprocess
import threading
from pathlib import Path

from tornado import ioloop, web, websocket

from bridge_security import (
    MAX_CODE_BYTES, SourceFiles, is_allowed_origin,
    is_loopback_authority,
)
from path_utils import resolve_path_within


class HomeRequestHandler(web.RequestHandler):
    def get(self):
        self.write("<h1>Welcome to OJBetter_Bridge</h1>")


class MyCompletJsonHandler(web.RequestHandler):
    def initialize(self, rootUri):
        self.root_uri = rootUri

    def get(self, filename):
        try:
            if not filename.endswith(".json"):
                raise ValueError("Only JSON completion files are supported")
            path = resolve_path_within(
                os.path.join(self.root_uri, "mycomplet"), filename)
        except (TypeError, ValueError) as exc:
            raise web.HTTPError(400, reason="Invalid completion file path") from exc
        try:
            with open(path, encoding="utf-8") as completions:
                self.set_header("Content-Type", "application/json")
                self.write(completions.read())
        except (OSError, UnicodeError) as exc:
            raise web.HTTPError(404) from exc


class LocalWebSocketHandler(websocket.WebSocketHandler):
    def initialize(self, connections=None, update_log=None, **kwargs):
        self.connections = connections if connections is not None else []
        self.update_log = update_log or (lambda level, text: None)
        self.connected = False

    def prepare(self):
        # Tornado skips check_origin if Origin is absent. Require it explicitly
        # before open() can create files or spawn a process.
        if not is_allowed_origin(self.request.headers.get("Origin")):
            raise web.HTTPError(403, reason="Origin is not allowed")
        if not is_loopback_authority(self.request.host):
            raise web.HTTPError(403, reason="Invalid local bridge host")

    def check_origin(self, origin):
        return is_allowed_origin(origin)

    def open(self, *args):
        self.connected = True
        self.connections.append(self)

    def on_close(self):
        if self in self.connections:
            self.connections.remove(self)


class FileServerWebSocketHandler(LocalWebSocketHandler):
    def initialize(self, source_files, commands, **kwargs):
        super().initialize(**kwargs)
        self.source_files = source_files
        self.commands = commands

    def on_message(self, message):
        try:
            data = json.loads(message)
            if isinstance(data, dict) and data.get("type") == "info":
                self.write_message({
                    "type": "info", "bridge": "OJBetter_Bridge",
                    "version": "1.0.0", "protocolVersion": 1,
                    "capabilities": ["workspace-info"],
                    "workspaceRoot": Path(self.source_files.root).as_posix(),
                    "languages": sorted(set(self.commands) & {"cpp", "python", "java"}),
                })
                return
            self.source_files.update(self, data)
        except (ValueError, TypeError, OSError, UnicodeError):
            self.write_message({"result": "error", "description": "Invalid source update"})
            return
        self.write_message({"result": "ok"})

    def on_close(self):
        self.source_files.close(self)
        super().on_close()


class LanguageServerWebSocketHandler(LocalWebSocketHandler):
    def initialize(self, commands, source_files, **kwargs):
        super().initialize(**kwargs)
        self.commands = commands
        self.source_files = source_files
        self.proc = None
        self.writer = None

    def open(self, language):
        super().open(language)
        if language not in self.commands:
            self.close(1008, "Unsupported language")
            return
        command = self.commands[language]
        if (not isinstance(command, list) or not command or
                any(not isinstance(item, str) for item in command)):
            self.close(1011, "Invalid language server command")
            return
        from pylsp_jsonrpc import streams

        try:
            # A configured argument vector is executed directly, never by a shell.
            self.proc = subprocess.Popen(
                command, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                cwd=os.path.join(self.source_files.root, language + "_workspace"),
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        except OSError:
            self.close(1011, "Could not start language server")
            return
        self.writer = streams.JsonRpcStreamWriter(self.proc.stdin)
        proc = self.proc
        loop = ioloop.IOLoop.current()

        def forward(message):
            if self.ws_connection and not self.ws_connection.is_closing():
                self.write_message(message)

        def consume():
            reader = streams.JsonRpcStreamReader(proc.stdout)
            reader.listen(lambda message: loop.add_callback(forward, message))

        threading.Thread(target=consume, daemon=True).start()

    def on_message(self, message):
        try:
            data = json.loads(message)
            if not isinstance(data, dict):
                raise ValueError("Expected JSON-RPC object")
        except (ValueError, TypeError):
            self.close(1007, "Invalid JSON-RPC message")
            return
        if self.writer:
            self.writer.write(data)

    def on_close(self):
        if self.proc is not None:
            proc, self.proc = self.proc, None
            if proc.stdin:
                try:
                    proc.stdin.close()
                except OSError:
                    pass  # The language server may have exited already.
            if proc.poll() is None:
                try:
                    proc.terminate()
                except ProcessLookupError:
                    pass
            # Reap without blocking the IOLoop or leaving a stopped server behind.
            def reap():
                try:
                    proc.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    try:
                        proc.kill()
                    except ProcessLookupError:
                        pass
                    proc.wait()
                finally:
                    proc.stdout.close()
            threading.Thread(target=reap, daemon=True).start()
        super().on_close()


def create_application(root_uri, commands, connections=None, update_log=None):
    source_files = SourceFiles(root_uri)
    shared = dict(connections=connections, update_log=update_log)
    return web.Application([
        (r"/", HomeRequestHandler),
        (r"/mycomplet/(.*)", MyCompletJsonHandler, dict(rootUri=root_uri)),
        (r"/file", FileServerWebSocketHandler,
         dict(source_files=source_files, commands=commands, **shared)),
        (r"/(cpp|python|java)", LanguageServerWebSocketHandler,
         dict(commands=commands, source_files=source_files, **shared)),
    ], websocket_max_message_size=MAX_CODE_BYTES + 65536)
