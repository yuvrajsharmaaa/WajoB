# 🤝 Contributing to WajoB

Thank you for your interest in contributing to WajoB! This guide will help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

---

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of:
- Age, body size, disability, ethnicity
- Gender identity and expression
- Level of experience, nationality
- Personal appearance, race, religion
- Sexual identity and orientation

### Our Standards

**Positive behavior:**
- ✅ Using welcoming and inclusive language
- ✅ Being respectful of differing viewpoints
- ✅ Gracefully accepting constructive criticism
- ✅ Focusing on what is best for the community
- ✅ Showing empathy towards others

**Unacceptable behavior:**
- ❌ Harassment, trolling, or insulting comments
- ❌ Public or private harassment
- ❌ Publishing private information without permission
- ❌ Other conduct inappropriate in a professional setting

### Enforcement

Violations may result in temporary or permanent ban. Report violations to: conduct@wagob.io

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

**For code contributions:**
- Node.js 18+ installed
- Git installed and configured
- TON wallet for testnet testing
- Basic knowledge of TypeScript/React/FunC (depending on area)

**For documentation contributions:**
- Markdown knowledge
- Good written English
- Understanding of the topic you're documenting

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork:

git clone https://github.com/YOUR_USERNAME/WajoB.git
cd WajoB

# Add upstream remote
git remote add upstream https://github.com/yuvrajsharmaaa/WajoB.git

# Verify remotes
git remote -v
```

### Set Up Development Environment

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run start:dev
```

**Frontend:**
```bash
cd ../  # Root directory
npm install
cp .env.example .env.local
# Edit .env.local
npm start
```

**Smart Contracts:**
```bash
cd contract
npm install
npx blueprint build
npm test
```

**Full setup guide:** [Developer Getting Started](./getting-started.md)

---

## How to Contribute

### Types of Contributions

We welcome all types of contributions:

#### 🐛 Bug Reports

**Before submitting:**
1. Search existing issues
2. Check if it's already fixed in main branch
3. Gather reproduction steps

**Issue template:**
```markdown
**Describe the bug**
Clear and concise description.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen.

**Screenshots**
If applicable.

**Environment:**
- Device: [e.g. iPhone 13]
- Telegram version: [e.g. 10.3.1]
- Wallet: [e.g. Tonkeeper 3.2.0]

**Additional context**
Any other relevant information.
```

#### 💡 Feature Requests

**Before submitting:**
1. Check discussions for similar ideas
2. Consider if it aligns with project goals
3. Think about implementation complexity

**Use GitHub Discussions** for feature ideas, not issues.

#### 📝 Documentation

**Areas that need help:**
- User guides and tutorials
- API documentation
- Code comments
- README improvements
- Translation to other languages

#### 🔧 Code Contributions

**Good first issues:**
- Look for `good-first-issue` label
- Small bug fixes
- UI/UX improvements
- Test coverage
- Performance optimizations

**Areas to contribute:**
- Frontend (React components)
- Backend (NestJS API)
- Smart contracts (FunC)
- Testing (Jest, integration tests)
- DevOps (Docker, CI/CD)

---

## Development Workflow

### Branching Strategy

We use **Git Flow**:

```
main            → Production-ready code
  ↓
develop         → Integration branch for features
  ↓
feature/*       → New features
bugfix/*        → Bug fixes
hotfix/*        → Urgent production fixes
release/*       → Release preparation
```

### Creating a Branch

```bash
# Update your fork
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name

# Or bug fix branch
git checkout -b bugfix/issue-number-description
```

### Making Changes

**Commit message format:**
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(jobs): add filter by location"
git commit -m "fix(escrow): resolve payment release bug #123"
git commit -m "docs(api): update authentication section"
git commit -m "test(reputation): add rating calculation tests"
```

### Keeping Your Branch Updated

```bash
# Fetch latest changes
git fetch upstream

# Rebase onto develop
git rebase upstream/develop

# If conflicts, resolve them, then:
git rebase --continue

# Force push to your fork
git push -f origin feature/your-feature-name
```

---

## Coding Standards

### TypeScript/JavaScript

**Style guide:** We follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

**Key points:**
- Use TypeScript for new backend code
- Use functional components in React
- Prefer `const` over `let`, never `var`
- Use async/await over promises
- Add JSDoc comments for functions
- Keep functions small and focused

**Example:**
```typescript
/**
 * Calculates reputation score for a user
 * @param userId - The user's database ID
 * @param ratings - Array of ratings received
 * @returns Calculated reputation score (0-5)
 */
async function calculateReputationScore(
  userId: string,
  ratings: Rating[],
): Promise<number> {
  if (ratings.length === 0) return 0;
  
  const weightedSum = ratings.reduce((sum, rating, index) => {
    const weight = Math.pow(0.95, ratings.length - index - 1);
    return sum + rating.score * weight;
  }, 0);
  
  const totalWeight = ratings.reduce((sum, _, index) => {
    return sum + Math.pow(0.95, ratings.length - index - 1);
  }, 0);
  
  return weightedSum / totalWeight;
}
```

### FunC (Smart Contracts)

**Guidelines:**
- Follow [TON FunC Style Guide](https://docs.ton.org/develop/func/cookbook)
- Add comments for complex logic
- Use descriptive constant names
- Optimize for gas efficiency
- Include gas profiling in tests

**Example:**
```func
;; Constants
const int error::unauthorized = 401;
const int error::insufficient_funds = 402;
const int min_escrow_amount = 1000000000; ;; 1 TON

