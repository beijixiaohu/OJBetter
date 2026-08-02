import os
import subprocess
import threading
import argparse
import yaml
from tornado import ioloop, process, web, websocket, httpserver
from pylsp_jsonrpc import streams
import ujson as json
import pkg_resources
import shutil
print("\033[1;34m" + """
    ╔══════════════════════════════════════════════════════════╗
    ║              Welcome to OJBetter_Bridge                  ║
    ║                  Enjoy Coding !>_<                       ║
    ╚══════════════════════════════════════════════════════════╝
    """.center(80) + "\033[0m")

print("[CHECK] Checking required packages...")
REQUIRED_PACKAGES = {'PyYAML': '==6.0', 'tornado': '==6.1', 'ujson': '==5.2.0'}
for package, version in REQUIRED_PACKAGES.items():
    try:
        dist = pkg_resources.get_distribution(package)
        if dist.version != version[2:]:
            print('\033[1;31m[CHECK] {} ({}) is installed but not the required version {}\033[0m'.format(package, dist.version, version))
            subprocess.call(['pip', 'install', '{}{}'.format(package, version)])
        else:
            print('\033[1;32m[CHECK] {} ({}) is installed \u2714\033[0m'.format(package, dist.version))
    except pkg_resources.DistributionNotFound:
        print('\033[1;31m[CHECK] {} is NOT installed \u2718\033[0m'.format(package))
        subprocess.call(['pip', 'install', '{}{}'.format(package, version)])

class JsonRpcStreamLogWriter(streams.JsonRpcStreamWriter):
    """
    A class that formats json messages with the correct LSP headers.
    """
    def write(self, ip, message):
        """
        Write the message to the stream.
        """
        return super().write(message)


class HomeRequestHandler(web.RequestHandler):
    """
    A class that handles the home request.
    """
    commands = None

    def initialize(self, commands) -> None:
        """
        Initialize the class with the given commands.
        """
        self.commands = commands

    def get(self):
        """
        Handle the GET request.
        """
        self.write("""
        <h1>Welcome to CFBetter_MonacoLSPBridge</h1>
        """)

class MyCompletJsonHandler(websocket.WebSocketHandler):
    """
    A class that handles the mycomplet json in the mycomplt file.
    """
    rootUri = None
    

    def initialize(self, rootUri) -> None:
        """
        Initialize the class with the given root URI.
        """
        self.rootUri = rootUri

    def get(self, *args):
        completfile = args[0]
        print(f"MyCompletJsonHandler GET {completfile}")
        with open(os.path.join(rootUri, 'mycomplet', completfile), 'r') as f:
            self.write(f.read())


class FileServerWebSocketHandler(websocket.WebSocketHandler):
    """
    A class that handles the file server web socket.
    """
    rootUri = None
    createdFiles = {} # the files that are created by the client
    nowconnection = None # the connection that is now being used

    def initialize(self, rootUri) -> None:
        """
        Initialize the class with the given root URI.
        """
        self.rootUri = rootUri

    def open(self, *args, **kwargs):
        """
        Handle the open event.
        """
        print("\033[1;32m[INFO] A new connection about FileServer has been created\033[0m")

    def on_message(self, message):
        """
        Handle the message event.
        """
        message = json.loads(message)
        if message['type'] == 'update':
            filename = message['filename']
            file_extension = message['fileExtension']
            code = message['code']
            workspace = message['workspace']
            file_path = os.path.join(rootUri, workspace, filename + file_extension) # the path of the file
            self.createdFiles[self.nowconnection] = file_path
            with open(file_path, 'w') as f:
                f.write(code)
            self.write_message(json.dumps({'result': 'ok'}))
        else:
            self.write_message(json.dumps(
                {'result': 'error', 'description': 'no such type'}))

    def on_close(self):
        """
        Handle the close event.
        """
        print("\033[1;31m[INFO] A connection about FileServer has been closed\033[0m")
        print("\033[1;31m[INFO] Removing the file that is created by the client...\033[0m")
        for connection in self.createdFiles:
            if connection == self:
                file_path = self.createdFiles[connection]
                os.remove(file_path)
                self.update_log_from_thread("warn", f"File {file_path} has been removed.")
                del self.createdFiles[connection]
                break

    def check_origin(self, origin):
        """
        Check the origin of the request.
        """
        self.set_header("Access-Control-Allow-Origin", "*")
        return True


class LanguageServerWebSocketHandler(websocket.WebSocketHandler):
    """
    A class that handles the language server web socket.
    """
    writer = None
    lang = None
    commands = None
    uri = None
    proc = None
    language = None

    def initialize(self, commands) -> None:
        """
        Initialize the class with the given commands.
        """
        self.commands = commands

    def open(self, *args, **kwargs):
        """
        Handle the open event.
        """
        self.language = args[0]
        print("\033[1;32m[INFO] A new connection about LanguageServer has been created\033[0m")
        if args[0] not in self.commands:
            self.close(1001, "language {} is not supported".format((args[0])))
            return

        self.lang = args[0]
        self.proc = process.Subprocess(
            self.commands[self.lang], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
        self.writer = JsonRpcStreamLogWriter(self.proc.stdin)

        def consume():
            """
            Consume the stdout of the language server.
            """
            ioloop.IOLoop()
            reader = streams.JsonRpcStreamReader(self.proc.stdout)
            reader.listen(lambda msg: self.write_message(json.dumps(msg)))

        thread = threading.Thread(target=consume)
        thread.daemon = True
        thread.start()
        print("\033[1;32m[INFO] LanguageServerWebSocketHandler opened\033[0m")

    def on_message(self, message):
        """
        Handle the message event.
        """
        message = json.loads(message)
        self.writer.write("", message)

    def on_close(self):
        """
        Handle the close event.
        """
        self.proc.proc.terminate()
        print("\033[1;31m[INFO] A connection about LanguageServer has been closed\033[0m")

    def check_origin(self, origin):
        """
        Check the origin of the request.
        """
        self.set_header("Access-Control-Allow-Origin", "*")
        return True


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
    
    app = web.Application([
        (r"/", HomeRequestHandler, dict(commands=config['commands'])),
        (r"/mycomplet/(.*)", MyCompletJsonHandler,
         dict(rootUri=rootUri)),
        (r"/file", FileServerWebSocketHandler,
         dict(rootUri=rootUri)),
        (r"/(.*)", LanguageServerWebSocketHandler,
         dict(commands=config['commands']))
    ])

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
