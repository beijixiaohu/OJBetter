"""Build a Windows GUI distribution without copying local runtime files."""

import argparse
import hashlib
from importlib.metadata import version
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("dist"))
    args = parser.parse_args()
    if sys.platform != "win32":
        parser.error("Build the Windows package on Windows.")
    source = Path(__file__).resolve().parent
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    build = output / "build"
    build.mkdir(exist_ok=True)
    subprocess.run([
        sys.executable, "-m", "PyInstaller", "--noconfirm", "--clean",
        "--onedir", "--windowed", "--name", "server_gui",
        "--distpath", str(output / "pyinstaller"),
        "--workpath", str(build), "--specpath", str(build),
        "--collect-data", "qfluentwidgets",
        "--collect-data", "qframelesswindow",
        "--hidden-import", "pylsp_jsonrpc.streams",
        str(source / "server_gui.py"),
    ], check=True)
    package = output / "OJBetter_Bridge"
    if package.exists():
        shutil.rmtree(package)
    shutil.copytree(output / "pyinstaller/server_gui", package)
    # Explicit allowlist: never package local workspaces or configuration.
    for filename in [
        "server_cli.py", "server_gui.py", "bridge_handlers.py",
        "bridge_security.py", "path_utils.py", "requirements.txt",
        "requirements-windows.txt", "README.md",
    ]:
        shutil.copy2(source / filename, package / filename)
    for directory in ["src", "mycomplet"]:
        shutil.copytree(source / directory, package / directory)
    (package / "config.yml").write_text(
        "commands:\n  cpp:\n  - clangd\n  python:\n  - pylsp\n"
        "host: 127.0.0.1\nport: 2323\n", encoding="utf-8")
    (package / "build-info.json").write_text(json.dumps({
        "commit": os.environ.get("GITHUB_SHA", ""),
        "run_id": os.environ.get("GITHUB_RUN_ID", ""),
        "python": sys.version,
        "dependencies": {name: version(name) for name in [
            "tornado", "PyYAML", "python-lsp-jsonrpc",
            "PyQt5", "PyQt-Fluent-Widgets", "pyinstaller",
        ]},
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    archive = Path(shutil.make_archive(
        str(output / "OJBetter_Bridge-windows-x64"), "zip",
        root_dir=output, base_dir=package.name))
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    archive.with_suffix(".zip.sha256").write_text(
        f"{digest}  {archive.name}\n", encoding="ascii")
    print(f"Built {archive}")


if __name__ == "__main__":
    main()
