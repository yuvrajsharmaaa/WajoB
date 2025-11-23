# 🔒 WajoB Security Best Practices

## Overview

This document provides comprehensive security guidelines for the WajoB ecosystem, covering smart contracts, wallet management, Telegram bot security, and backend services.

---

## 🔐 Smart Contract Security

### 1. Authorization & Access Control

#### Caller Verification Pattern

```func
;; JobRegistry.fc - Example authorization pattern

() authorize_employer(slice sender_address, int job_id) impure inline {
    var (employer_addr, worker_addr, status, wages) = load_job_data(job_id);
    
    ;; Verify caller is the employer
    throw_unless(error::unauthorized, equal_slices(sender_address, employer_addr));
}

() create_job(
    int job_id,
    slice employer,
    int wages,
    int duration
) impure {
    slice sender = get_sender();
    
    ;; Only allow registered users (can be verified via backend integration)
    throw_if(error::sender_invalid, equal_slices(sender, addr_none()));
    
    ;; Verify sufficient message value for storage
    int msg_value = get_msg_value();
    throw_unless(error::insufficient_value, msg_value >= min_storage_fee());
    
    ;; Store job data
    store_job(job_id, employer, wages, duration, status::posted);
}

() assign_worker(int job_id, slice worker) impure {
    slice sender = get_sender();
    
    ;; Verify sender is the employer
    authorize_employer(sender, job_id);
    
    ;; Verify job is in correct status
    var (_, _, status, _) = load_job_data(job_id);
    throw_unless(error::invalid_status, status == status::posted);
    
    ;; Update job
    update_job_worker(job_id, worker, status::in_progress);
}
```

#### Multi-Signature Requirements for High-Value Operations

```func
;; Escrow.fc - Multi-sig for dispute resolution

global int admin1_addr;
global int admin2_addr;
global int admin3_addr;

() resolve_dispute(int job_id, int decision, slice sig1, slice sig2) impure {
    ;; Require 2 of 3 admin signatures
    int valid_sigs = 0;
    
    if (check_signature(decision, sig1, admin1_addr)) {
        valid_sigs += 1;
    }
    if (check_signature(decision, sig2, admin2_addr)) {
        valid_sigs += 1;
    }
    
    throw_unless(error::insufficient_signatures, valid_sigs >= 2);
    
    ;; Execute dispute resolution
    execute_resolution(job_id, decision);
}
```

### 2. Gas Optimization

#### Minimize On-Chain Storage

```func
;; BAD - Storing full strings on-chain
cell job_data = begin_cell()
    .store_ref(
        begin_cell()
            .store_string("Security Guard Needed")  ;; Expensive!
            .store_string("Night shift security...")  ;; Very expensive!
        .end_cell()
    )
    .end_cell();

;; GOOD - Store only hash/reference
cell job_data = begin_cell()
    .store_uint(job_id, 64)
    .store_slice(employer_addr)
    .store_coins(wages)
    .store_uint(duration, 32)
    .store_uint(ipfs_hash, 256)  ;; Reference to off-chain data
    .end_cell();
```

#### Efficient Data Structures

```func
;; Use dictionaries for large datasets
(cell jobs_dict) = new_dict();

;; Store job with minimal data
jobs_dict~udict_set(64, job_id, begin_cell()
    .store_slice(employer)
    .store_coins(wages)
    .store_uint(status, 8)
    .end_cell().begin_parse()
);

;; Retrieve efficiently
(slice job_data, int found?) = jobs_dict.udict_get?(64, job_id);
throw_unless(error::job_not_found, found?);
```

#### Gas Estimation & Limits

```func
;; Set reasonable gas limits
const int max_compute_gas = 1000000;  ;; 1M gas units

() process_batch_ratings(cell ratings_list) impure {
    int gas_used = 0;
    
    ;; Process ratings with gas tracking
    do {
        (slice rating, ratings_list) = ratings_list~load_ref().begin_parse();
        
        ;; Check gas limit
        gas_used = get_gas_consumed();
        throw_if(error::gas_limit_exceeded, gas_used > max_compute_gas);
        
        process_rating(rating);
    } until (ratings_list.null?());
}
```

### 3. Error Handling & Partial Executions

#### Graceful Out-of-Gas Handling

