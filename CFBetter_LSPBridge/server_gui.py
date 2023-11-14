import asyncio
import os
import subprocess
import threading
import yaml
from tornado import ioloop, process, web, websocket, httpserver
from pylsp_jsonrpc import streams
import ujson as json
from PyQt5.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QTextEdit, QPushButton, QLineEdit, QMessageBox
from PyQt5.QtCore import QSettings, Qt, pyqtSignal
from PyQt5.QtCore import pyqtSignal, QMutex, QMutexLocker
from PyQt5.QtWidgets import QSystemTrayIcon, QMenu, QAction
from PyQt5.QtGui import QIcon
import sys

class ProcessManager:
    """
    A class that manages all subprocesses created by the program and provides a method to stop them all.
    """
    def __init__(self):
        self.processes = {}

    def create_process(self, name, command):
        """
        Create a subprocess with the given command and add it to the collection.
        """
        process = subprocess.Popen(command, shell=True)
        self.processes[name] = process

    def load_thread(self, name, thread):
        """
        Load a thread into an existing process.
        """
        process = self.processes.get(name)
        if process:
            thread.start()
            process_threads = self.processes.get(name + "_threads")
            if process_threads:
                process_threads.append(thread)
            else:
                self.processes[name + "_threads"] = [thread]
        else:
            raise ValueError("Process not found.")
        
    def kill_process(self, name, update_log):
        """
        Stop the subprocess with the given name.
        """
        process = self.processes.get(name)
        if process:
            process.kill()
            update_log("warn", f"Process {name} killed.")
            del self.processes[name]


class JsonRpcStreamLogWriter(streams.JsonRpcStreamWriter):
    """
    A class that formats json messages with the correct LSP headers.
    """
    def write(self, ip, message):
        """
        Write the message to the stream.
        """
        return super().write(message)


class Config:
    """
    A class that handles the configuration.
    """
    def __init__(self):
        self.host = "127.0.0.1"
        self.port = 3000
        self.commands = {
            "cpp": ["clangd"],
            "python": ["pylsp"],
            "java": ["jdtls.bat", "-configuration", "./jdt-language-server./config_win", "-data", "./java_workspace"]
        }

    def load(self):
        """
        Load the configuration from the config.yml file.
        """
        try:
            with open(os.path.join(rootUri,"config.yml"), "r") as f:
                config = yaml.safe_load(f)
                if config:
                    self.host = config.get("host", self.host)
                    self.port = config.get("port", self.port)
                    self.commands = config.get("commands", self.commands)
        except FileNotFoundError:
            pass

    def save(self):
        """
        Save the configuration to the config.yml file.
        """
        config = {
            "host": self.host,
            "port": self.port,
            "commands": self.commands
        }
        with open(os.path.join(rootUri,"config.yml"), "w") as f:
            yaml.dump(config, f)


