# Building Keyforge

This guide explains how to build Keyforge as a single executable file for different operating systems.

## Prerequisites

Before building, make sure you have:

- Node.js version 18 or higher
- npm (comes with Node.js)
- All dependencies installed (run `npm install`)

## Quick Build

To build for your current platform:

```bash
npm run build
```

This will create the executable in the `release` folder.

## Platform-Specific Builds

### Windows

Builds a portable .exe file and an installer:

```bash
npm run build:win
```

Output files:
- `Keyforge-{version}-portable.exe` - Single executable file, no installation needed
- `Keyforge Setup {version}.exe` - Installer for system-wide installation

### Linux (Ubuntu, Mint, and other distributions)

Builds an AppImage (single file) and a .deb package:

```bash
npm run build:linux
```

Output files:
- `Keyforge-{version}-x64.AppImage` - Single executable file, no installation needed
- `Keyforge-{version}-x64.deb` - Debian package for installation via package manager

#### Running the AppImage on Linux

1. Make the file executable:
   ```bash
   chmod +x Keyforge-{version}-x64.AppImage
   ```

2. Run it:
   ```bash
   ./Keyforge-{version}-x64.AppImage
   ```

Or simply double-click the file in your file manager.

#### Installing the .deb Package on Ubuntu/Mint

1. Install using the package manager:
   ```bash
   sudo dpkg -i Keyforge-{version}-x64.deb
   ```

2. If there are dependency issues, fix them with:
   ```bash
   sudo apt-get install -f
   ```

### macOS

Builds a .dmg file for installation:

```bash
npm run build:mac
```

Output files:
- `Keyforge-{version}-x64.dmg` - Disk image for installation
- `Keyforge-{version}-arm64.dmg` - Disk image for Apple Silicon Macs

## Building for All Platforms

To build for Windows, Linux, and Mac at once:

```bash
npm run build:all
```

Note: You can only build for your current platform unless you use cross-compilation tools.

**Important:** Linux packages (AppImage and .deb) **cannot be built natively on Windows**. You must use WSL (Windows Subsystem for Linux) or a Linux machine. See the [Linux Build Issues](#linux-build-issues) section for details.

## Build Output Location

All built files are placed in the `release` folder in the project directory.

## Single File Executables

Keyforge is designed to run as a single executable file. This means:

- No installation required for portable versions
- Everything needed is included in one file
- Easy to share and distribute
- Works on any compatible computer without additional software

The portable versions (Windows .exe and Linux AppImage) can be run directly without installation. Just download and run.

## Build Optimization

The build process includes several optimizations:

- Code minification for smaller file size
- Tree shaking to remove unused code
- Compression for maximum efficiency
- Production mode optimizations

These optimizations ensure the application runs fast and uses minimal resources.

## Troubleshooting Build Issues

### Build Fails

- Make sure all dependencies are installed: `npm install`
- Check that you have enough disk space
- Ensure Node.js version is 18 or higher

### Linux Build Issues

- Make sure you have required build tools installed
- On Ubuntu/Mint, you may need: `sudo apt-get install build-essential`

#### Building Linux Packages on Windows

**Important:** Linux packages (AppImage and .deb) cannot be built natively on Windows. The build tools required (like `mksquashfs`) are Linux-only binaries that won't run on Windows.

You may encounter errors such as:
- `⨯ symlink ... A required privilege is not held by the client.` (symlink permission error)
- `⨯ cannot execute cause=exec: "...mksquashfs": file does not exist` (Linux tool missing)

**Solution: Use WSL (Windows Subsystem for Linux)** (Required for Windows)

1. Install WSL if you haven't already:
   ```powershell
   wsl --install
   ```
   Restart your computer if prompted.

2. Open a WSL terminal (Ubuntu or your installed distribution)

3. Install Node.js in WSL (if not already installed):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. Navigate to your project in WSL:
   ```bash
   cd /mnt/d/projects/KeyForge
   ```

5. Install dependencies:
   ```bash
   npm install
   ```

6. Build Linux packages:
   ```bash
   npm run build:linux
   ```

**Alternative: Build on a Linux Machine**
- Use a Linux VM, container, or CI/CD service (GitHub Actions, GitLab CI, etc.)
- This is the most reliable method for production builds

### Windows Build Issues

- Ensure you have Visual Studio Build Tools or Visual Studio installed
- Check that you have administrator privileges if needed

### Mac Build Issues

- Ensure you have Xcode Command Line Tools installed
- You may need to sign the application for distribution

## Distribution

Once built, you can:

- Share the single executable file with others
- Distribute via your website or file sharing service
- Include in software repositories (for Linux .deb packages)
- Create installers for easier distribution (Windows .exe installer)

The portable versions are ideal for users who want to run Keyforge without installing anything.
