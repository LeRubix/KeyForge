import random
import string
import sys
import os
import webbrowser
from cryptography.fernet import Fernet
from PyQt5.QtCore import Qt
from PyQt5.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QLabel, QPushButton, QSlider, QCheckBox, QTextEdit, QLineEdit, QMessageBox
from KeyForgeChain_source import PasswordManager

class PasswordGeneratorApp(QMainWindow):
    def __init__(self, password_manager):
        super().__init__()

        self.password_manager = password_manager 
        self.key = self.load_or_create_key()
        self.init_ui()

    def load_or_create_key(self):
        key_file = 'key.key'
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                key = f.read()
        else:
            key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(key)
        return key
    
    def encrypt(self, data):
        cipher_suite = Fernet(self.key)
        encrypted_data = cipher_suite.encrypt(data.encode())
        return encrypted_data

    def decrypt(self, encrypted_data):
        cipher_suite = Fernet(self.key)
        decrypted_data = cipher_suite.decrypt(encrypted_data)
        return decrypted_data.decode()

    def init_ui(self):
        self.setWindowTitle("KeyForge")
        self.setGeometry(100, 100, 400, 400)

        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)

        self.layout = QVBoxLayout()

        self.length_label = QLabel("Password Length: 4")
        self.layout.addWidget(self.length_label)

        self.length_slider = QSlider(Qt.Horizontal)
        self.length_slider.setMinimum(6)
        self.length_slider.setMaximum(50)
        self.layout.addWidget(self.length_slider)

        self.lowercase_checkbox = QCheckBox("Lowercase")
        self.uppercase_checkbox = QCheckBox("Uppercase")
        self.digits_checkbox = QCheckBox("Digits")
        self.special_chars_checkbox = QCheckBox("Special Characters")

        self.lowercase_checkbox.setChecked(True)
        self.uppercase_checkbox.setChecked(True)
        self.digits_checkbox.setChecked(True)
        self.special_chars_checkbox.setChecked(True)

        self.layout.addWidget(self.lowercase_checkbox)
        self.layout.addWidget(self.uppercase_checkbox)
        self.layout.addWidget(self.digits_checkbox)
        self.layout.addWidget(self.special_chars_checkbox)

        self.generate_button = QPushButton("Generate Password")
        self.layout.addWidget(self.generate_button)

        self.password_label = QLabel("Generated Password: ")
        self.layout.addWidget(self.password_label)

        self.copy_button = QPushButton("Copy Password")
        self.layout.addWidget(self.copy_button)

        self.generated_password_text = QTextEdit()
        self.layout.addWidget(self.generated_password_text)

        self.central_widget.setLayout(self.layout)

        self.generate_button.clicked.connect(self.generate_password)
        self.length_slider.valueChanged.connect(self.update_length_label)
        self.copy_button.clicked.connect(self.copy_password)

        self.website_input = QLineEdit()
        self.website_input.setPlaceholderText("Enter Website (e.g., example.com)")
        self.layout.addWidget(self.website_input)

        self.save_button = QPushButton("Save Password to Manager")
        self.layout.addWidget(self.save_button)

        self.save_button.clicked.connect(self.save_password_to_manager)


    def generate_password(self):
        length = self.length_slider.value()
        use_lowercase = self.lowercase_checkbox.isChecked()
        use_uppercase = self.uppercase_checkbox.isChecked()
        use_digits = self.digits_checkbox.isChecked()
        use_special_chars = self.special_chars_checkbox.isChecked()

        password = self._generate_password(length, use_lowercase, use_uppercase, use_digits, use_special_chars)
        self.generated_password_text.setPlainText(password)

    def update_length_label(self, value):
        self.length_label.setText(f"Password Length: {value}")
    
    def _generate_password(self, length, use_lowercase, use_uppercase, use_digits, use_special_chars):
        lowercase_chars = string.ascii_lowercase if use_lowercase else ''
        uppercase_chars = string.ascii_uppercase if use_uppercase else ''
        digit_chars = string.digits if use_digits else ''
        special_chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/' if use_special_chars else ''

        all_chars = lowercase_chars + uppercase_chars + digit_chars + special_chars

        length = max(length, 4)

        password = ''.join(random.choice(all_chars) for _ in range(length))

        return password
    
    def copy_password(self):
        password = self.generated_password_text.toPlainText()
        if password:
            clipboard = QApplication.clipboard()
            clipboard.setText(password)
            QMessageBox.information(self, "Password Copied", "The generated password has been copied to the clipboard.\nThanks for using KeyForge :)")

    def save_password_to_manager(self):
        website = self.website_input.text()
        password = self.generated_password_text.toPlainText()

        if website.strip() and password.strip():
            if not os.path.exists('manager_credentials.bin'):
                error_message = "Error: KeyForge Chain Password Manager not found. Move it into the same folder as KeyForge.exe or if you haven't installed it, please download the manager from the GitHub repository.\nKeyForge should automatically come with KeyForge Chain."
                github_link = "https://github.com/your-github-repo"
                
                # Show an error message with a hyperlink to GitHub
                QMessageBox.critical(self, "Error", f"{error_message}\n\nYou can download it from <a href=\"{github_link}\">{github_link}</a>")

                # Open the GitHub link in the default web browser
                webbrowser.open(github_link, new=2)

                return

            # Use the PasswordManager instance for encryption
            encrypted_password = self.password_manager.encrypt(password)

            # Add or update the password for the given website
            self.password_manager.add_credentials(website, '', encrypted_password)
            QMessageBox.information(self, "Password Saved", f"The generated password for {website} has been saved to the password manager.")
        else:
            QMessageBox.critical(self, "Error", "Please enter a website and generate a password first.")


if __name__ == '__main__':
    app = QApplication(sys.argv)

    password_manager = PasswordManager()

    window = PasswordGeneratorApp(password_manager)
    window.show()

    sys.exit(app.exec_())