class CommandChecker:
    """
    A class that checks the validity of the commands.
    """
    @staticmethod
    def check_command(window_self):
        """
        Check the validity of the commands.
        """
        window_self.update_log("info", "Checking commands...")
        for lang in config.commands.keys():
            command = config.commands[lang][0] + " --version"
            try:
                subprocess.run(command, shell=True, check=True, timeout=0.5, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
                window_self.update_log("success", f"The command for {lang} is valid.")
            except subprocess.CalledProcessError:
                window_self.update_log("error", f"The command for {lang} is invalid.")
            except subprocess.TimeoutExpired:
                window_self.update_log("success", f"The command for {lang} is valid.")
        window_self.update_log("info", "Commands checked.")
        return True


class StartupRun():
    """
    A class that handles the startup run.
    """
    @staticmethod
    def check_startup_run():
        """
        Check the startup.
        """
        QSetting = QSettings("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", QSettings.NativeFormat)
        if QSetting.value("CFBetter_LSPBridge") == None:
            return False
        else:
            return True
        
    @staticmethod
    def set_startup_run():
        """
        Set the startup.
        """
        QSetting = QSettings("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", QSettings.NativeFormat)
        QSetting.setValue("CFBetter_LSPBridge", rootUri + " -min")

    @staticmethod
    def cancel_startup_run():
        """
        Cancel the startup.
        """
        QSetting = QSettings("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", QSettings.NativeFormat)
        QSetting.remove("CFBetter_LSPBridge")

    @staticmethod
    def change_startup_run():
        """
        Change the startup.
        """
        if StartupRun.check_startup_run():
            StartupRun.cancel_startup_run()
        else:
            StartupRun.set_startup_run()


class HomeRequestHandler(web.RequestHandler):
    """
    A class that handles the home request.
    """
    update_log = None

    def initialize(self, update_log) -> None:
        self.update_log = update_log
        pass

    def get(self):
        """
        Handle the GET request.
        """
        self.update_log("info", "HomeRequestHandler GET")
        self.write("""
        <h1>Welcome to CFBetter_MonacoLSPBridge</h1>
        """)


class FileServerWebSocketHandler(websocket.WebSocketHandler):
    """
    A class that handles the file server web socket.
    """
    rootUri = None
    createdFiles = {} # the files that are created by the client
    nowconnection = None # the connection that is now being used
    update_log_from_thread = None
    connections = None
    

    def initialize(self, rootUri, update_log_from_thread, connections) -> None:
        """
        Initialize the class with the given root URI.
        """
        self.rootUri = rootUri
        self.update_log_from_thread = update_log_from_thread
        self.connections = connections

    def open(self, *args, **kwargs):
        """
        Handle the open event.
        """
        self.connections.append(self)
        self.nowconnection = self
        self.update_log_from_thread("success", "A new connection about FileServer has been created")

    def on_message(self, message):
        """
        Handle the message event.
        """
        message = json.loads(message)
        if message.get('type') == 'update':
            filename = message['filename']
            file_extension = message['fileExtension']
            code = message['code']
            workspace = message['workspace']
            file_path = os.path.join(rootUri, workspace, filename + file_extension) # the path of the file
            self.createdFiles[self.nowconnection] = file_path
            self.update_log_from_thread("info", f"File {file_path} has been updated or created.")  
            with open(file_path, 'w') as f:
                f.write(code)
            self.write_message(json.dumps({'result': 'ok'}))
        else:
            self.write_message(json.dumps({'result': 'error', 'description': 'no such type'}))

    def on_close(self):
        """
        Handle the close event.
        """
        self.connections.remove(self)
        self.update_log_from_thread("warn", "A connection about FileServer has been closed")
        
        # delete the file that is created by the client
        self.update_log_from_thread("warn", "Removing the file that is created by the client...")
        for connection in self.createdFiles:
            if connection == self:
                file_path = self.createdFiles[connection]
                os.remove(file_path)
                self.update_log_from_thread("info", f"File {file_path} has been removed.")
                del self.createdFiles[connection]
                break
        self.update_log_from_thread("success", "The file that is created by the client has been removed.")

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
    update_log_from_thread = None
    connections = None
    
    def initialize(self, commands, update_log_from_thread, connections) -> None:
        """
        Initialize the class with the given commands.
        """
        self.commands = commands
        self.update_log_from_thread = update_log_from_thread
        self.connections = connections

    def open(self, *args, **kwargs):
        """
        Handle the open event.
        """
        self.connections.append(self)
        self.update_log_from_thread("success", "A new connection about LanguageServer has been created")

        self.language = args[0]
        if args[0] not in self.commands:
            self.close(1001, "language {} is not supported".format((args[0])))
            return

        self.lang = args[0]
        self.proc = process.Subprocess(
            self.commands[self.lang], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=subprocess.CREATE_NO_WINDOW)

        self.writer = JsonRpcStreamLogWriter(self.proc.stdin)

        # create a process to manage the std thread
        processManger.create_process("stdConsumeProcess", "")

        # start a thread to consume the stdout of the language server
        def consume_stdout():
            """
            Consume the stdout of the language server.
            """
            self.update_log_from_thread("success", "The stdout of the language server associated with this connection is opened.")
            ioloop.IOLoop()
            reader = streams.JsonRpcStreamReader(self.proc.stdout)
            reader.listen(lambda msg: self.write_message(json.dumps(msg)))

            self.update_log_from_thread("warn", "The stdout of the language server associated with this connection is closed.")

        thread1 = threading.Thread(target=consume_stdout)
        thread1.daemon = True
        processManger.load_thread("stdConsumeProcess", thread1)
        

        # start a thread to consume the stderr of the language server
        def consume_stderr():
            """
            Consume the stderr of the language server.
            """
            self.update_log_from_thread("success", "The stderr of the language server associated with this connection is opened.")
            for line in iter(self.proc.stderr.readline, b''):
                self.update_log_from_thread("info", line.decode('utf-8'))

            self.update_log_from_thread("warn", "The stderr of the language server associated with this connection is closed.")

        thread2 = threading.Thread(target=consume_stderr)
        thread2.daemon = True
        processManger.load_thread("stdConsumeProcess", thread2)
        

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
        self.connections.remove(self)
        self.update_log_from_thread("warn", "A connection about LanguageServer has been closed")
        self.proc.proc.terminate() # terminate the process

    def check_origin(self, origin):
        """
        Check the origin of the request.
        """
        self.set_header("Access-Control-Allow-Origin", "*")
        return True


class WebServer():
    """
    A class that handles the web server.
    """
    webserver = None
    connections = []
    update_log_from_thread = None
    update_log = None

    def __init__(self, update_log, update_log_from_thread):
        self.update_log = update_log
        self.update_log_from_thread = update_log_from_thread

    def start_server(self):
        """
        Start the server.
        """
        
        if self.webserver is not None:
            self.update_log("error", "Server already started")
            return
        
        # check the commands
        CommandChecker().check_command(window_self = self)

        # start the web server
        self.update_log("info", "Starting server...")
        def start_web():
            asyncio.set_event_loop(asyncio.new_event_loop())
            webapp = web.Application([
                    (r"/", HomeRequestHandler, dict(update_log = self.update_log)),
                    (r"/file", FileServerWebSocketHandler,
                    dict(rootUri=rootUri, update_log_from_thread = self.update_log_from_thread, connections = self.connections)),
                    (r"/(.*)", LanguageServerWebSocketHandler,
                    dict(commands=config.commands, update_log_from_thread = self.update_log_from_thread, connections = self.connections))
                ])

            self.webserver = httpserver.HTTPServer(webapp)
            self.webserver.listen(config.port, config.host)
            self.update_log_from_thread("success", f"Listening on {config.host}:{config.port}")

            # run until the stop event is set
            ioloop.IOLoop.current().start()


        processManger.create_process("webProcess", "")
        thread = threading.Thread(target=start_web)
        thread.daemon = True
        processManger.load_thread("webProcess", thread)
        

    def stop_server(self):
        """
        Stop the server and all related threads.
        """
        self.update_log("warn", "Stopping server...")
        if self.webserver is not None:
            self.webserver.stop()
            self.webserver = None
            for connection in self.connections:
                connection.close()
            self.update_log("success", "Server stopped")
        else:
            self.update_log("error", "Server not started")


    def restart_server(self):
        """
        Restart the server.
        """
        if self.webserver is not None:
            self.stop_server()
            self.start_server()
            self.update_log("success", "Server restarted")
        else:
            self.update_log("error", "Server not started")
        

class MainWindow(QMainWindow):
    """
    A class that handles the main window.
    """
    update_log_signal = pyqtSignal(str, str) # signal to update the log
    log_mutex = QMutex() # mutex to lock the log
    webserver = None

    def __init__(self, parent=None):
        super().__init__(parent)
        self.update_log_signal.connect(self.update_log) # connect the signal to the slot
        self.setWindowTitle("CFBetter_LSPBridge")
        self.resize(800, 600)

        self.log_text_edit = QTextEdit(self)
        self.log_text_edit.setReadOnly(True)

        self.start_button = QPushButton("Start", self)
        self.stop_button = QPushButton("Stop", self)
        self.restart_button = QPushButton("Restart", self)

        self.host_label = QLabel("Host:", self)
        self.host_line_edit = QLineEdit(self)
        self.host_line_edit.setText(str(config.host))
        self.host_line_edit.textChanged.connect(self.update_host)


        self.port_label = QLabel("Port:", self)
        self.port_line_edit = QLineEdit(self)
        self.port_line_edit.setText(str(config.port))
        self.port_line_edit.textChanged.connect(self.update_port)

        # add switch auto run
        self.auto_run_button = QPushButton("Run on system startup", self)
        self.auto_run_button.clicked.connect(self.toggle_auto_run)
        self.auto_run_button.setCheckable(True)
        self.auto_run_button.setChecked(StartupRun().check_startup_run())

        # Set the style of the auto_run_button
        self.set_auto_run_button_style()

        # Create the tray icon
        self.tray_icon = QSystemTrayIcon(self)
        self.tray_icon.setIcon(QIcon(os.path.join(rootUri, "src", "icon.svg")))
        self.tray_icon.setToolTip("CFBetter_LSPBridge")
        self.tray_icon.show()

        self.init_ui()
        self.init_signal_slot()

    def update_host(self, text):
        config.host = text
        config.save()

    def update_port(self, text):
        config.port = text
        config.save()

    # Define the style of the auto_run_button
    disable_auto_run = """
        QPushButton {   
            background-color: #f5f5f5;
            color: #757575;
            border: 1px solid #bdbdbd;
            border-radius: 4px;
            padding: 5px;
        }
        QPushButton:hover {
            color: #1b5e20;
            background-color: #c8e6c9;
        }
        QPushButton:checked {
            background-color: #f5f5f5;
        }
    """
    enable_auto_run = """
        QPushButton {
            background-color: #c8e6c9;
            color: #1b5e20;
            border: 1px solid #1b5e20;
            border-radius: 4px;
            padding: 5px;
        }
        QPushButton:hover {
            background-color: #f5f5f5;
        }
        QPushButton:checked {
            background-color: #c8e6c9;
        }
    """

    def toggle_auto_run(self):
        """
        change the auto run button style when the button is clicked
        """
        if self.auto_run_button.isChecked():
            StartupRun().set_startup_run()
            self.update_log("success", "Set to run on system startup.")
            self.auto_run_button.setStyleSheet(self.enable_auto_run)
        else:
            StartupRun().cancel_startup_run()
            self.update_log("success", "Cancel the run on system startup.")
            self.auto_run_button.setStyleSheet(self.disable_auto_run)

    def set_auto_run_button_style(self):
        """
        set the auto run button style when the window is shown
        """
        if StartupRun().check_startup_run():
            self.auto_run_button.setStyleSheet(self.enable_auto_run)
        else:
            self.auto_run_button.setStyleSheet(self.disable_auto_run)
    
    def init_ui(self):
        """
        Initialize the UI.
        """
        central_widget = QWidget(self)
        self.setCentralWidget(central_widget)

        main_layout = QVBoxLayout(central_widget)

        log_layout = QHBoxLayout()
        log_layout.addWidget(QLabel("Log:", self))
        log_layout.addStretch()
        main_layout.addLayout(log_layout)

        main_layout.addWidget(self.log_text_edit)

        button_layout = QHBoxLayout()
        button_layout.addWidget(self.start_button)
        button_layout.addWidget(self.stop_button)
        button_layout.addWidget(self.restart_button)
        button_layout.addStretch()
        button_layout.addWidget(self.auto_run_button, alignment=Qt.AlignRight)
        main_layout.addLayout(button_layout)

        host_layout = QHBoxLayout()
        host_layout.addWidget(self.host_label)
        host_layout.addWidget(self.host_line_edit)
        host_layout.addStretch()
        main_layout.addLayout(host_layout)

        port_layout = QHBoxLayout()
        port_layout.addWidget(self.port_label)
        port_layout.addWidget(self.port_line_edit)
        port_layout.addStretch()
        main_layout.addLayout(port_layout)

        self.create_tray_icon_menu()


    def init_signal_slot(self):
        """
        Initialize the signal slot.
        """
        self.webserver = WebServer(self.update_log, self.update_log_from_thread) # create a webserver
        self.start_button.clicked.connect(self.webserver.start_server)
        self.stop_button.clicked.connect(self.webserver.stop_server)
        self.restart_button.clicked.connect(self.webserver.restart_server)

        # first run to start the server
        self.webserver.start_server()


    def update_log(self, state, text):
        """
        Update the log in a thread-safe manner.
        """
        # Define a dictionary to map state to color and font size
        state_to_color_and_size = {
            'info': ('black', 'normal', '10pt', '[INFO]'),
            'success': ('#008000', 'bold', '11pt', '[SUCCESS]'),
            'error': ('#8B0000', 'bold', '11pt', '[ERROR]'),
            'warn': ('#FF8C00', 'bold', '11pt', '[WARN]')
        }

        font_color, font_weight, font_size, prefix = state_to_color_and_size.get(state)
        
        locker = QMutexLocker(self.log_mutex)
        self.log_text_edit.append(f"<font style='color:{font_color}; font-weight:{font_weight}; font-size:{font_size};'>{prefix} {text}</font>")
        locker.unlock()

    def update_log_from_thread(self, state, text):
        """
        Emit a signal to update the log from a thread.
        """
        self.update_log_signal.emit(state, text)


    def show_window(self, reason):
        """
        Show the window.
        """
        if reason == QSystemTrayIcon.Trigger:
            self.showNormal()
        

    def create_tray_icon_menu(self):
        quit_action = QAction("Quit", self)
        quit_action.triggered.connect(self.quit_application)
        tray_menu = QMenu()
        tray_menu.addAction(quit_action)
        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.activated.connect(self.show_window) # connect the activated signal to the slot


    def quit_application(self):
        QApplication.quit()


    def closeEvent(self, event):
        """
        Handle the close event.
        """
        reply = QMessageBox.question(self, 'Message', "Do you want to minimise the window to the tray?", QMessageBox.Yes | QMessageBox.No , QMessageBox.No)

        if reply == QMessageBox.Yes:
            event.ignore()
            self.hide()
            self.tray_icon.show()
        elif reply == QMessageBox.No:
            self.webserver.stop_server()
            event.accept()
            


if __name__ == "__main__":
    if hasattr(sys, 'frozen'):
        # rooturi when pakge to exe
        rootUri = os.path.dirname(sys.argv[0])
    else:
        # rooturi when run from source
        rootUri = os.path.dirname(os.path.abspath(__file__))
    app = QApplication(sys.argv)
    app.setWindowIcon(QIcon(os.path.join(rootUri, "src", "icon.svg")))
    config = Config()
    config.load()
    processManger = ProcessManager()
    main_window = MainWindow()
    # if is startup run then hide the window
    if "-min" in sys.argv:
        main_window.tray_icon.show()
    else:
        main_window.show()
    app.exec_()