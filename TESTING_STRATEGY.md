# 🧪 WajoB Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the WajoB Telegram Mini App with TON blockchain integration, covering unit tests, integration tests, end-to-end tests, and continuous testing practices.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Smart Contract Testing](#smart-contract-testing)
3. [Backend Testing](#backend-testing)
4. [Frontend Testing](#frontend-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Test Automation](#test-automation)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)
9. [Testing Best Practices](#testing-best-practices)

---

## Testing Philosophy

### Goals

- **Reliability**: Ensure all critical paths work correctly
- **Security**: Prevent vulnerabilities and exploits
- **Performance**: Maintain acceptable response times and gas costs
- **User Experience**: Validate smooth user workflows
- **Maintainability**: Keep tests readable and maintainable

### Coverage Targets

- **Smart Contracts**: 100% function coverage, 95%+ branch coverage
- **Backend Services**: 90%+ line coverage
- **Frontend Components**: 80%+ line coverage
- **E2E Critical Paths**: 100% coverage of main user journeys

---

## Smart Contract Testing

### Unit Tests

Test individual contract functions in isolation using TON Sandbox.

#### JobRegistry Contract Tests

```typescript
// contract/tests/JobRegistry.spec.ts
import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, beginCell } from '@ton/core';
import { DeployJobRegistry } from '../wrappers/DeployJobRegistry';

describe('JobRegistry Unit Tests', () => {
    let blockchain: Blockchain;
    let jobRegistry: SandboxContract<DeployJobRegistry>;
    let employer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        employer = await blockchain.treasury('employer');
        
        jobRegistry = blockchain.openContract(
            DeployJobRegistry.createFromConfig(
                { owner: deployer.address },
                code
            )
        );
    });

    describe('Job Creation', () => {
        it('should create job with valid parameters', async () => {
            const metadata = beginCell()
                .storeUint(1, 64) // jobId
                .storeUint(8, 32) // duration
                .storeStringTail('Development')
                .endCell();

            const result = await jobRegistry.sendCreateJob(
                employer.getSender(),
                {
                    wages: toNano('100'),
                    metadata,
                    value: toNano('0.1'),
                }
            );

            expect(result.transactions).toHaveTransaction({
                from: employer.address,
                to: jobRegistry.address,
                success: true,
            });

            const jobCount = await jobRegistry.getJobCount();
            expect(jobCount).toBe(1n);
        });

        it('should reject invalid wages', async () => {
            const metadata = beginCell().storeUint(1, 64).endCell();

            const result = await jobRegistry.sendCreateJob(
                employer.getSender(),
                {
                    wages: toNano('0'), // Invalid
                    metadata,
                    value: toNano('0.1'),
                }
            );

            expect(result.transactions).toHaveTransaction({
                success: false,
                exitCode: 401, // Invalid wages
            });
        });

        it('should prevent duplicate job IDs', async () => {
            // Create first job
            const metadata1 = beginCell().storeUint(1, 64).endCell();
            await jobRegistry.sendCreateJob(employer.getSender(), {
                wages: toNano('100'),
                metadata: metadata1,
                value: toNano('0.1'),
            });

            // Try duplicate
            const metadata2 = beginCell().storeUint(1, 64).endCell();
            const result = await jobRegistry.sendCreateJob(
                employer.getSender(),
                {
                    wages: toNano('200'),
                    metadata: metadata2,
                    value: toNano('0.1'),
                }
            );

            expect(result.transactions).toHaveTransaction({
                success: false,
                exitCode: 400, // Job exists
            });
        });
    });

    describe('Gas Optimization', () => {
        it('should create job within gas budget', async () => {
            const metadata = beginCell().storeUint(1, 64).endCell();
            
            const result = await jobRegistry.sendCreateJob(
                employer.getSender(),
                {
                    wages: toNano('100'),
                    metadata,
                    value: toNano('1'), // Generous gas
                }
            );

            const gasUsed = result.transactions[1].totalFees.coins;
            console.log(`Gas used: ${gasUsed}`);
            
            expect(gasUsed).toBeLessThan(toNano('0.1')); // < 0.1 TON
        });

        it('should handle out-of-gas gracefully', async () => {
            const metadata = beginCell().storeUint(1, 64).endCell();
            
            const result = await jobRegistry.sendCreateJob(
                employer.getSender(),
                {
                    wages: toNano('100'),
                    metadata,
                    value: toNano('0.001'), // Too low
                }
            );

            expect(result.transactions).toHaveTransaction({
                success: false,
                exitCode: 13, // Out of gas
            });

            // Verify no state change
            const jobCount = await jobRegistry.getJobCount();
            expect(jobCount).toBe(0n);
        });
    });

    describe('Reentrancy Protection', () => {
        it('should prevent reentrancy attacks', async () => {
            // Deploy malicious contract attempting reentrancy
            const attacker = await blockchain.deployContract(MaliciousContract);

            const result = await jobRegistry.sendSomeOperation(
                attacker.getSender(),
                { value: toNano('1') }
            );

            expect(result.transactions).toHaveTransaction({
                success: false,
                exitCode: 401, // Reentrancy detected
            });
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle concurrent job creations', async () => {
            const employer2 = await blockchain.treasury('employer2');
            
            const [result1, result2] = await Promise.all([
                jobRegistry.sendCreateJob(employer.getSender(), {
                    wages: toNano('100'),
                    metadata: beginCell().storeUint(1, 64).endCell(),
                    value: toNano('0.1'),
                }),
                jobRegistry.sendCreateJob(employer2.getSender(), {
                    wages: toNano('200'),
                    metadata: beginCell().storeUint(2, 64).endCell(),
                    value: toNano('0.1'),
                }),
            ]);

            // Both should succeed
            expect(result1.transactions).toHaveTransaction({ success: true });
            expect(result2.transactions).toHaveTransaction({ success: true });

            const jobCount = await jobRegistry.getJobCount();
            expect(jobCount).toBe(2n);
        });
    });
});
```

### Integration Tests

Test interactions between multiple contracts.

```typescript
// contract/tests/ContractIntegration.spec.ts
describe('Contract Integration Tests', () => {
    let jobRegistry: SandboxContract<DeployJobRegistry>;
    let escrow: SandboxContract<DeployEscrow>;
    let reputation: SandboxContract<DeployReputation>;

    it('should coordinate job creation with escrow', async () => {
        // Create job
        await jobRegistry.sendCreateJob(employer.getSender(), {
            wages: toNano('100'),
            metadata: jobMetadata,
            value: toNano('0.1'),
        });

        // Create corresponding escrow
        await escrow.sendCreateEscrow(employer.getSender(), {
            jobId: 1n,
            employer: employer.address,
            worker: worker.address,
            amount: toNano('100'),
            value: toNano('0.1'),
        });

        // Verify both updated
        const job = await jobRegistry.getJob(1n);
        const escrowData = await escrow.getEscrow(1n);

        expect(job.wages).toBe(toNano('100'));
        expect(escrowData.amount).toBe(toNano('100'));
    });

    it('should link reputation to completed jobs', async () => {
        // Create, assign, and complete job
        await jobRegistry.sendCreateJob(/* ... */);
        await jobRegistry.sendAssignWorker(/* ... */);
        await jobRegistry.sendUpdateStatus(/* complete */);

        // Submit reputation
        await reputation.sendSubmitRating(employer.getSender(), {
            jobId: 1n,
            targetUser: worker.address,
            rating: 5,
            value: toNano('0.05'),
        });

        // Verify linkage
        const job = await jobRegistry.getJob(1n);
        const workerRep = await reputation.getReputation(worker.address);

        expect(job.status).toBe(3); // COMPLETED
        expect(workerRep.avgRating).toBeGreaterThan(0);
    });
});
```

### Edge Case Testing

```typescript
describe('Edge Cases', () => {
    it('should handle integer overflow safely', async () => {
        const maxWages = (2n ** 120n) - 1n; // Near max
        
        const result = await jobRegistry.sendCreateJob({
            wages: maxWages,
            metadata,
            value: toNano('0.1'),
        });

        expect(result.transactions).toHaveTransaction({ success: true });
    });

    it('should handle partial execution recovery', async () => {
        // Create job
        await jobRegistry.sendCreateJob(/* ... */);

        const jobBefore = await jobRegistry.getJob(1n);

        // Try operation with insufficient gas
        await jobRegistry.sendUpdateStatus({
            jobId: 1n,
            status: 3,
            value: toNano('0.001'), // Too low
        }).catch(() => {});

        // State should be unchanged
        const jobAfter = await jobRegistry.getJob(1n);
        expect(jobAfter.status).toBe(jobBefore.status);
    });

    it('should handle network latency', async () => {
        // Create job
        await jobRegistry.sendCreateJob(/* ... */);

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Subsequent operation should work
        const result = await jobRegistry.sendAssignWorker(/* ... */);
        expect(result.transactions).toHaveTransaction({ success: true });
    });
});
```

### Running Contract Tests

```bash
# Run all tests
cd contract
npm run test

# Run specific test file
npm run test -- JobRegistry.spec.ts

# Run with coverage
npm run test:coverage

# Run integration tests only
npm run test -- --testPathPattern=integration

# Watch mode for development
npm run test:watch
```

---

## Backend Testing

### Unit Tests

Test services and utilities in isolation.

```typescript
// backend/src/modules/jobs/jobs.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Job } from '../entities/job.entity';

describe('JobsService', () => {
    let service: JobsService;
    let mockRepository;
    let mockRedis;

    beforeEach(async () => {
        mockRepository = {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };

        mockRedis = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JobsService,
                {
                    provide: getRepositoryToken(Job),
                    useValue: mockRepository,
                },
                {
                    provide: 'REDIS_CLIENT',
                    useValue: mockRedis,
                },
            ],
        }).compile();

        service = module.get<JobsService>(JobsService);
    });

    describe('findAll', () => {
        it('should return cached jobs if available', async () => {
            const cachedJobs = [{ id: 1, title: 'Cached Job' }];
            mockRedis.get.mockResolvedValue(JSON.stringify(cachedJobs));

            const result = await service.findAll();

            expect(result).toEqual(cachedJobs);
            expect(mockRedis.get).toHaveBeenCalledWith('jobs:all::');
            expect(mockRepository.find).not.toHaveBeenCalled();
        });

        it('should fetch from DB and cache if not cached', async () => {
            const jobs = [{ id: 1, title: 'New Job' }];
            mockRedis.get.mockResolvedValue(null);
            mockRepository.find.mockResolvedValue(jobs);

            const result = await service.findAll();

            expect(result).toEqual(jobs);
            expect(mockRepository.find).toHaveBeenCalled();
            expect(mockRedis.set).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        it('should create job and invalidate cache', async () => {
            const jobData = { title: 'Test', wages: '100' };
            const savedJob = { id: 1, ...jobData };
            
            mockRepository.save.mockResolvedValue(savedJob);

            const result = await service.create(jobData);

            expect(result).toEqual(savedJob);
            expect(mockRepository.save).toHaveBeenCalledWith(jobData);
            expect(mockRedis.del).toHaveBeenCalled(); // Cache invalidated
        });
    });
});
```

### Integration Tests

Test full request/response cycles with database.

```typescript
// backend/test/jobs.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Jobs API (e2e)', () => {
    let app: INestApplication;
    let authToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get auth token
        const authResponse = await request(app.getHttpServer())
            .post('/api/v1/auth/telegram')
            .send({ initData: 'mock_telegram_data' });
        
        authToken = authResponse.body.access_token;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/api/v1/jobs (POST)', () => {
        it('should create a new job', async () => {
            const jobData = {
                title: 'Software Development',
                description: 'Build a Telegram Mini App',
                category: 'Development',
                wages: '100',
                duration: 8,
            };

            const response = await request(app.getHttpServer())
                .post('/api/v1/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send(jobData)
                .expect(201);

            expect(response.body).toMatchObject({
                id: expect.any(Number),
                title: jobData.title,
                status: 'open',
            });
        });

        it('should reject invalid job data', async () => {
            const invalidData = {
                title: '', // Empty title
                wages: -100, // Negative wages
            };

            await request(app.getHttpServer())
                .post('/api/v1/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);
        });

        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/jobs')
                .send({ title: 'Test' })
                .expect(401);
        });
    });

    describe('/api/v1/jobs (GET)', () => {
        it('should return list of jobs', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/jobs')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should filter by status', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/jobs?status=open')
                .expect(200);

            response.body.forEach(job => {
                expect(job.status).toBe('open');
            });
        });

        it('should filter by category', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/jobs?category=Development')
                .expect(200);

            response.body.forEach(job => {
                expect(job.category).toBe('Development');
            });
        });
    });
});
```

### Running Backend Tests

```bash
# Unit tests
cd backend
npm run test

# E2E tests
npm run test:e2e

# With coverage
npm run test:cov

# Watch mode
npm run test:watch

# Specific test file
npm run test -- jobs.service.spec.ts
```

---

## Frontend Testing

### Component Tests

```typescript
// src/components/__tests__/JobCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { JobCard } from '../JobCard';

describe('JobCard Component', () => {
    const mockJob = {
        id: 1,
        title: 'Software Development',
        description: 'Build an app',
        wages: '100 TON',
        category: 'Development',
        status: 'open',
    };

    it('should render job details correctly', () => {
        render(<JobCard job={mockJob} />);

        expect(screen.getByText('Software Development')).toBeInTheDocument();
        expect(screen.getByText('100 TON')).toBeInTheDocument();
        expect(screen.getByText('Development')).toBeInTheDocument();
    });

    it('should call onApply when apply button clicked', () => {
        const onApply = jest.fn();
        render(<JobCard job={mockJob} onApply={onApply} />);

        const applyButton = screen.getByText('Apply');
        fireEvent.click(applyButton);

        expect(onApply).toHaveBeenCalledWith(mockJob.id);
    });

    it('should show application pending state', () => {
        render(<JobCard job={{ ...mockJob, applicationPending: true }} />);

        expect(screen.getByText('Applying...')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeDisabled();
    });
});
```

### Hook Tests

```typescript
// src/hooks/__tests__/useJobRegistry.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useJobRegistry } from '../useJobRegistry';

jest.mock('@tonconnect/ui-react', () => ({
    useTonConnectUI: () => [mockTonConnectUI],
}));

describe('useJobRegistry Hook', () => {
    it('should create job successfully', async () => {
        const { result } = renderHook(() => useJobRegistry());

        await act(async () => {
            const tx = await result.current.createJob({
                wages: '100',
                duration: 8,
                metadata: {},
            });

            expect(tx).toBeDefined();
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should handle transaction errors', async () => {
        const { result } = renderHook(() => useJobRegistry());

        mockTonConnectUI.sendTransaction.mockRejectedValue(
            new Error('User rejected transaction')
        );

        await act(async () => {
            try {
                await result.current.createJob({});
            } catch (error) {
                expect(error.message).toContain('rejected');
            }
        });

        expect(result.current.error).toBeTruthy();
    });
});
```

### Running Frontend Tests

```bash
# Run all tests
npm run test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Update snapshots
npm run test -- -u
```

---

## End-to-End Testing

Using Playwright for complete user journey testing.

### Setup

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### Configuration

```javascript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
    ],
    webServer: {
        command: 'npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
    },
});
```

### E2E Test Example

See `tests/e2e/wagob.spec.ts` for comprehensive E2E tests covering:

- Wallet connection flow
- Job posting workflow
- Job acceptance and escrow funding
- Job completion and payment release
- Reputation submission
- Error scenarios and edge cases
- Network resilience
- Performance metrics

### Running E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test wagob.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Show report
npx playwright show-report
```

---

## Test Automation

### CI/CD Integration

See `.github/workflows/test.yml`:

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: cd contract && npm ci
      
      - name: Run contract tests
        run: cd contract && npm run test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Run unit tests
        run: cd backend && npm run test
      
      - name: Run E2E tests
        run: cd backend && npm run test:e2e

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm run test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Performance Testing

### Load Testing

```javascript
// tests/load/job-creation.test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '2m', target: 100 }, // Ramp up
        { duration: '5m', target: 100 }, // Stay at 100
        { duration: '2m', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% under 500ms
        http_req_failed: ['rate<0.01'],   // < 1% errors
    },
};

export default function () {
    const payload = JSON.stringify({
        title: 'Load Test Job',
        wages: '100',
        duration: 8,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`,
        },
    };

    const res = http.post('http://localhost:3001/api/v1/jobs', payload, params);

    check(res, {
        'status is 201': (r) => r.status === 201,
        'response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);
}
```

### Running Load Tests

```bash
# Install k6
brew install k6  # macOS
# or
sudo apt install k6  # Ubuntu

# Run load test
k6 run tests/load/job-creation.test.js

# With environment variables
k6 run --env AUTH_TOKEN=xxx tests/load/job-creation.test.js
```

---

## Security Testing

### Automated Security Scanning

```bash
# npm audit
npm audit

# Fix vulnerabilities
npm audit fix

# Snyk scanning
npx snyk test

# OWASP Dependency Check
dependency-check --scan ./

# Smart contract analysis
slither contract/contracts/
```

### Manual Security Testing

See `SECURITY.md` for comprehensive security testing procedures.

---

## Testing Best Practices

### 1. Test Organization

- Group related tests in `describe` blocks
- Use clear, descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

### 2. Test Data

- Use factories/fixtures for test data
- Don't rely on external services
- Clean up after each test

### 3. Mocking

- Mock external dependencies
- Use spies to verify behavior
- Keep mocks simple and focused

### 4. Assertions

- One logical assertion per test
- Use specific matchers
- Include helpful error messages

### 5. Coverage

- Aim for high coverage but don't obsess
- Focus on critical paths
- Write tests for bugs before fixing

### 6. Performance

- Keep tests fast
- Run slow tests separately
- Parallelize when possible

### 7. Maintenance

- Update tests with code changes
- Refactor tests regularly
- Remove obsolete tests

---

**Next: See `MONITORING.md` for comprehensive monitoring and logging strategies**
