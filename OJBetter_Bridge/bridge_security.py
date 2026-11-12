"""Local connection policy and the bridge's bounded source-file workspace."""

import ipaddress
import os
import re
from urllib.parse import urlsplit

from path_utils import resolve_path_within


ALLOWED_ORIGINS = frozenset({
    "https://atcoder.jp",
    "https://codeforces.com",
    "https://www.codeforces.com",
    "https://m1.codeforces.com",
    "https://m2.codeforces.com",
    "https://m3.codeforces.com",
    "https://codeforc.es",
    "https://www.codeforc.es",
})
WORKSPACES = {
    "cpp_workspace": ".cpp",
    "python_workspace": ".py",
    "java_workspace": ".java",
}
MAX_CODE_BYTES = 2 * 1024 * 1024


def is_allowed_origin(origin):
    # Compare serialized origins, not suffixes: reject null, paths, userinfo,
    # non-default ports, lookalike hosts and the missing-Origin case too.
    return isinstance(origin, str) and origin in ALLOWED_ORIGINS


def require_loopback_host(host):
    if host == "localhost":
        return
    try:
        if ipaddress.ip_address(host).is_loopback:
            return
    except ValueError:
        pass
    raise ValueError("Bridge must listen on a loopback address")


def is_loopback_authority(authority):
    try:
        parts = urlsplit("//" + authority)
        require_loopback_host(parts.hostname)
        port = parts.port
        return (not parts.username and not parts.password and
                not parts.path and not parts.query and not parts.fragment and
                (port is None or 0 < port <= 65535))
    except (AttributeError, TypeError, ValueError):
        return False


class SourceFiles:
    """Only numeric source files in fixed workspaces, owned by a connection.

    Existing files are never adopted or truncated. Keeping an exclusive file
    descriptor for each newly created source also prevents a later symlink or
    hard-link replacement from redirecting writes to a bridge module.
    """

    def __init__(self, install_directory):
        self.install_directory = os.path.realpath(install_directory)
        self.root = self._directory(self.install_directory, "workspaces")
        self.owners = {}
        for workspace in WORKSPACES:
            directory = self._directory(self.root, workspace)
            if workspace == "java_workspace":
                directory = self._directory(directory, "hello")
                self._directory(directory, "src")

    @staticmethod
    def _directory(parent, name):
        path = os.path.join(parent, name)
        os.makedirs(path, mode=0o700, exist_ok=True)
        if os.path.islink(path) or os.path.realpath(path) != path:
            raise ValueError("Workspace directories must not be symbolic links")
        if not os.path.isdir(path):
            raise ValueError("Invalid workspace directory")
        return path

    def source_path(self, workspace, filename, extension):
        if not isinstance(workspace, str) or workspace not in WORKSPACES:
            raise ValueError("Unsupported workspace")
        if extension != WORKSPACES[workspace] or not isinstance(filename, str):
            raise ValueError("Unsupported source filename")
        pattern = r"hello/src/[0-9]{8}" if workspace == "java_workspace" else r"[0-9]{8}"
        if not re.fullmatch(pattern, filename):
            raise ValueError("Unsupported source filename")
        expected = os.path.normpath(os.path.join(
            self.root, workspace, filename + extension))
        actual = resolve_path_within(self.root, workspace, filename + extension)
        if actual != expected or os.path.islink(expected):
            raise ValueError("Source paths must not be symbolic links")
        return expected

    def update(self, owner, message):
        if not isinstance(message, dict) or message.get("type") != "update":
            raise ValueError("Expected a source update")
        code = message.get("code")
        if not isinstance(code, str) or len(code.encode("utf-8")) > MAX_CODE_BYTES:
            raise ValueError("Invalid or oversized source")
        path = self.source_path(
            message.get("workspace"), message.get("filename"),
            message.get("fileExtension"))
        files = self.owners.get(owner, {})
        # Each editor uses one source. Do not turn one socket into unbounded
        # file creation, and never delete a pre-existing user file on close.
        if files and path not in files:
            raise ValueError("A connection may update only its own source file")
        descriptor = files.get(path)
        if descriptor is None:
            descriptor = os.open(
                path, os.O_WRONLY | os.O_CREAT | os.O_EXCL |
                getattr(os, "O_NOFOLLOW", 0), 0o600)
            self.owners[owner] = {path: descriptor}
        with os.fdopen(os.dup(descriptor), "w", encoding="utf-8", newline="") as source:
            source.seek(0)
            source.write(code)
            source.truncate()
        return path

    def close(self, owner):
        for path, descriptor in self.owners.pop(owner, {}).items():
            try:
                owned = os.fstat(descriptor)
            finally:
                # Windows refuses to delete a file while our handle is open.
                os.close(descriptor)
            try:
                current = os.lstat(path)
                if (owned.st_dev, owned.st_ino) == (current.st_dev, current.st_ino):
                    os.unlink(path)
            except (FileNotFoundError, PermissionError):
                # Another program may still hold the file on Windows. Leave it
                # in place rather than disrupting connection cleanup.
                pass
