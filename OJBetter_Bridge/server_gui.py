import asyncio
import os
import threading
import yaml
from tornado import ioloop, httpserver
from PyQt5.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel
from PyQt5.QtCore import QSettings, Qt
from PyQt5.QtCore import pyqtSignal, QMutex, QMutexLocker
from PyQt5.QtWidgets import QSystemTrayIcon, QMenu, QAction
from PyQt5.QtGui import QIcon
from qfluentwidgets import TextEdit, LineEdit
from qfluentwidgets import MessageBox, PushButton
from qfluentwidgets import SwitchButton
from qfluentwidgets import InfoBar, FluentIcon, InfoBarPosition
import shutil
import sys
from PyQt5.QtGui import QFont
from bridge_handlers import create_application
from bridge_security import require_loopback_host

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
            # "java": ["jdtls.bat", "-configuration", "./jdt-language-server./config_win", "-data", "./java_workspace"]
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
    update_log_from_thread = None

    def __init__(self, update_log_from_thread) -> None:
        self.update_log_from_thread = update_log_from_thread

    def check_command(self):
        """
        Check the validity of the commands.
        """
        self.update_log_from_thread("info", "Checking commands...")
        for lang in config.commands.keys():
            command = config.commands[lang][0]
            if shutil.which(command):
                self.update_log_from_thread("success", f"The command for {lang} is valid.")
            else:
                self.update_log_from_thread("error", f"The command for {lang} is invalid.")
                if(lang == "cpp"):
                    self.update_log_from_thread("error", "Please download clangd-windows-xxx.zip from https://github.com/clangd/clangd/releases/, extract it to your preferred location, and add the xxx/clangd_xxx/bin path to the system environment variable path.")
                elif(lang == "python"):
                    self.update_log_from_thread("error", "Please run the command ' pip install \"python-lsp-server[all]\" ' in the terminal (you need to have a Python environment installed), which will automatically configure the environment variables.")
        self.update_log_from_thread("info", "Commands checked.")
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
        if QSetting.value("OJBetter_Bridge") == None:
            return False
        else:
            return True
        
    @staticmethod
    def set_startup_run():
        """
        Set the startup.
        """
        QSetting = QSettings("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", QSettings.NativeFormat)
        QSetting.setValue("OJBetter_Bridge", '"{}" /background'.format(os.path.join(rootUri,"server_gui.exe")))

    @staticmethod
    def cancel_startup_run():
        """
        Cancel the startup.
        """
        QSetting = QSettings("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", QSettings.NativeFormat)
        QSetting.remove("OJBetter_Bridge")

    @staticmethod
    def change_startup_run():
        """
        Change the startup.
        """
        if StartupRun.check_startup_run():
            StartupRun.cancel_startup_run()
        else:
            StartupRun.set_startup_run()