;; Create escrow with validation
() create_escrow(slice sender, int amount, int job_id, int deadline) impure {
    ;; Early validation (saves gas if fails)
    throw_unless(error::insufficient_funds, amount >= min_escrow_amount);
    throw_unless(error::invalid_deadline, deadline > now());
    
    ;; Load storage
    load_storage();
    
    ;; Create escrow record
    int escrow_id = storage::escrow_count + 1;
    cell escrow = pack_escrow(sender, amount, job_id, deadline);
    
    ;; Update storage
    storage::escrows~udict_set(64, escrow_id, escrow.begin_parse());
    storage::escrow_count = escrow_id;
    
    ;; Save and emit event
    save_storage();
    emit_escrow_created(escrow_id, sender, amount);
}
```

### React Components

**Guidelines:**
- One component per file
- Use functional components with hooks
- Memoize expensive calculations
- Add PropTypes or TypeScript interfaces
- Keep components focused and reusable

**Example:**
```javascript
import React, { memo, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * JobCard component displays a single job listing
 */
const JobCard = memo(({ job, onApply, currentUserId }) => {
  // Memoize calculations
  const isOwnJob = useMemo(() => {
    return job.employerId === currentUserId;
  }, [job.employerId, currentUserId]);
  
  const formattedWages = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(job.wages);
  }, [job.wages]);
  
  // Memoize callbacks
  const handleApply = useCallback(() => {
    onApply(job.id);
  }, [job.id, onApply]);
  
  return (
    <div className="job-card">
      <h3>{job.title}</h3>
      <p>{job.description}</p>
      <div className="job-wages">{formattedWages} TON</div>
      {!isOwnJob && (
        <button onClick={handleApply}>Apply Now</button>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.job.id === nextProps.job.id &&
    prevProps.job.status === nextProps.job.status
  );
});

JobCard.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    wages: PropTypes.number.isRequired,
    employerId: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
  onApply: PropTypes.func.isRequired,
  currentUserId: PropTypes.string,
};

export default JobCard;
```

---

## Testing Guidelines

### Backend Tests

**Unit tests:**
```typescript
// jobs.service.spec.ts
describe('JobsService', () => {
  let service: JobsService;
  let repository: Repository<Job>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getRepositoryToken(Job),
          useClass: Repository,
        },
      ],
    }).compile();
    
    service = module.get<JobsService>(JobsService);
    repository = module.get<Repository<Job>>(getRepositoryToken(Job));
  });
  
  describe('create', () => {
    it('should create a new job', async () => {
      const createDto = {
        title: 'Test Job',
        description: 'Test description',
        wages: 10,
      };
      
      const result = await service.create(createDto, 'user123');
      
      expect(result).toBeDefined();
      expect(result.title).toBe(createDto.title);
      expect(result.status).toBe('draft');
    });
    
    it('should throw error for invalid wages', async () => {
      const createDto = {
        title: 'Test Job',
        description: 'Test description',
        wages: -5,
      };
      
      await expect(
        service.create(createDto, 'user123')
      ).rejects.toThrow('Wages must be positive');
    });
  });
});
```

**Integration tests:**
```typescript
// jobs.integration.spec.ts
describe('Jobs API (e2e)', () => {
  let app: INestApplication;
  let token: string;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Get auth token
    const authResponse = await request(app.getHttpServer())
      .post('/auth/telegram')
      .send({ initData: 'test_data' });
    token = authResponse.body.token;
  });
  
  it('/jobs (POST)', () => {
    return request(app.getHttpServer())
      .post('/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Job',
        description: 'Test description with enough characters',
        category: 'delivery',
        wages: 10,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.status).toBe('draft');
      });
  });
  
  afterAll(async () => {
    await app.close();
  });
});
```

### Smart Contract Tests

```typescript
// Escrow.spec.ts
import { Blockchain, SandboxContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { Escrow } from '../wrappers/Escrow';

describe('Escrow', () => {
  let blockchain: Blockchain;
  let escrow: SandboxContract<Escrow>;
  let employer: SandboxContract<TreasuryContract>;
  let worker: SandboxContract<TreasuryContract>;
  
  beforeEach(async () => {
    blockchain = await Blockchain.create();
    employer = await blockchain.treasury('employer');
    worker = await blockchain.treasury('worker');
    
    escrow = blockchain.openContract(await Escrow.fromInit());
    await escrow.send(
      employer.getSender(),
      { value: toNano('0.05') },
      { $$type: 'Deploy' }
    );
  });
  
  it('should create escrow', async () => {
    const result = await escrow.send(
      employer.getSender(),
      { value: toNano('10') },
      {
        $$type: 'CreateEscrow',
        jobId: 1n,
        workerId: worker.address,
        amount: toNano('10'),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 86400),
      }
    );
    
    expect(result.transactions).toHaveTransaction({
      from: employer.address,
      to: escrow.address,
      success: true,
    });
    
    const escrowData = await escrow.getEscrowDetails(1n);
    expect(escrowData.amount).toEqual(toNano('10'));
    expect(escrowData.status).toBe('funded');
  });
  
  it('should release payment', async () => {
    // Setup: Create and fund escrow
    await escrow.send(
      employer.getSender(),
      { value: toNano('10') },
      { $$type: 'CreateEscrow', ... }
    );
    
    // Test: Release payment
    const workerBalanceBefore = await worker.getBalance();
    
    await escrow.send(
      employer.getSender(),
      { value: toNano('0.01') },
      { $$type: 'ReleasePayment', escrowId: 1n }
    );
    
    const workerBalanceAfter = await worker.getBalance();
    const received = workerBalanceAfter - workerBalanceBefore;
    
    // Worker should receive 97.5% (2.5% platform fee)
    expect(received).toBeGreaterThan(toNano('9.7'));
    expect(received).toBeLessThan(toNano('9.8'));
  });
});
```

### Frontend Tests

```javascript
// JobCard.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import JobCard from './JobCard';