```func
;; Escrow.fc - Safe fund release with gas checks

() release_funds(int job_id) impure {
    ;; Load escrow data
    var (employer, worker, amount, status) = load_escrow(job_id);
    
    ;; Verify status
    throw_unless(error::invalid_status, status == escrow_status::confirmed);
    
    ;; Reserve gas for critical operations
    reserve_gas(50000);  ;; Reserve for storage update
    
    try {
        ;; Send funds to worker
        var msg = begin_cell()
            .store_uint(0x18, 6)
            .store_slice(worker)
            .store_coins(amount)
            .store_uint(0, 107)
            .end_cell();
        
        send_raw_message(msg, 1);  ;; Pay fees from message value
        
        ;; Update status only if send succeeded
        update_escrow_status(job_id, escrow_status::completed);
        
    } catch (_, _) {
        ;; Revert status change, keep funds locked
        ;; Log error for manual intervention
        emit_error_event(job_id, error::release_failed);
    }
}
```

#### Idempotent Operations

```func
;; Allow safe retry of failed operations
() fund_escrow(int job_id) impure {
    var (employer, worker, amount, status) = load_escrow(job_id);
    
    ;; Idempotent: If already funded, just return success
    if (status >= escrow_status::funded) {
        return ();
    }
    
    ;; Verify payment amount
    int msg_value = get_msg_value();
    throw_unless(error::incorrect_amount, msg_value >= amount);
    
    ;; Update status
    update_escrow_status(job_id, escrow_status::funded);
    set_funding_timestamp(job_id, now());
}
```

### 4. Common Vulnerability Protections

#### Reentrancy Protection

```func
;; Use checks-effects-interactions pattern
global int locked;

() withdraw_funds(slice recipient, int amount) impure {
    ;; Check: Reentrancy guard
    throw_if(error::reentrant_call, locked);
    locked = true;
    
    ;; Check: Sufficient balance
    int balance = get_balance();
    throw_unless(error::insufficient_funds, balance >= amount);
    
    ;; Effects: Update state BEFORE external call
    deduct_balance(recipient, amount);
    
    ;; Interactions: External call last
    send_funds(recipient, amount);
    
    locked = false;
}
```

#### Integer Overflow/Underflow Protection

```func
;; Safe arithmetic operations
int safe_add(int a, int b) inline {
    int result = a + b;
    throw_if(error::overflow, (result < a) | (result < b));
    return result;
}

int safe_sub(int a, int b) inline {
    throw_unless(error::underflow, a >= b);
    return a - b;
}

int safe_mul(int a, int b) inline {
    if ((a == 0) | (b == 0)) {
        return 0;
    }
    int result = a * b;
    throw_unless(error::overflow, result / a == b);
    return result;
}

;; Usage
() update_reputation(int user_id, int new_rating) impure {
    var (total_score, rating_count) = load_reputation(user_id);
    
    ;; Safe operations
    total_score = safe_add(total_score, new_rating);
    rating_count = safe_add(rating_count, 1);
    
    store_reputation(user_id, total_score, rating_count);
}
```

#### Transaction Ordering (MEV) Protection

```func
;; Use deadlines and slippage protection
() accept_job(int job_id, int max_gas_price, int deadline) impure {
    ;; Check deadline
    throw_if(error::deadline_exceeded, now() > deadline);
    
    ;; Check gas price (if available in TON)
    ;; int current_gas = get_gas_price();
    ;; throw_if(error::gas_too_high, current_gas > max_gas_price);
    
    ;; Proceed with job acceptance
    var (employer, wages, status) = load_job(job_id);
    throw_unless(error::invalid_status, status == status::posted);
    
    assign_worker(job_id, get_sender());
}
```

### 5. Formal Verification & Testing

#### Static Analysis Checklist

```bash
# TON Contract Verification Steps

# 1. Use FunC compiler with strict mode
func -W -o build/contract.fif contracts/Contract.fc

# 2. Check for common issues
# - Unchecked return values
# - Missing error handlers
# - Uninitialized variables
# - Gas consumption patterns

# 3. Run static analyzer (if available)
ton-analyzer contracts/Contract.fc --strict --report=analysis.json

# 4. Gas estimation
toncli run-tests --gas-report
```

#### Security Audit Checklist

