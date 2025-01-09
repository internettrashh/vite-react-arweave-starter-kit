# Vite+React Arweave Starter Kit

This template provides a minimal setup to get React working in Vite with HMR and Arweave deployment capabilities.

## Features

- ⚡️ Vite for fast development and builds
- ⚛️ React for UI development
- 🔄 HMR (Hot Module Replacement)
- 🌐 Arweave deployment ready
- 📝 File change tracking
- 🔒 Secure wallet handling

## Quick Start

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

3. Set up your wallet:
   - Export your keyfile from ArConnect
   - Rename it to `wallet.json`
   - Place it in the project root

4. Start developing:
```bash
npm run dev
```

5. Build and deploy:
```bash
npm run build
npm run deploy
```

## Documentation

- [Full Tutorial](TUTORIAL.md) - Step-by-step guide to build this from scratch
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Arweave Documentation](https://docs.arweave.org/)

## Plugins

Currently using these official plugins:
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh

## Deployment

This template includes a deployment script that:
- Hashes files for cache busting
- Tracks file changes
- Only uploads modified files
- Sets correct MIME types
- Creates and uploads an Arweave manifest

> ⚠️ Note: Make sure you have sufficient Turbo Credits in your wallet for deployment. You can purchase credits at https://turbo-topup.com/
# vite-react-arweave-starter-kit