describe('JobCard', () => {
  const mockJob = {
    id: '1',
    title: 'Test Job',
    description: 'Test description',
    wages: 10.5,
    employerId: 'employer1',
    status: 'open',
  };
  
  const mockOnApply = jest.fn();
  
  it('renders job details', () => {
    render(
      <JobCard 
        job={mockJob} 
        onApply={mockOnApply}
        currentUserId="worker1"
      />
    );
    
    expect(screen.getByText('Test Job')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('10.50 TON')).toBeInTheDocument();
  });
  
  it('calls onApply when button clicked', () => {
    render(
      <JobCard 
        job={mockJob} 
        onApply={mockOnApply}
        currentUserId="worker1"
      />
    );
    
    const applyButton = screen.getByText('Apply Now');
    fireEvent.click(applyButton);
    
    expect(mockOnApply).toHaveBeenCalledWith('1');
  });
  
  it('hides apply button for own job', () => {
    render(
      <JobCard 
        job={mockJob} 
        onApply={mockOnApply}
        currentUserId="employer1"
      />
    );
    
    expect(screen.queryByText('Apply Now')).not.toBeInTheDocument();
  });
});
```

### Test Coverage

**Minimum requirements:**
- Backend: 80% coverage
- Frontend: 70% coverage
- Smart contracts: 90% coverage

**Run coverage:**
```bash
# Backend
cd backend
npm run test:cov

# Frontend
cd ../
npm run test:coverage

# Smart contracts
cd contract
npm run test:coverage
```

---

## Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up-to-date with develop
- [ ] No merge conflicts
- [ ] All CI checks passing

### Creating Pull Request

1. **Push to your fork:**
```bash
git push origin feature/your-feature-name
```

2. **Open PR on GitHub:**
- Base branch: `develop` (not `main`!)
- Compare branch: `your-fork:feature/your-feature-name`

3. **Fill out PR template:**
```markdown
## Description
Brief description of changes.

## Related Issue
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally
- [ ] Dependent changes merged
```

### Review Process

1. **Automated checks:**
   - CI/CD pipeline runs tests
   - Code quality scans (SonarCloud)
   - Security scans (Snyk)

2. **Code review:**
   - At least 1 approval required
   - Maintainers review within 2-3 days
   - Address feedback promptly

3. **Merge:**
   - Squash and merge (clean history)
   - Delete branch after merge

### After Merge

- Your feature goes to `develop` branch
- Included in next release
- Added to changelog
- You get contributor badge!

---

## Community

### Communication Channels

- **GitHub Discussions**: Technical discussions, ideas
- **Telegram**: [@WajoBDevs](https://t.me/WajoBDevs) - Developer chat
- **Discord**: [discord.gg/wagob-dev](https://discord.gg/wagob-dev) - Real-time chat
- **Twitter**: [@WajoB_Dev](https://twitter.com/WajoB_Dev) - Development updates

### Regular Events

- **Community Calls**: First Monday of month, 10 AM UTC
- **Code Reviews**: Wednesday, 2 PM UTC (open to all)
- **Hackathons**: Quarterly

### Recognition

**Contributors get:**
- ✨ Contributor badge in app
- 🏆 Featured in release notes
- 💰 Bounties for major features
- 🎓 Learning opportunities
- 🤝 Networking with TON ecosystem

**Top contributors:**
- Core team invitation
- Decision-making participation
- Speaking opportunities at events

---

## Questions?

- 💬 **Chat**: [@WajoBDevs](https://t.me/WajoBDevs)
- 📧 **Email**: dev@wagob.io
- 📚 **Docs**: [Full Developer Guide](./README.md)

---

**Thank you for contributing to WajoB!** 🙏

Every contribution, no matter how small, makes a difference.

---

*Last updated: November 23, 2025 • [Improve contributing guide](https://github.com/yuvrajsharmaaa/WajoB/issues)*