```markdown
## Smart Contract Security Audit

### Access Control
- [ ] All sensitive functions have proper authorization
- [ ] Caller verification uses secure methods
- [ ] Admin functions require multi-sig (if applicable)
- [ ] Role-based access is correctly implemented

### State Management
- [ ] State transitions are atomic
- [ ] No race conditions in state updates
- [ ] Proper use of storage (c4/c5)
- [ ] State rollback handled correctly

### Error Handling
- [ ] All error cases have explicit throws
- [ ] Error codes are documented
- [ ] Out-of-gas scenarios handled
- [ ] Partial execution states are safe

### Arithmetic Safety
- [ ] No integer overflow/underflow
- [ ] Division by zero checks
- [ ] Safe math functions used
- [ ] Precision loss considered

### External Calls
- [ ] Reentrancy protection in place
- [ ] Checks-effects-interactions pattern used
- [ ] Return values checked
- [ ] Gas forwarding controlled

### Data Validation
- [ ] All inputs validated
- [ ] Address format checked
- [ ] Amount limits enforced
- [ ] Timestamp validation

### Gas Optimization
- [ ] Minimal on-chain storage
- [ ] Efficient data structures
- [ ] Gas limits enforced
- [ ] Operations batched where possible
```

---

## 💼 Wallet Management Security

### 1. TON Connect SDK Implementation

#### Verified SDK Version

```typescript
// package.json - Use verified versions
{
  "dependencies": {
    "@tonconnect/ui-react": "^2.0.0",  // Official SDK
    "@tonconnect/sdk": "^3.0.0"
  }
}
```

#### Secure Initialization

```typescript
// src/hooks/useTonConnect.ts
import { TonConnectUI } from '@tonconnect/ui-react';
import { CHAIN } from '@tonconnect/sdk';

export function useTonConnectSecure() {
  const tonConnectUI = useMemo(() => {
    return new TonConnectUI({
      manifestUrl: 'https://wagob.com/tonconnect-manifest.json',
      actionsConfiguration: {
        twaReturnUrl: 'https://t.me/WagoBBot/app',
        returnStrategy: 'back',  // Secure return to Telegram
        skipRedirectToWallet: 'ios',  // iOS-specific security
      },
      // Network validation
      network: process.env.NODE_ENV === 'production' 
        ? CHAIN.MAINNET 
        : CHAIN.TESTNET,
    });
  }, []);

  // Verify connection state
  useEffect(() => {
    const checkConnection = () => {
      if (!tonConnectUI.connected) return;
      
      // Verify wallet address format
      const wallet = tonConnectUI.wallet;
      if (!isValidTonAddress(wallet?.account.address)) {
        tonConnectUI.disconnect();
        throw new Error('Invalid wallet address detected');
      }
    };
    
    tonConnectUI.onStatusChange(checkConnection);
  }, [tonConnectUI]);

  return tonConnectUI;
}

// Address validation
function isValidTonAddress(address?: string): boolean {
  if (!address) return false;
  
  try {
    // Validate address format (EQ... or UQ...)
    const addressRegex = /^(EQ|UQ)[A-Za-z0-9_-]{46}$/;
    if (!addressRegex.test(address)) return false;
    
    // Parse to verify it's a valid TON address
    Address.parse(address);
    return true;
  } catch {
    return false;
  }
}
```

### 2. Transaction Approval Flow Security

#### Secure Transaction Building

```typescript
// src/services/transactionBuilder.ts
import { beginCell, toNano, Address } from '@ton/core';

interface SecureTransactionParams {
  validUntil: number;  // Deadline protection
  sequenceNumber?: number;  // Replay protection
  maxGasPrice?: string;  // Gas price limit
}

export class SecureTransactionBuilder {
  private static readonly MAX_VALID_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly MIN_GAS_RESERVE = toNano('0.05');

  static buildJobCreationTx(
    jobId: number,
    contractAddress: string,
    params: SecureTransactionParams
  ) {
    // Validate deadline
    const now = Date.now();
    const validUntil = params.validUntil || now + this.MAX_VALID_DURATION;
    
    if (validUntil > now + this.MAX_VALID_DURATION) {
      throw new Error('Transaction deadline too far in future');
    }
    
    if (validUntil <= now) {
      throw new Error('Transaction deadline already passed');
    }

    // Validate contract address
    try {
      Address.parse(contractAddress);
    } catch {
      throw new Error('Invalid contract address');
    }

    // Build transaction with security parameters
    return {
      validUntil: Math.floor(validUntil / 1000),
      messages: [
        {
          address: contractAddress,
          amount: this.MIN_GAS_RESERVE.toString(),
          payload: this.buildJobPayload(jobId).toBoc().toString('base64'),
        }
      ],
    };
  }

  private static buildJobPayload(jobId: number): Cell {
    return beginCell()
      .storeUint(0x7362d09c, 32)  // create_job op code
      .storeUint(jobId, 64)
      .endCell();
  }

  // Validate transaction before sending
  static validateTransaction(tx: any): boolean {
    if (!tx.validUntil || tx.validUntil <= Date.now() / 1000) {
      return false;
    }
    
    if (!tx.messages || tx.messages.length === 0) {
      return false;
    }
    
    for (const msg of tx.messages) {
      if (!isValidTonAddress(msg.address)) {
        return false;
      }
      
      if (BigInt(msg.amount) < this.MIN_GAS_RESERVE) {
        return false;
      }
    }
    
    return true;
  }
}
```

