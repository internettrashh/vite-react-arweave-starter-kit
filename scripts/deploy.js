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
