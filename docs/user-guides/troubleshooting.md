# 🔧 Troubleshooting Guide

Common issues and solutions for WajoB users.

## 🔍 Quick Diagnosis

### Issue Categories

| Symptom | Likely Category | Jump To |
|---------|----------------|---------|
| Can't connect wallet | [Wallet Connection](#wallet-connection-issues) |
| Transaction stuck/failed | [Transaction Problems](#transaction-issues) |
| Job not appearing | [Job Display Issues](#job-issues) |
| Payment not received | [Payment Problems](#payment-issues) |
| App won't load | [App Loading Issues](#app-loading-issues) |
| Notifications not working | [Notification Issues](#notification-issues) |

---

## 💼 Wallet Connection Issues

### Problem: "Connect Wallet" Button Not Working

**Symptoms:**
- Button doesn't respond to clicks
- No wallet selection popup appears

**Solutions:**

1. **Update Telegram App**
   ```
   iOS: App Store → Updates → Telegram
   Android: Play Store → My apps → Telegram → Update
   Desktop: Help → Check for Updates
   ```

2. **Clear Telegram Cache**
   - Settings → Data and Storage → Storage Usage
   - Tap "Clear Cache"
   - Restart Telegram

3. **Try Different Wallet**
   - If Tonkeeper doesn't work, try Tonhub
   - Some wallets may have temporary issues

4. **Check Telegram Version**
   - Minimum required: Telegram 9.0+
   - Mini Apps not supported on older versions

**Still not working?**
- Contact support: [@WajoBSupport](https://t.me/WajoBSupport)
- Include: Telegram version, wallet app, device model

---

### Problem: Wallet Connects But Immediately Disconnects

**Symptoms:**
- Connection successful for 2-3 seconds
- Then shows "Disconnected" again

**Solutions:**

1. **Check Wallet App Background**
   - **iOS**: Settings → General → Background App Refresh → Enable for wallet
   - **Android**: Settings → Apps → Wallet → Battery → Unrestricted

2. **Re-establish Connection**
   ```
   Step 1: Disconnect wallet in WajoB
   Step 2: Close wallet app completely
   Step 3: Reopen wallet app
   Step 4: Reconnect in WajoB
   Step 5: Keep wallet app open while using WajoB
   ```

3. **Update Wallet App**
   - Check App Store/Play Store for updates
   - Outdated wallets may have compatibility issues

4. **Reset TON Connect**
   - In wallet app: Settings → Connected Apps
   - Remove WajoB
   - Reconnect fresh

---

### Problem: Wrong Network (Testnet vs Mainnet)

**Symptoms:**
- Balance shows 0 even though you have TON
- Transactions fail with "wrong network"
- Job prices seem wrong

**Solutions:**

1. **Check Current Network**
   - Look for "Testnet" or "Mainnet" badge in wallet
   - WajoB uses **Mainnet** (production)

2. **Switch to Mainnet**
   - **Tonkeeper**: Settings → Network → Mainnet
   - **Tonhub**: Settings → Developer → Network → Mainnet

3. **Reconnect Wallet**
   - Disconnect from WajoB
   - Verify Mainnet in wallet
   - Reconnect to WajoB

**How to verify:**
- Check your address on [tonscan.org](https://tonscan.org)
- Should say "Mainnet" at top
- Balance should match wallet app

---

## 💸 Transaction Issues

### Problem: Transaction Stuck on "Pending"

**Symptoms:**
- Transaction shows "Pending" for >5 minutes
- No confirmation on blockchain

**Solutions:**

1. **Check Network Status**
   - Visit [tonscan.org/status](https://tonscan.org/status)
   - Look for network congestion alerts
   - High load = slower confirmations

2. **Wait Patiently**
   - Normal confirmation: 5-30 seconds
   - During congestion: 2-5 minutes
   - Maximum wait: 10 minutes

3. **Check Transaction Hash**
   - Copy transaction hash from WajoB
   - Search on [tonscan.org](https://tonscan.org)
   - See actual blockchain status

4. **Retry Transaction**
   - If stuck >10 minutes, try again
   - Original may fail (that's okay)
   - Second attempt usually succeeds

**When to contact support:**
- Stuck >30 minutes
- Funds deducted but transaction not found
- Multiple retry attempts failed

---

### Problem: "Insufficient Gas" Error

**Symptoms:**
- Transaction fails with error message
- Shows "Not enough TON for gas fees"
- Balance seems sufficient

**Solutions:**

1. **Check Total Required**
   ```
   Required = Transaction Amount + Gas Fee + Buffer
   Example:
   - Job payment: 10 TON
   - Gas estimate: 0.05 TON
   - Recommended buffer: 0.1 TON
   - TOTAL NEEDED: 10.15 TON
   ```

2. **Add More TON**
   - Keep minimum 0.2 TON for gas
   - Buy more or receive transfer
   - Wait for confirmation before retrying

3. **Reduce Transaction Amount**
   - If posting job, lower payment slightly
   - Ensure you leave gas buffer

4. **Check for Dust**
   - Very small balances may not be usable
   - Minimum transaction: ~0.01 TON

---

### Problem: Transaction Failed/Rejected

**Symptoms:**
- Transaction shows "Failed" or "Rejected"
- Funds not deducted (or returned)

**Common Causes & Solutions:**

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Insufficient funds" | Not enough TON | Add more TON to wallet |
| "Invalid recipient" | Wrong address format | Check job/escrow details |
| "Contract error" | Smart contract rejected | Check job status (may be filled) |
| "User rejected" | You cancelled in wallet | Approve transaction in wallet |
| "Timeout" | Network slow | Retry transaction |
| "Nonce too low" | Old transaction | Wait 1 minute, retry |

**General troubleshooting:**
1. Check error message details
2. Verify transaction parameters
3. Wait 1-2 minutes
4. Retry with fresh transaction

---

## 💼 Job Issues

### Problem: Posted Job Not Appearing

**Symptoms:**
- Job created successfully
- But not visible in job listings
- No applications received

**Solutions:**

1. **Check Job Status**
   - Go to Profile → My Jobs
   - Verify job shows as "Active"
   - If "Draft", job not published yet

2. **Verify Escrow Funded**
   - Jobs only appear after escrow funded
   - Check if funding transaction completed
   - View on [tonscan.org](https://tonscan.org)

3. **Refresh App**
   - Pull down to refresh job list
   - Or close and reopen WajoB
   - Clear cache if needed

4. **Check Filters**
   - Someone viewing may have filters active
   - Try "All Categories" and "All Locations"

**Verification steps:**
```
1. Profile → My Jobs → See your job ✅
2. Copy job ID
3. Search in main list by ID
4. Should appear in relevant category
```

---

### Problem: Can't Apply to Job

**Symptoms:**
- "Apply" button grayed out or missing
- Error when trying to apply

**Common Reasons:**

| Reason | Solution |
|--------|----------|
| Already applied | Check My Applications |
| Job filled | Look for "Filled" badge |
| You're the employer | Can't apply to own jobs |
| Wallet not connected | Connect wallet first |
| Insufficient reputation | Build rating through other jobs |

**How to check:**
1. Tap job to see details
2. Read status at top
3. Check eligibility requirements

---

### Problem: Job Details Not Loading

**Symptoms:**
- Blank screen when opening job
- Loading spinner forever
- "Failed to load" error

**Solutions:**

1. **Check Internet Connection**
   - Switch WiFi/mobile data
   - Test other apps
   - Restart router if needed

2. **Clear App Cache**
   - Telegram Settings → Data and Storage
   - Clear Cache
   - Reopen WajoB

3. **Update App**
   - Ensure latest Telegram version
   - Update may fix loading bugs

4. **Report if Persistent**
   - May be corrupt job data
   - Contact support with job ID

---

## 💰 Payment Issues

### Problem: Payment Not Received After Job Completion

**Symptoms:**
- Employer confirmed completion
- But TON not in your wallet
- Shows "Released" but no funds

**Solutions:**

1. **Check Transaction Status**
   ```
   Step 1: Go to job details
   Step 2: View escrow status
   Step 3: Should say "Released"
   Step 4: Copy transaction hash
   Step 5: Check on tonscan.org
   ```

2. **Wait for Confirmation**
   - Blockchain confirmations: ~30 seconds
   - Network congestion: 2-5 minutes
   - Check wallet balance periodically

3. **Verify Wallet Address**
   - Ensure correct wallet connected
   - Check address matches application
   - May have switched wallets

4. **Check Wallet App**
   - Sometimes wallet doesn't update
   - Close and reopen wallet app
   - Check transaction history

**If still missing after 10 minutes:**
- Contact support: support@wagob.io
- Provide: Job ID, transaction hash, wallet address

---

### Problem: Escrow Stuck - Can't Release Payment

**Symptoms:**
- Employer tries to release
- Transaction fails or button disabled

**Solutions:**

1. **Verify Job Completion**
   - Job status must be "Completed"
   - Worker must have marked complete
   - Both parties must confirm

2. **Check Escrow Deadline**
   - If deadline passed, may auto-refund
   - Check escrow details for deadline
   - Contact support for manual release

3. **Ensure Sufficient Gas**
   - Release transaction costs ~0.01 TON
   - Employer needs gas in wallet
   - Even though funds in escrow

4. **Try Different Wallet**
   - Disconnect and reconnect
   - Sometimes fixes state issues

---

### Problem: Disputed Payment

**Symptoms:**
- Employer refuses to release
- Worker claims job done
- Deadline approaching

**Resolution Process:**

1. **Communication First**
   - Use in-app chat
   - Clarify dispute
   - Attempt resolution

2. **Provide Evidence**
   - Screenshots of work
   - Timestamps
   - Communication logs

3. **Request Arbitration**
   - Tap "Dispute" in escrow
   - Fill dispute form
   - Upload evidence

4. **Support Review**
   - Team reviews within 24-48 hours
   - May request additional info
   - Decision is final

**Dispute outcomes:**
- Release to worker (if work proven)
- Refund to employer (if work not done)
- Partial release (if partially completed)

---

## 📱 App Loading Issues

### Problem: WajoB Won't Open

**Symptoms:**
- Blank screen when launching
- Immediate crash
- "Failed to load" error

**Solutions:**

1. **Clear Telegram Cache**
   ```
   Settings → Data and Storage → Storage Usage
   → Clear Cache → Restart Telegram
   ```

2. **Update Telegram**
   - Check for app updates
   - Minimum version: 9.0

3. **Reinstall Telegram**
   - Backup chats first!
   - Uninstall Telegram
   - Reinstall from store
   - Reopen WajoB

4. **Try Different Device**
   - Test on desktop if using mobile
   - Or vice versa
   - Isolate device-specific issues

---

### Problem: Slow Performance/Lag

**Symptoms:**
- App responds slowly
- Scrolling is choppy
- Buttons delayed

**Solutions:**

1. **Close Other Apps**
   - Free up RAM
   - Close background apps
   - Restart device

2. **Reduce Data Usage**
   - Telegram Settings → Data and Storage
   - Enable "Low Data Usage"
   - Reduces media downloads

3. **Clear Storage**
   - Clear Telegram cache
   - Delete old chats/media
   - Free up device storage

4. **Update Device Software**
   - iOS: Settings → General → Software Update
   - Android: Settings → System → System Update

**Minimum requirements:**
- iOS 12.0+ / Android 6.0+
- 2GB RAM
- 100MB free storage

---

## 🔔 Notification Issues

### Problem: Not Receiving Job Alerts

**Symptoms:**
- No notifications for new jobs
- Miss application updates
- No payment notifications

**Solutions:**

1. **Enable Telegram Notifications**
   ```
   iOS: Settings → Notifications → Telegram → Allow
   Android: Settings → Apps → Telegram → Notifications → Allow
   ```

2. **Enable In-App Notifications**
   - WajoB Settings → Notifications
   - Enable relevant alerts:
     - New jobs matching preferences ✅
     - Application updates ✅
     - Payment notifications ✅
     - Messages from employers/workers ✅

3. **Check Do Not Disturb**
   - May be blocking notifications
   - Whitelist Telegram

4. **Telegram Notification Settings**
   - Settings → Notifications and Sounds
   - Enable "In-app notifications"
   - Enable "Badge counter"

---

### Problem: Too Many Notifications

**Symptoms:**
- Notification spam
- Constant alerts
- Battery drain

**Solutions:**

1. **Customize Notification Preferences**
   ```
   WajoB Settings → Notifications
   
   Recommended settings:
   - New jobs: Only matching categories ✅
   - Applications: Important updates only ✅
   - Messages: All ✅
   - Payments: All ✅
   - Marketing: Off ❌
   ```

2. **Set Quiet Hours**
   - WajoB Settings → Quiet Hours
   - Example: 10 PM - 7 AM
   - Only urgent alerts during this time

3. **Mute Specific Categories**
   - If certain job types too frequent
   - Mute category in preferences
   - Still visible in app, just no notifications

---

## 🔐 Security Issues

### Problem: Suspicious Transaction Request

**Symptoms:**
- Unexpected transaction popup
- Unfamiliar recipient address
- Very high gas fee

**IMMEDIATE ACTIONS:**

1. **DO NOT APPROVE** ❌
2. **Take screenshot**
3. **Disconnect wallet immediately**
4. **Report to support**

**Verification checklist:**
- ✅ Is this transaction expected?
- ✅ Recognize the recipient?
- ✅ Amount seems correct?
- ✅ Gas fee reasonable (<0.1 TON)?

**If ANY red flags:**
- Reject transaction
- Disconnect wallet
- Report incident
- Scan device for malware

---

### Problem: Account Compromised

**Symptoms:**
- Jobs posted you didn't create
- Applications you didn't send
- Unauthorized wallet connection

**URGENT STEPS:**

1. **Disconnect Wallet** (Top priority!)
   ```
   WajoB: Tap wallet → Disconnect
   Wallet App: Settings → Connected Apps → Remove WajoB
   ```

2. **Change Telegram Password**
   - Settings → Privacy and Security
   - Set strong 2FA password

3. **Enable 2FA**
   - Telegram Settings → Privacy and Security
   - Two-Step Verification → Enable

4. **Review Sessions**
   - Settings → Devices
   - Terminate all other sessions

5. **Contact Support**
   - Email: security@wagob.io
   - Include: Timeline, suspicious activity details

6. **Create New Wallet** (If needed)
   - Transfer funds to new wallet
   - Use new wallet with WajoB
   - Old wallet may be compromised

---

## 🆘 Getting Additional Help

### Self-Service Resources

- 📚 [User Guides](./README.md)
- 🎥 [Video Tutorials](../tutorials/videos.md)
- ❓ [FAQ](../tutorials/faq.md)
- 💬 [Community Forum](https://t.me/WajoBCommunity)

### Contact Support

| Issue Type | Contact Method | Response Time |
|------------|----------------|---------------|
| **Critical** (Security, lost funds) | security@wagob.io | 2-4 hours |
| **Urgent** (Can't work/hire) | [@WajoBSupport](https://t.me/WajoBSupport) | 4-8 hours |
| **General** (Questions, bugs) | support@wagob.io | 24 hours |
| **Feature requests** | [GitHub Discussions](https://github.com/yuvrajsharmaaa/WajoB/discussions) | 3-5 days |

### When Contacting Support, Include:

1. **Problem description**
   - What happened?
   - Expected vs actual behavior

2. **Steps to reproduce**
   - How to trigger the issue?

3. **Environment**
   - Device: iPhone 13, Android Samsung S21, etc.
   - Telegram version: 10.3.1
   - Wallet app: Tonkeeper 3.2.0

4. **Screenshots/Videos**
   - Visual evidence helps!
   - Redact sensitive info (seed phrase, full addresses)

5. **Transaction details** (if applicable)
   - Transaction hash
   - Job ID
   - Wallet address (public, safe to share)

---

## 📊 Known Issues & Status

Check current known issues: [status.wagob.io](https://status.wagob.io)

### Current Known Issues (Updated: Nov 23, 2025)

- ✅ **RESOLVED**: Wallet connection on iOS 16.0 - Fixed in v2.0.1
- ⚠️ **IN PROGRESS**: Occasional notification delays (working on fix)
- 🔍 **INVESTIGATING**: Some users report slow job loading

**Subscribe to status updates:**
- Telegram: [@WajoBStatus](https://t.me/WajoBStatus)
- Email: [Subscribe to status page](https://status.wagob.io/subscribe)

---

## 💡 Pro Tips to Avoid Issues

### Prevention Checklist

- ✅ Keep apps updated (Telegram, wallet, WajoB)
- ✅ Maintain 0.2+ TON for gas fees
- ✅ Read transaction details before approving
- ✅ Use recommended wallets (Tonkeeper, Tonhub)
- ✅ Clear cache monthly
- ✅ Backup seed phrase securely
- ✅ Enable 2FA on Telegram
- ✅ Review connected apps regularly

### Regular Maintenance

**Weekly:**
- Check wallet balance
- Review active jobs
- Clear Telegram cache
- Update apps if available

**Monthly:**
- Review transaction history
- Audit connected apps
- Update security settings
- Backup important data

---

**Issue not listed?**

[Search our FAQ](../tutorials/faq.md) | [Ask the community](https://t.me/WajoBCommunity) | [Contact support](mailto:support@wagob.io)

---

*Last updated: November 23, 2025 • [Report documentation issue](https://github.com/yuvrajsharmaaa/WajoB/issues)*