#### User Confirmation UI

```tsx
// src/components/TransactionConfirmation.tsx
import React from 'react';
import { formatNano } from '@/utils/format';

interface TransactionConfirmationProps {
  transaction: Transaction;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TransactionConfirmation({
  transaction,
  onConfirm,
  onCancel
}: TransactionConfirmationProps) {
  const totalAmount = transaction.messages.reduce(
    (sum, msg) => sum + BigInt(msg.amount),
    0n
  );

  return (
    <div className="transaction-modal">
      <h2>⚠️ Confirm Transaction</h2>
      
      <div className="tx-details">
        <div className="detail-row">
          <span>Contract:</span>
          <code>{transaction.messages[0].address.slice(0, 10)}...</code>
        </div>
        
        <div className="detail-row">
          <span>Amount:</span>
          <strong>{formatNano(totalAmount)} TON</strong>
        </div>
        
        <div className="detail-row">
          <span>Valid Until:</span>
          <span>{new Date(transaction.validUntil * 1000).toLocaleString()}</span>
        </div>
        
        <div className="detail-row warning">
          <span>⚠️ This transaction cannot be reversed</span>
        </div>
      </div>

      <div className="actions">
        <button onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button onClick={onConfirm} className="btn-primary">
          Confirm & Sign
        </button>
      </div>
    </div>
  );
}
```

### 3. Session & Wallet Security

#### Secure Session Management

```typescript
// src/services/sessionManager.ts
import CryptoJS from 'crypto-js';

interface SecureSession {
  userId: string;
  walletAddress: string;
  telegramId: number;
  signature: string;
  expiresAt: number;
  nonce: string;
}

export class SessionManager {
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly ENCRYPTION_KEY = process.env.REACT_APP_SESSION_KEY!;

  // Create secure session
  static createSession(
    userId: string,
    walletAddress: string,
    telegramId: number,
    signature: string
  ): string {
    const nonce = this.generateNonce();
    const expiresAt = Date.now() + this.SESSION_DURATION;

    const session: SecureSession = {
      userId,
      walletAddress,
      telegramId,
      signature,
      expiresAt,
      nonce,
    };

    // Encrypt session data
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(session),
      this.ENCRYPTION_KEY
    ).toString();

    return encrypted;
  }

  // Validate session
  static validateSession(sessionToken: string): SecureSession | null {
    try {
      // Decrypt session
      const decrypted = CryptoJS.AES.decrypt(
        sessionToken,
        this.ENCRYPTION_KEY
      ).toString(CryptoJS.enc.Utf8);

      const session: SecureSession = JSON.parse(decrypted);

      // Check expiration
      if (session.expiresAt < Date.now()) {
        return null;
      }

      // Verify signature
      if (!this.verifySignature(session)) {
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  private static verifySignature(session: SecureSession): boolean {
    // Verify wallet signature
    const message = `WajoB Auth: ${session.userId}:${session.nonce}`;
    // In production, verify with TON SDK
    return true;  // Placeholder
  }

  private static generateNonce(): string {
    return CryptoJS.lib.WordArray.random(16).toString();
  }
}
```

#### Prevent Session Hijacking

```typescript
// src/middleware/sessionValidator.ts
import { NextFunction, Request, Response } from 'express';

export function validateSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'No session token' });
  }

  const session = SessionManager.validateSession(sessionToken);
  
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  // Verify Telegram WebApp data
  const telegramData = req.headers['x-telegram-webapp-data'] as string;
  if (!verifyTelegramWebAppData(telegramData, session.telegramId)) {
    return res.status(403).json({ error: 'Telegram verification failed' });
  }

  // Attach session to request
  req.session = session;
  next();
}

function verifyTelegramWebAppData(
  initData: string,
  expectedTelegramId: number
): boolean {
  // Verify Telegram WebApp init data signature
  // Implementation based on Telegram WebApp docs
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  const authDate = params.get('auth_date');
  const userId = params.get('user')?.match(/"id":(\d+)/)?.[1];
  
  // Verify user ID matches
  if (parseInt(userId || '0') !== expectedTelegramId) {
    return false;
  }
  
  // Verify timestamp (not older than 24 hours)
  const authTimestamp = parseInt(authDate || '0');
  if (Date.now() / 1000 - authTimestamp > 86400) {
    return false;
  }
  
  // Verify signature with bot token
  // Use HMAC-SHA256 as per Telegram docs
  return true;  // Simplified for example
}
```

