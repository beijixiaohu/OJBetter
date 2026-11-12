import os
import argparse
import yaml
from tornado import ioloop, httpserver
import shutil
from bridge_handlers import create_application
from bridge_security import require_loopback_host

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-c", "--config", type=str,
                        default="config.yml", help="yaml configuration")
    args = parser.parse_args()

    file_dir_path = os.path.dirname(os.path.abspath(__file__))

    config_path = os.path.join(file_dir_path, args.config)

    config = None
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    rootUri = os.path.dirname(os.path.abspath(__file__))

    for lang in config['commands'].keys():
        command = config['commands'][lang][0]
        if shutil.which(command):
            print(f"\033[1;32m[CHECK] {lang} command is valid \u2714\033[0m")
        else:
            if lang == "cpp":
                print("""\033[1;31m[CHECK] The command for C++ is invalid. 
            If you used on Windows, Please download clangd-windows-xxx.zip from https://github.com/clangd/clangd/releases/, 
            extract it to your preferred location, and add the xxx/clangd_xxx/bin path to the system environment variable path.\033[0m""")
            elif lang == "python":
                print("""\033[1;31m[CHECK] The command for Python is invalid. 
            If you used on Windows, Please run the command 'pip install "python-lsp-server[all]"' in the terminal 
            (you need to have a Python environment installed), which will automatically configure the environment variables.\033[0m""")
            else:
                print(f"""\033[1;31m[CHECK] {lang} command is invalid \u2718\033[0m""")
    
    require_loopback_host(config['host'])
    print("[WORKSPACE] Set the userscript Bridge path to: " + os.path.join(rootUri, "workspaces"))
    app = create_application(rootUri, config['commands'])

    server = httpserver.HTTPServer(app)
    try:
        server.listen(config['port'], config['host'])
    except OSError:
        print(f"\033[1;31m[ERROR] Port {config['port']} is already in use. Please choose another port.\033[0m")
        exit(1)

    print("\033[1;34m\nStarted Web Socket at:\n" + "\n".join(
        ["  - {}: ws://{}:{}/{}".format(lang, config['host'],
                                        config['port'], lang) for lang in config['commands'].keys()])
    + "\033[0m")
    
    ioloop.IOLoop.current().start()