class WebServer:
    """Serialize server lifecycle operations on one background IOLoop."""

    def __init__(self, update_log, update_log_from_thread, createInfoBar_from_thread):
        self.update_log_from_thread = update_log_from_thread
        self.createInfoBar_from_thread = createInfoBar_from_thread
        self.connections = []
        self.webserver = None
        self.server_loop = None
        self.server_thread = None
        self._pending = False

    def _listen(self):
        server = None
        try:
            require_loopback_host(config.host)
            CommandChecker(self.update_log_from_thread).check_command()
            app = create_application(
                rootUri, config.commands, self.connections,
                self.update_log_from_thread)
            server = httpserver.HTTPServer(app)
            server.listen(config.port, config.host)
            self.webserver = server
        except (ValueError, OSError) as exc:
            if server is not None:
                server.stop()
            self.update_log_from_thread("error", f"Cannot start bridge: {exc}")
            self.createInfoBar_from_thread('error', 'Cannot start bridge', str(exc))
        else:
            self.update_log_from_thread(
                "info", "Userscript Bridge path: " + os.path.join(rootUri, "workspaces"))
            self.update_log_from_thread("success", f"Listening on {config.host}:{config.port}")
            self.createInfoBar_from_thread('success', 'Server started', 'Enjoy coding! !>_<')
        finally:
            self._pending = False

    def start_server(self):
        if self._pending or self.webserver is not None:
            self.createInfoBar_from_thread(
                'error', 'Server already started', 'Please wait or stop the server first.')
            return
        self._pending = True
        if self.server_loop is not None:
            self.server_loop.add_callback(self._listen)
            return

        def run():
            asyncio.set_event_loop(asyncio.new_event_loop())
            self.server_loop = ioloop.IOLoop.current()
            self.server_loop.add_callback(self._listen)
            try:
                self.server_loop.start()
            finally:
                self.server_loop.close(all_fds=True)

        self.server_thread = threading.Thread(target=run, daemon=True)
        self.server_thread.start()

    def _shutdown(self):
        self.webserver.stop()
        self.webserver = None
        for connection in list(self.connections):
            connection.close()

    def stop_server(self):
        if self._pending or self.webserver is None:
            self.createInfoBar_from_thread(
                'error', 'Server not ready', 'Please wait or start the server first.')
            return
        self._pending = True

        def stop():
            try:
                self._shutdown()
                self.update_log_from_thread("warn", "Server stopped")
                self.createInfoBar_from_thread('warn', 'Server stopped', 'Server stopped.')
            finally:
                self._pending = False

        self.server_loop.add_callback(stop)

    def restart_server(self):
        if self._pending or self.webserver is None:
            self.createInfoBar_from_thread(
                'error', 'Server not ready', 'Please wait or start the server first.')
            return
        self._pending = True

        def restart():
            self._shutdown()
            self._listen()

        self.server_loop.add_callback(restart)