---

## 🤖 Telegram Bot Security

### 1. Input Validation

#### Comprehensive Input Sanitization

```typescript
// backend/src/modules/telegram/validators.ts
import { IsString, IsNumber, Length, Min, Max, Matches } from 'class-validator';
import DOMPurify from 'isomorphic-dompurify';

export class JobInputValidator {
  @IsString()
  @Length(5, 100)
  @Matches(/^[a-zA-Z0-9\s\-.,!?]+$/, {
    message: 'Title contains invalid characters'
  })
  title: string;

  @IsString()
  @Length(10, 1000)
  description: string;

  @IsNumber()
  @Min(1)
  @Max(10000)
  wages: number;

  @IsNumber()
  @Min(1)
  @Max(24)
  duration: number;

  // Sanitize all string inputs
  static sanitize(input: Partial<JobInputValidator>): JobInputValidator {
    return {
      title: DOMPurify.sanitize(input.title || ''),
      description: DOMPurify.sanitize(input.description || ''),
      wages: Math.floor(Number(input.wages) || 0),
      duration: Math.floor(Number(input.duration) || 0),
    } as JobInputValidator;
  }
}

// Validation middleware
export async function validateJobInput(data: any): Promise<JobInputValidator> {
  const sanitized = JobInputValidator.sanitize(data);
  
  const validator = new JobInputValidator();
  Object.assign(validator, sanitized);
  
  const errors = await validate(validator);
  
  if (errors.length > 0) {
    throw new ValidationError('Invalid job data', errors);
  }
  
  return validator;
}
```

#### SQL Injection Prevention

```typescript
// Always use parameterized queries
export class JobRepository {
  async createJob(jobData: CreateJobDto) {
    // WRONG - SQL injection vulnerable
    // const query = `INSERT INTO jobs (title) VALUES ('${jobData.title}')`;
    
    // CORRECT - Parameterized query
    const query = `
      INSERT INTO jobs (title, description, wages, employer_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    return this.db.query(query, [
      jobData.title,
      jobData.description,
      jobData.wages,
      jobData.employerId
    ]);
  }
}
```

### 2. Data Encryption

#### Encrypt Sensitive Data

```typescript
// backend/src/utils/encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 64;
  private static readonly TAG_LENGTH = 16;

  // Encrypt sensitive data
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    
    const key = crypto.pbkdf2Sync(
      this.KEY,
      salt,
      100000,
      32,
      'sha512'
    );

    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();

    // Combine IV + Salt + Tag + Encrypted data
    return Buffer.concat([iv, salt, tag, encrypted]).toString('base64');
  }

  // Decrypt sensitive data
  static decrypt(encryptedData: string): string {
    const buffer = Buffer.from(encryptedData, 'base64');
    
    const iv = buffer.subarray(0, this.IV_LENGTH);
    const salt = buffer.subarray(this.IV_LENGTH, this.IV_LENGTH + this.SALT_LENGTH);
    const tag = buffer.subarray(
      this.IV_LENGTH + this.SALT_LENGTH,
      this.IV_LENGTH + this.SALT_LENGTH + this.TAG_LENGTH
    );
    const encrypted = buffer.subarray(this.IV_LENGTH + this.SALT_LENGTH + this.TAG_LENGTH);

    const key = crypto.pbkdf2Sync(
      this.KEY,
      salt,
      100000,
      32,
      'sha512'
    );

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final('utf8');
  }
}

// Usage in User entity
@Entity('users')
export class User {
  @Column({ type: 'text', nullable: true })
  private encryptedPhoneNumber?: string;

  get phoneNumber(): string | undefined {
    return this.encryptedPhoneNumber
      ? EncryptionService.decrypt(this.encryptedPhoneNumber)
      : undefined;
  }

