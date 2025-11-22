# 🧪 Testnet Deployment Instructions

## Quick Start - Deploy Contracts to TON Testnet

Follow these steps to deploy your smart contracts to TON testnet:

---

## Prerequisites

1. **Get Testnet TON**
   - Visit the testnet faucet bot: https://t.me/testgiver_ton_bot
   - Send `/start` to get free testnet TON
   - You'll receive ~5 TON on testnet (not real money!)

2. **Install TON Wallet**
   - Use Tonkeeper wallet: https://tonkeeper.com
   - Switch to testnet mode in settings
   - Or use any TON wallet that supports testnet

---

## Step 1: Deploy Smart Contracts

Open terminal and navigate to contract directory:

```bash
cd /home/yuvrajs/Desktop/wagob/contract
```

### Deploy JobRegistry

```bash
npx blueprint run deployDeployJobRegistry --testnet
```

**What to do:**
1. Select your wallet connection method (TON Connect recommended)
2. Scan QR code with your testnet wallet
3. Approve the deployment transaction (~0.05 TON)
4. Wait for confirmation
5. **COPY THE CONTRACT ADDRESS** shown in output

Example output:
```
JobRegistry deployed at: EQAbc123...xyz
Owner: EQDef456...uvw
Initial job count: 0
```

### Deploy Escrow

```bash
npx blueprint run deployDeployEscrow --testnet
```

1. Scan QR code again
2. Approve transaction
3. **COPY THE CONTRACT ADDRESS**

Example output:
```
Escrow deployed at: EQGhi789...rst
Owner: EQDef456...uvw
Platform fee: 2.5%
Initial escrow count: 0
Fee (basis points): 250
```

### Deploy Reputation

```bash
npx blueprint run deployDeployReputation --testnet
```

1. Scan QR code
2. Approve transaction
3. **COPY THE CONTRACT ADDRESS**

Example output:
```
Reputation deployed at: EQJkl012...opq
Owner: EQDef456...uvw
Initial rating count: 0
```

---

## Step 2: Update Frontend Configuration

Open the file: `/home/yuvrajs/Desktop/wagob/src/config/contracts.js`

Replace the `null` values with your deployed contract addresses:

```javascript
export const CONTRACTS = {
  testnet: {
    jobRegistry: 'EQAbc123...xyz',  // ← Paste JobRegistry address here
    escrow: 'EQGhi789...rst',       // ← Paste Escrow address here
    reputation: 'EQJkl012...opq',   // ← Paste Reputation address here
  },
  
  mainnet: {
    // Leave these as null for now
    jobRegistry: null,
    escrow: null,
    reputation: null,
  }
};
```

**Important:** Make sure to include the full address with the `EQ` prefix!

---

## Step 3: Verify Deployment

1. **Check contracts on TON Explorer:**
   - JobRegistry: `https://testnet.tonscan.org/address/YOUR_ADDRESS`
   - Escrow: `https://testnet.tonscan.org/address/YOUR_ADDRESS`
   - Reputation: `https://testnet.tonscan.org/address/YOUR_ADDRESS`

2. **Verify in your app:**
   ```bash
   cd /home/yuvrajs/Desktop/wagob
   npm start
   ```
   
   - Check that the "⚠️ Deploy Contracts" badge is gone
   - The "🧪 TESTNET" badge should still be visible
   - Try connecting your wallet and applying to a job

---

## Step 4: Test Contract Interactions

Once deployed and configured, you can test:

### Test Job Creation
```bash
# In /contract directory
npx blueprint run
# Select: "Custom script"
# Create a test script to call create_job
```

### View on Explorer
Every transaction you make will be visible on:
```
https://testnet.tonscan.org/address/YOUR_CONTRACT_ADDRESS
```

---

## Troubleshooting

### "No funds to deploy"
- **Solution**: Get more testnet TON from https://t.me/testgiver_ton_bot

### "Network timeout"
- **Solution**: 
  1. Check your internet connection
  2. Try again - testnet can be slow sometimes
  3. Make sure your wallet is on testnet mode

### "Wallet not connecting"
- **Solution**: 
  1. Make sure wallet is in testnet mode
  2. Try using TON Connect QR code
  3. Refresh the page and try again

### Contract address is empty after deployment
- **Solution**: Check terminal output carefully and copy the full address including `EQ` prefix

---

## Important Notes

### Testnet vs Mainnet

**Testnet:**
- ✅ Free TON from faucet
- ✅ Safe for testing
- ✅ Can make mistakes
- ❌ Not real money
- ❌ Contracts can disappear (network resets)

**Mainnet:**
- ❌ Real TON costs real money
- ❌ Mistakes cost money
- ✅ Real money
- ✅ Permanent contracts

### When to Move to Mainnet

Only deploy to mainnet when:
- [ ] All contracts tested thoroughly on testnet
- [ ] Full job lifecycle tested (create → escrow → complete → rate)
- [ ] Dispute mechanism tested
- [ ] Reputation system tested
- [ ] Security audit completed (recommended)
- [ ] UI/UX tested with real users on testnet

---

## Next Steps After Deployment

1. **Create Test Jobs**
   - Use the app to create jobs
   - Test the full flow from creation to completion

2. **Test Escrow Flow**
   - Fund an escrow
   - Lock it
   - Test mutual confirmation
   - Test dispute mechanism

3. **Test Reputation**
   - Submit ratings after job completion
   - Check reputation scores
   - Verify anti-gaming (can't rate same job twice)

4. **Monitor Gas Usage**
   - Check transaction costs on explorer
   - Optimize if needed

---

## Contract Addresses Reference

After deployment, save your addresses here for quick reference:

```
JobRegistry:  _________________________________
Escrow:       _________________________________
Reputation:   _________________________________

Deployed on: _________________ (date)
Network:     Testnet
Owner:       _________________________________
```

---

## Switching to Mainnet (Future)

When ready for mainnet:

1. Change in `/src/config/contracts.js`:
   ```javascript
   export const NETWORK = {
     current: 'mainnet',  // ← Change from 'testnet' to 'mainnet'
   ```

2. Deploy to mainnet:
   ```bash
   npx blueprint run deployDeployJobRegistry --mainnet
   npx blueprint run deployDeployEscrow --mainnet
   npx blueprint run deployDeployReputation --mainnet
   ```

3. Update mainnet addresses in config

---

## Support

- **TON Documentation**: https://docs.ton.org
- **Blueprint Docs**: https://github.com/ton-org/blueprint
- **Testnet Explorer**: https://testnet.tonscan.org
- **Testnet Faucet**: https://t.me/testgiver_ton_bot
- **TON Community**: https://t.me/tondev

---

**Remember:** Testnet is for testing! Don't worry about making mistakes. 🧪
