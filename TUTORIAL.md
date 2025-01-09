# Building a Vite React App with Arweave Deployment

This tutorial will guide you through creating a Vite React application and adding deployment capabilities to the Arweave network.

## Initial Setup

1. Create a new Vite project
```bash
npm create vite@latest
```

2. Follow the prompts:
   - Enter your project name
   - Select "React" as your framework
   - Choose "JavaScript" as your variant

3. Navigate to your project and install dependencies
```bash
cd your-project-name
npm install
```

4. Test your development server
```bash
npm run dev
```

## Adding Deployment Capabilities

### 1. Install Required Dependencies
```bash
npm install --save-dev @ardrive/turbo-sdk mime-types yargs
```

### 2. Create Deployment Script Structure

1. Create the scripts directory and files:
```bash
mkdir -p scripts
touch scripts/turbo.js scripts/deploy.js
```

This will create the following structure:
```
your-project/
├── scripts/
│   ├── turbo.js
│   └── deploy.js
```

### 3. Configure Deployment Settings

1. Add the deploy script to package.json:
```json
{
  "scripts": {
    "deploy": "node scripts/deploy.js"
  }
}
```

2. Create a vite.config.js file in your project root:
```javascript
import crypto from "node:crypto";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const indexHtmlHash = {
  name: "html-hash",
  enforce: "post",
  generateBundle(_options, bundle) {
    const indexHtml = bundle["index.html"];
    indexHtml.fileName = `index-${crypto
      .createHash("sha256")
      .update(indexHtml.source)
      .digest("hex")
      .substring(0, 8)}.html`;
  },
};

export default defineConfig({
  plugins: [react(), indexHtmlHash],
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
```

3. Create an initial manifest.json file in your project root:
```json
{
  "manifest": "arweave/paths",
  "version": "0.2.0",
  "index": { "path": "" },
  "paths": {}
}
```

4. Set up your wallet:
   - Export your keyfile*.json from ArConnect wallet
   - Rename the exported file to `wallet.json`
   - Place it in the root of your project

5. Update .gitignore to protect your wallet and manifest:
```
# Deployment files
wallet.json
manifest.json
```

### 4. Implement Deployment Scripts

1. Add the following code to scripts/turbo.js:
```javascript
import { TurboFactory } from '@ardrive/turbo-sdk';
import fs from 'fs';
import mime from 'mime-types';
import path from 'path';
import { Readable } from 'stream';

async function getContentType(filePath) {
    return mime.lookup(filePath) || 'application/octet-stream';
}

export default async function TurboDeploy(jwk) {
    const turbo = TurboFactory.authenticated({ privateKey: jwk });
    const deployFolder = './dist';

    // Load or create manifest
    let manifest;
    try {
        manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf-8'));
    } catch {
        manifest = {
            manifest: 'arweave/paths',
            version: '0.2.0',
            index: { path: '' },
            paths: {}
        };
    }

    async function processFiles(dir) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const relativePath = path.relative(deployFolder, filePath)
                .split(path.sep)
                .join('/');

            if (fs.statSync(filePath).isDirectory()) {
                await processFiles(filePath);
                continue;
            }

            // Skip if file hasn't changed and exists in manifest
            if (manifest.paths[relativePath]) {
                console.log(`- ${relativePath} (unchanged, skipping)`);
                continue;
            }

            console.log(`- ${relativePath} (changed, uploading)`);
            const uploadResult = await turbo.uploadFile({
                fileStreamFactory: () => fs.createReadStream(filePath),
                fileSizeFactory: () => fs.statSync(filePath).size,
                dataItemOpts: {
                    tags: [{ 
                        name: 'Content-Type', 
                        value: await getContentType(filePath) 
                    }],
                },
            });

            manifest.paths[relativePath] = { id: uploadResult.id };
        }
    }

    if (!fs.existsSync(deployFolder)) {
        throw new Error('Dist folder not found. Run npm run build first.');
    }

    await processFiles(deployFolder);

    // Find the hashed index.html file
    const indexPath = Object.keys(manifest.paths)
        .find(path => path.match(/index-.*html$/i));
    
    if (indexPath) {
        manifest.index.path = indexPath;
    }

    // Save updated manifest
    fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));

    // Upload manifest
    const uploadResult = await turbo.uploadFile({
        fileStreamFactory: () => fs.createReadStream('manifest.json'),
        fileSizeFactory: () => fs.statSync('manifest.json').size,
        dataItemOpts: {
            tags: [{
                name: 'Content-Type',
                value: 'application/x.arweave-manifest+json'
            }],
        },
    });

    return uploadResult.id;
}
```

2. Add the following code to scripts/deploy.js:
```javascript
import fs from 'fs';
import TurboDeploy from './turbo.js';

function parseWallet(input) {
    try {
        // First try to parse as JSON
        return JSON.parse(input);
    } catch {
        try {
            // If that fails, try base64 decode then JSON parse
            return JSON.parse(Buffer.from(input, 'base64').toString('utf-8'));
        } catch {
            throw new Error('Invalid wallet format. Must be JSON or base64 encoded JSON');
        }
    }
}

(async () => {
    // Check for wallet.json in project root
    const walletPath = './wallet.json';
    
    if (!fs.existsSync(walletPath)) {
        console.error('wallet.json not found in project root');
        process.exit(1);
    }

    try {
        const walletData = fs.readFileSync(walletPath, 'utf8');
        const jwk = parseWallet(walletData);
        
        const manifestId = await TurboDeploy(jwk);
        console.log(`\nDeployment Complete! 🎉`);
        console.log(`Transaction ID: ${manifestId}`);
        console.log(`View your deployment at: https://arweave.net/${manifestId}\n`);
    } catch (e) {
        console.error('Deployment failed:', e);
        process.exit(1);
    }
})();
```

### 5. Deploy Your Application

1. Build your application:
```bash
npm run build
```

2. Deploy to Arweave:
```bash
npm run deploy
```

You should see output similar to:
```bash
- index-939b0dd3.html (changed, uploading)
- assets/index-fbnN9u7O.js (changed, uploading)
- assets/index-n_ryQ3BS.css (changed, uploading)
...
Deployment Complete! 🎉
Transaction ID: [manifest-id]
View your deployment at: https://arweave.net/[manifest-id]
```

The deployment script will:
- Hash your index.html file for cache busting
- Track file changes in manifest.json
- Only upload changed files
- Automatically set correct MIME types
- Create and upload an Arweave manifest

> ⚠️ Note: Make sure you have sufficient Turbo Credits in your wallet for the deployment. You can purchase credits at https://turbo-topup.com/

[Next steps coming as we implement them...]