  set phoneNumber(value: string | undefined) {
    this.encryptedPhoneNumber = value
      ? EncryptionService.encrypt(value)
      : undefined;
  }
}
```

#### Secure Environment Variables

```typescript
// backend/src/config/validation.schema.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Database
  DATABASE_URL: Joi.string().required(),
  
  // Encryption (must be 64 hex chars for 256-bit key)
  ENCRYPTION_KEY: Joi.string().length(64).hex().required(),
  
  // JWT (minimum 256-bit secret)
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  
  // Telegram Bot
  TELEGRAM_BOT_TOKEN: Joi.string().pattern(/^\d+:[A-Za-z0-9_-]+$/).required(),
  TELEGRAM_BOT_SECRET: Joi.string().min(32).required(),
  
  // TON
  TON_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required()
  }),
  
  // Redis
  REDIS_PASSWORD: Joi.string().min(16).required(),
  
  // Rate Limiting
  RATE_LIMIT_MAX: Joi.number().default(100),
  RATE_LIMIT_WINDOW: Joi.number().default(15 * 60 * 1000), // 15 minutes
});
```

### 3. Session Validation

#### Backend Session Verification

```typescript
// backend/src/modules/auth/session.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private userRepository: UserRepository,
    private sessionService: SessionService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Extract session token
    const sessionToken = this.extractToken(request);
    if (!sessionToken) {
      throw new UnauthorizedException('No session token');
    }

    // Validate session
    const session = await this.sessionService.validate(sessionToken);
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    // Verify user exists and is active
    const user = await this.userRepository.findOne({
      where: { id: session.userId, isActive: true }
    });
    
    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Verify Telegram WebApp data if present
    const telegramData = request.headers['x-telegram-webapp-data'];
    if (telegramData) {
      const isValid = this.verifyTelegramData(
        telegramData as string,
        user.telegramId
      );
      
      if (!isValid) {
        throw new ForbiddenException('Telegram verification failed');
      }
    }

    // Attach user to request
    request.user = user;
    request.session = session;

    return true;
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  private verifyTelegramData(initData: string, userId: number): boolean {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    
    // Sort parameters
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Create secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN!)
      .digest();
    
    // Calculate expected hash
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    return hash === expectedHash;
  }
}
```

---

## 🔒 Additional Security Measures

### Rate Limiting

```typescript
// backend/src/app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,  // 60 seconds
      limit: 10,  // 10 requests per minute
    }),
  ],
})
export class AppModule {}

// Custom rate limiting for sensitive endpoints
@Controller('jobs')
export class JobsController {
  @Post()
  @Throttle(5, 60)  // 5 jobs per minute
  async createJob(@Body() data: CreateJobDto) {
    // ...
  }
}
```

### CORS Configuration

```typescript
// backend/src/main.ts
app.enableCors({
  origin: [
    'https://wagob.com',
    'https://t.me',
    /^https:\/\/.*\.t\.me$/,  // Telegram domains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Telegram-WebApp-Data',
  ],
});
```

### Security Headers

```typescript
// backend/src/main.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://telegram.org'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.ton.org'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

---

## 📋 Security Checklist

### Pre-Deployment

- [ ] All smart contracts audited by professional firm
- [ ] Static analysis run on all contracts
- [ ] Gas estimation and optimization complete
- [ ] All dependencies updated to latest secure versions
- [ ] Environment variables stored securely (not in code)
- [ ] Encryption keys generated with crypto-secure randomness
- [ ] Database credentials rotated and secure
- [ ] API keys have minimal required permissions
- [ ] Rate limiting configured on all endpoints
- [ ] CORS restricted to known domains only
- [ ] All user inputs validated and sanitized
- [ ] SQL injection tests passed
- [ ] XSS protection verified
- [ ] CSRF tokens implemented where needed
- [ ] Session timeout configured appropriately
- [ ] Error messages don't leak sensitive information
- [ ] Logging configured (without sensitive data)
- [ ] Monitoring and alerting set up

### Post-Deployment

- [ ] Monitor smart contract transactions
- [ ] Set up alerts for unusual activity
- [ ] Regular security scans scheduled
- [ ] Backup and disaster recovery tested
- [ ] Incident response plan documented
- [ ] Security team contacts established
- [ ] Bug bounty program considered

---

## 🚨 Incident Response Plan

### Detection
1. Automated monitoring alerts
2. User reports
3. Security audit findings

### Response
1. Assess severity and scope
2. Isolate affected systems
3. Notify stakeholders
4. Implement emergency fixes
5. Monitor for continued threats

### Recovery
1. Deploy patches
2. Restore from backups if needed
3. Verify system integrity
4. Resume normal operations

### Post-Incident
1. Root cause analysis
2. Update security measures
3. Document lessons learned
4. Communicate with users

---

**Next Document: DEPLOYMENT.md with deployment best practices**
