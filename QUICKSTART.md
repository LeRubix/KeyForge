# Quick Start Guide

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

## Development

2. **Run in development mode:**
   ```bash
   npm run dev
   ```
   
   This will:
   - Start the Vite dev server on http://localhost:5173
   - Launch Electron when the server is ready
   - Open DevTools automatically

## Building for Production

3. **Build the application:**
   ```bash
   npm run build
   ```
   
   This will:
   - Compile TypeScript files
   - Build the React app
   - Compile Electron main process
   - Create distributable packages in the `release` folder

## First Run

1. When you first launch Keyforge, you'll be prompted to create a master password
2. Choose a strong master password (minimum 8 characters, but 16+ recommended)
3. Your encrypted vault will be created automatically
4. Start adding password entries!

## Security Notes

- **Never forget your master password** - it cannot be recovered
- The vault is stored locally in your app's user data directory
- All encryption happens on your device - nothing is sent to any server
- Consider backing up the encrypted vault file periodically

## Troubleshooting

### Electron won't start
- Make sure port 5173 is available
- Check that all dependencies are installed: `npm install`

### Build fails
- Ensure TypeScript is properly installed: `npm install -g typescript` (or use npx)
- Check that all dependencies are up to date

### Vault won't unlock
- Verify you're using the correct master password
- If the vault file is corrupted, you may need to delete it and start over (you'll lose all data)