class MainWindow(QMainWindow):
    """
    A class that handles the main window.
    """
    update_log_signal = pyqtSignal(str, str) # signal to update the log
    log_mutex = QMutex() # mutex to lock the log
    infoBar_signal = pyqtSignal(str, str, str) # signal to create a info bar
    webserver = None

    def __init__(self, parent=None):
        super().__init__(parent)
        self.update_log_signal.connect(self.update_log) # connect the signal to the slot
        self.infoBar_signal.connect(self.createInfoBar) # connect the signal to the slot
        self.setWindowTitle("OJBetter_Bridge")
        self.setStyleSheet("background-color: #f7f9fc;")
        self.resize(800, 600)

        # set the font
        font = QFont("Microsoft YaHei UI")
        font.setPointSize(10)

        self.textEdit = TextEdit(self)
        self.textEdit.setReadOnly(True)

        self.start_button = PushButton("Start", self, FluentIcon.PLAY)
        self.stop_button = PushButton("Stop", self, FluentIcon.POWER_BUTTON)
        self.restart_button = PushButton("Restart", self, FluentIcon.ROTATE)
        self.auto_run_label = QLabel("Run on system startup:", self)
        self.auto_run_label.setFont(font)
        self.auto_run_button = SwitchButton(parent=self)
        self.auto_run_button.checkedChanged.connect(self.toggle_auto_run)
        self.auto_run_button.setChecked(StartupRun().check_startup_run())

        self.host_label = QLabel("Host:", self)
        self.host_label.setFont(font)
        self.host_line_edit = LineEdit(self)
        self.host_line_edit.setText(str(config.host))
        self.host_line_edit.textChanged.connect(self.update_host)

        self.port_label = QLabel("Port:", self)
        self.port_label.setFont(font)
        self.port_line_edit = LineEdit(self)
        self.port_line_edit.setText(str(config.port))
        self.port_line_edit.textChanged.connect(self.update_port)


        # Create the tray icon
        self.tray_icon = QSystemTrayIcon(self)
        self.tray_icon.setIcon(QIcon(os.path.join(rootUri, "src", "icon.svg")))
        self.tray_icon.setToolTip("OJBetter_Bridge")
        self.tray_icon.show()

        self.init_ui()
        self.init_signal_slot()

    def update_host(self, text):
        config.host = text
        config.save()

    def update_port(self, text):
        config.port = text
        config.save()


    def toggle_auto_run(self):
        """
        change the auto run button style when the button is clicked
        """
        if self.auto_run_button.isChecked():
            StartupRun().set_startup_run()
            self.createInfoBar('success', 'Startup run enabled', f"OJBetter_Bridge will run on system startup.")
            self.auto_run_button.setText('On')
        else:
            StartupRun().cancel_startup_run()
            self.createInfoBar('success', 'Startup run disabled', f"OJBetter_Bridge will not run on system startup.")
            self.auto_run_button.setText('Off')

    
    def init_ui(self):
        """
        Initialize the UI.
        """
        central_widget = QWidget(self)
        self.setCentralWidget(central_widget)

        main_layout = QVBoxLayout(central_widget)

        log_layout = QHBoxLayout()
        log_layout.addWidget(self.textEdit)
        main_layout.addLayout(log_layout)

        button_layout = QHBoxLayout()
        button_layout.addWidget(self.start_button)
        button_layout.addWidget(self.stop_button)
        button_layout.addWidget(self.restart_button)
        button_layout.addStretch()
        button_layout.addWidget(self.auto_run_label)
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
        self.webserver = WebServer(self.update_log, self.update_log_from_thread, self.createInfoBar_from_thread) # create a webserver
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
        self.textEdit.append(f"<font style='color:{font_color}; font-weight:{font_weight}; font-size:{font_size};'>{prefix} {text}</font>")
        locker.unlock()

    def update_log_from_thread(self, state, text):
        """
        Emit a signal to update the log from a thread.
        """
        self.update_log_signal.emit(state, text)


    def createInfoBar(self, state, title, text):
        """
        Create a info bar.
        """
        if(state == 'success'):
            InfoBar.success(
                title=f"{title}",
                content=f"{text}",
                orient=Qt.Horizontal,
                isClosable=False,
                position=InfoBarPosition.TOP_LEFT,
                duration=1000,
                parent=self
            )
        elif(state == 'error'):
            InfoBar.error(
                title=f"{title}",
                content=f"{text}",
                orient=Qt.Horizontal,
                isClosable=False,
                position=InfoBarPosition.TOP_LEFT,
                duration=1000,
                parent=self
            )
        elif(state == 'warn'):
            InfoBar.warning(
                title=f"{title}",
                content=f"{text}",
                orient=Qt.Horizontal,
                isClosable=False,
                position=InfoBarPosition.TOP_LEFT,
                duration=1000,
                parent=self
            )

    def createInfoBar_from_thread(self, state, title, text):
        """
        Emit a signal to create a info bar from a thread.
        """
        self.infoBar_signal.emit(state, title, text)

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
        reply = MessageBox(
            'Message',
            "Do you want to minimise the window to the tray?",
            self)
        reply.yesButton.setText('Backstage Running')
        reply.cancelButton.setText('Direct close')
        if reply.exec():
            event.ignore()
            self.hide()
            self.tray_icon.show()
        else:
            self.webserver.stop_server()
            event.accept()
            

if __name__ == "__main__":
    # set high dpi scale
    QApplication.setHighDpiScaleFactorRoundingPolicy(
        Qt.HighDpiScaleFactorRoundingPolicy.PassThrough)
    QApplication.setAttribute(Qt.AA_EnableHighDpiScaling)
    QApplication.setAttribute(Qt.AA_UseHighDpiPixmaps)

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
    main_window = MainWindow()
    # if is startup run then hide the window
    if "/background" in sys.argv:
        main_window.tray_icon.show()
    else:
        main_window.show()
    app.exec_()
