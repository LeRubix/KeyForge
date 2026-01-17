# Keyforge Password Manager

Keyforge is a secure password manager that runs on your computer. It helps you store and manage all your passwords in one safe place. Everything is encrypted and stored only on your computer, so your passwords never leave your device.

## What is Keyforge?

Keyforge is like a digital safe for your passwords. Instead of remembering dozens of different passwords, you only need to remember one master password. Keyforge stores all your other passwords safely and securely.

## Key Features

### Security

Keyforge uses the strongest encryption available to protect your passwords:

- All your passwords are encrypted using military-grade encryption
- Your master password is processed 600,000 times to make it nearly impossible to crack
- Even if someone gets access to your password file, they cannot read your passwords without your master password
- Your master password is never stored anywhere
- All encryption and decryption happens on your computer only
- Your passwords are never sent to any server or internet service

### Easy to Use

- Simple, clean interface that is easy to understand
- Dark and light themes that are easy on the eyes
- Multiple color schemes to customize your experience
- Fast and responsive
- Search through your passwords instantly
- See how strong your passwords are with the strength meter
- Multi-language support: English 🇬🇧, Spanish 🇪🇸, German 🇩🇪, Japanese 🇯🇵, French 🇫🇷, Portuguese 🇵🇹, Ukrainian 🇺🇦, Polish 🇵🇱, Chinese 🇨🇳

### What You Can Do

- Store passwords for websites, apps, and services
- Generate strong, random passwords with customizable options
- Import passwords from Chrome, Firefox, or Edge browsers
- Copy passwords to clipboard with one click from the list or form
- View passwords in read-only mode or edit them as needed
- Store website addresses and open them directly
- Add notes to any password entry
- Sort passwords by name, date, or username
- View passwords in grid, compact, or expanded list formats
- Lock your password vault when you are done
- Change your master password securely
- Use a recovery phrase to regain access if you forget your master password

## Getting Started

### Download Pre-built Version

The easiest way to get Keyforge is to download the latest pre-built version from the releases section. Pre-built versions are available for:

- Windows (portable .exe and installer)
- Linux (AppImage and .deb package for Ubuntu/Mint)
- macOS (.dmg file)

These versions run without requiring Node.js or any other dependencies. Just download and run.

### Building from Source

If you want to build Keyforge yourself, you will need:

- Node.js version 18 or higher
- npm (comes with Node.js)

If you do not have these installed, visit nodejs.org to download and install Node.js for your computer.

### Installation Steps (Building from Source)

1. Download or clone this project to your computer

2. Open a terminal or command prompt on your computer

3. Navigate to the Keyforge folder. Type this command:
```
cd Keyforge2
```

4. Install the required software. Type this command:
```
npm install
```
This may take a few minutes. Wait until it finishes.

5. Start the application. Type this command:
```
npm run dev
```

The Keyforge application should now open on your computer.

### Building for Production

Keyforge can be built as a single executable file that runs without installation. This makes it easy to use on any computer.

#### Building for Your Current Platform

1. Make sure you are in the Keyforge2 folder

2. Type this command:
```
npm run build
```

3. The finished application will be in a folder called "release"

Note: For most users, it is easier to download a pre-built version from the releases section rather than building from source.

#### Building for Specific Platforms

- **Windows**: `npm run build:win` - Creates a portable .exe file and an installer
- **Linux (Ubuntu/Mint)**: `npm run build:linux` - Creates an AppImage (single file) and .deb package
- **Mac**: `npm run build:mac` - Creates a .dmg file
- **All Platforms**: `npm run build:all` - Creates builds for Windows, Linux, and Mac

#### Single File Executables

Keyforge builds as a single executable file on each platform:

- **Windows**: A portable .exe file that runs without installation. Just double-click to run.
- **Linux**: An AppImage file that runs without installation. Make it executable and double-click to run.
- **Linux (Ubuntu/Mint)**: A .deb package for easy installation via package manager.
- **macOS**: A .dmg file for installation.

The single file contains everything needed to run Keyforge. You do not need to install Node.js or any other software on the computer where you run it.

## How to Use Keyforge

### First Time Setup

When you first open Keyforge:

1. You will see a screen asking you to create a master password
2. Select your preferred language from the dropdown in the top-right corner (defaults to English 🇬🇧)
3. Create a strong master password. It must be at least 10 characters long and include:
   - Uppercase letters (A-Z)
   - Lowercase letters (a-z)
   - Numbers (0-9)
   - Special characters (!@#$%...)
4. Type your master password again to confirm it
5. Your password vault will be created automatically

Important: Remember your master password. If you forget it, you can use your recovery phrase (available in Settings) to regain access. Keyforge does not store your master password anywhere.

### Adding a Password

1. Click the "Add Entry" button in the left sidebar
2. Fill in the information:
   - Title: What this password is for (like "Gmail" or "Bank Account")
   - Username: Your username or email address
   - Password: Your password
   - Website URL: The website address (optional)
   - Notes: Any additional information (optional)
3. Click "Save Entry"

### Generating a Strong Password

Keyforge can create strong, random passwords for you:

1. When adding or editing a password, click the "Generate" button next to the password field
2. A password generator window will open
3. Choose your settings:
   - Length: How long you want the password (8 to 64 characters)
   - Character types: Check which types you want to include
     - Uppercase letters (A-Z)
     - Lowercase letters (a-z)
     - Numbers (0-9)
     - Symbols (!@#$%...)
4. Click "Use Password" to fill it into the password field

You can also click the refresh icon for a quick 16-character password.

### Importing Passwords from Your Browser

If you have passwords saved in Chrome, Firefox, or Edge, you can import them:

1. First, export your passwords from your browser:
   - Chrome: Settings > Passwords > Export passwords
   - Firefox: Settings > Privacy & Security > Saved Logins > Export
   - Edge: Settings > Profiles > Passwords > Export
   
   Save the file as a CSV file.

2. In Keyforge, click the "Import" button in the sidebar

3. Click "Choose File" and select the CSV file you exported

4. Keyforge will show you all the passwords it found

5. Check the boxes next to the passwords you want to import

6. Click "Import" to add them to your vault

### Searching for Passwords

Type in the search box at the top of the sidebar to find passwords quickly. You can search by title, username, website, or notes.

### Viewing, Editing, or Deleting Passwords

- To view: Click on any password in the list to see its details in read-only mode
- To edit: Click the "Edit" button when viewing a password, make your changes, then click "Save"
- To delete: Click the trash icon next to any password in the list
- To copy password: Click the copy icon next to any password in the list

### Locking Your Vault

When you are done using Keyforge, click "Lock Vault" at the bottom of the sidebar. This will lock your vault and require your master password (or recovery phrase) to open it again.

### Changing Your Master Password

You can change your master password at any time:

1. Click "Settings" in the sidebar
2. Go to the "Change Master Password" section
3. Enter your current master password
4. Enter your new master password (must meet the same requirements as the initial password)
5. Confirm your new master password
6. Click "Change Password"

Important: Make sure you remember your new master password or have your recovery phrase saved.

### Recovery Phrase

Keyforge provides a 15-word recovery phrase that you can use to regain access if you forget your master password:

1. Go to Settings
2. Find the "Recovery Phrase" section
3. Click "Show Recovery Phrase" (you can only view this once)
4. Write down all 15 words in order and store them in a safe place
5. You can use these words to log in if you forget your master password

Warning: Store your recovery phrase securely. Anyone with access to it can unlock your vault.

## Security Tips

### Creating a Strong Master Password

Your master password is the key to all your other passwords. Make it strong:

- Use at least 10 characters (16 or more is recommended)
- Mix uppercase and lowercase letters
- Include numbers
- Include symbols like !@#$%
- Do not use words from the dictionary
- Do not use personal information like your name or birthday
- Do not reuse this password anywhere else

Keyforge requires your master password to meet these minimum requirements for security.

### Keeping Your Master Password Safe

- Never share your master password with anyone
- Do not write it down where others can see it
- Consider writing it down and storing it in a physical safe if you are worried about forgetting it
- Remember: if you lose your master password, your data cannot be recovered

### Backing Up Your Passwords

Your password vault is stored on your computer. Consider making a backup:

- The vault file is stored in your app's user data directory
- You can copy this file to a USB drive or cloud storage (it is encrypted, so it is safe)
- Keep backups in multiple safe places

## How Keyforge Protects Your Passwords

### Encryption Process

When you save a password:

1. You enter your master password
2. Keyforge processes your master password 600,000 times using a special algorithm
3. This creates an encryption key that is unique to your password
4. Your passwords are encrypted using military-grade encryption
5. The encrypted data is saved to a file on your computer

### Why This is Secure

- Even if someone steals your password file, they cannot read it without your master password
- The 600,000 processing steps make it nearly impossible to guess your master password
- It would take years or decades for even the fastest computers to crack your password
- Each password entry uses unique random data, so even identical passwords look different when encrypted

### What Happens When You Open Keyforge

1. You enter your master password
2. Keyforge processes it the same way (600,000 times)
3. If the password is correct, your passwords are decrypted
4. Your passwords are only stored in your computer's memory while Keyforge is open
5. When you close Keyforge, the passwords are removed from memory

## Troubleshooting

### The Application Won't Start

- Make sure you installed Node.js and npm correctly
- Make sure you ran "npm install" in the Keyforge2 folder
- Check that port 5173 is not being used by another program

### I Cannot Unlock My Vault

- Make sure you are typing your master password correctly
- Check for typos or extra spaces
- If you truly forgot your master password, your data cannot be recovered

### Import Is Not Working

- Make sure you exported your passwords as a CSV file
- Check that the file is not corrupted
- Try exporting from your browser again

## For Developers

### Project Structure

The project is organized like this:

```
Keyforge2/
├── electron/          Electron main process files
├── src/               Application source code
│   ├── components/   User interface components
│   ├── hooks/        React hooks
│   └── utils/        Helper functions for encryption and storage
├── package.json       Project configuration
└── README.md          This file
```

### Available Commands

- `npm run dev` - Start the application in development mode
- `npm run build` - Create a production build
- `npm run lint` - Check code for errors

### Technology Used

- React 18 with TypeScript for the user interface
- Electron 28 for the desktop application
- Tailwind CSS for styling
- Web Crypto API for encryption

## License

This project is licensed under the MIT License. You are free to use it for personal or commercial purposes.

## Important Disclaimer

This software is provided as-is without any warranty. While Keyforge uses strong encryption, you should:

- Always keep backups of your encrypted vault
- Use a strong master password
- Keep your master password safe

The developers are not responsible for any data loss.

## Getting Help

If you need help or have questions:

- Check this README file first
- Look for error messages in the application
- Make sure you followed all installation steps correctly

## Contributing

If you want to help improve Keyforge:

- Make sure your code follows the existing style
- Keep all security features working correctly
- Test your changes thoroughly
- Update documentation when needed

Thank you for using Keyforge. Your passwords, your control, your security.
