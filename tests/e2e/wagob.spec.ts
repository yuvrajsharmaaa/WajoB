import { test, expect, Page } from '@playwright/test';
import { TonConnectUI } from '@tonconnect/ui-react';

/**
 * End-to-End Tests for WajoB Telegram Mini App
 * 
 * Tests cover complete user workflows:
 * - Wallet connection and authentication
 * - Job posting and acceptance
 * - Escrow creation and funding
 * - Job completion and payment release
 * - Reputation submission and display
 */

test.describe('WajoB E2E User Workflows', () => {
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        const context = await browser.newContext({
            // Simulate Telegram WebApp environment
            userAgent: 'Mozilla/5.0 (Linux; Android 10) Telegram-Android/7.8.1',
        });
        
        page = await context.newPage();
        
        // Mock Telegram WebApp API
        await page.addInitScript(() => {
            (window as any).Telegram = {
                WebApp: {
                    initData: 'mock_init_data',
                    initDataUnsafe: {
                        user: {
                            id: 123456789,
                            first_name: 'Test',
                            last_name: 'User',
                            username: 'testuser',
                        },
                    },
                    ready: () => {},
                    expand: () => {},
                    MainButton: {
                        setText: () => {},
                        show: () => {},
                        hide: () => {},
                        onClick: () => {},
                    },
                },
            };
        });
    });

    test.describe('Wallet Connection Flow', () => {
        test('should connect TON wallet successfully', async () => {
            await page.goto('http://localhost:3000');

            // Click connect wallet button
            await page.click('[data-testid="connect-wallet-btn"]');

            // Wait for TON Connect modal
            await page.waitForSelector('.ton-connect-modal', { timeout: 5000 });

            // Mock wallet selection
            await page.click('[data-testid="tonkeeper-option"]');

            // Wait for QR code or deep link
            const qrCode = await page.waitForSelector('[data-testid="wallet-qr-code"]');
            expect(qrCode).toBeTruthy();

            // Simulate successful connection
            await page.evaluate(() => {
                const event = new CustomEvent('ton-connect-ui-connection-completed', {
                    detail: {
                        address: 'EQTest...MockAddress',
                        publicKey: 'mock_public_key',
                    },
                });
                window.dispatchEvent(event);
            });

            // Verify wallet connected
            await page.waitForSelector('[data-testid="wallet-address"]');
            const walletAddress = await page.textContent('[data-testid="wallet-address"]');
            expect(walletAddress).toContain('EQ');
        });

        test('should handle wallet connection timeout', async () => {
            await page.goto('http://localhost:3000');

            await page.click('[data-testid="connect-wallet-btn"]');

            // Wait for timeout
            await page.waitForTimeout(60000); // 1 minute

            // Should show timeout error
            const errorMessage = await page.textContent('[data-testid="connection-error"]');
            expect(errorMessage).toContain('timeout');
        });

        test('should handle wallet connection rejection', async () => {
            await page.goto('http://localhost:3000');

            await page.click('[data-testid="connect-wallet-btn"]');

            // Simulate rejection
            await page.evaluate(() => {
                const event = new CustomEvent('ton-connect-ui-connection-error', {
                    detail: { message: 'User rejected connection' },
                });
                window.dispatchEvent(event);
            });

            const errorMessage = await page.textContent('[data-testid="connection-error"]');
            expect(errorMessage).toContain('rejected');
        });

        test('should persist wallet connection across page refreshes', async () => {
            await page.goto('http://localhost:3000');

            // Connect wallet
            await page.click('[data-testid="connect-wallet-btn"]');
            
            await page.evaluate(() => {
                localStorage.setItem('ton-connect-storage_bridge-connection', JSON.stringify({
                    type: 'injected',
                    address: 'EQTest...MockAddress',
                }));
            });

            // Refresh page
            await page.reload();

            // Wallet should auto-reconnect
            await page.waitForSelector('[data-testid="wallet-address"]', { timeout: 5000 });
            const walletAddress = await page.textContent('[data-testid="wallet-address"]');
            expect(walletAddress).toBeTruthy();
        });
    });

    test.describe('Job Posting Flow', () => {
        test.beforeEach(async () => {
            // Mock wallet connection
            await page.goto('http://localhost:3000');
            await page.evaluate(() => {
                localStorage.setItem('ton-connect-storage_bridge-connection', JSON.stringify({
                    type: 'injected',
                    address: 'EQEmployer...MockAddress',
                }));
            });
            await page.reload();
        });

        test('should create a new job posting', async () => {
            // Navigate to post job page
            await page.click('[data-testid="post-job-btn"]');

            // Fill job form
            await page.fill('[name="title"]', 'Software Development Task');
            await page.fill('[name="description"]', 'Build a Telegram Mini App');
            await page.fill('[name="category"]', 'Development');
            await page.fill('[name="wages"]', '100');
            await page.fill('[name="duration"]', '8');

            // Submit form
            await page.click('[data-testid="submit-job-btn"]');

            // Wait for TON transaction approval
            await page.waitForSelector('[data-testid="tx-approval-modal"]');

            // Approve transaction
            await page.click('[data-testid="approve-tx-btn"]');

            // Wait for transaction confirmation
            await page.waitForSelector('[data-testid="tx-success"]', { timeout: 30000 });

            // Verify job created
            await page.goto('http://localhost:3000/jobs');
            const jobCard = await page.waitForSelector('[data-testid^="job-card-"]');
            const jobTitle = await jobCard.textContent();
            expect(jobTitle).toContain('Software Development Task');
        });

        test('should validate job form inputs', async () => {
            await page.click('[data-testid="post-job-btn"]');

            // Try to submit with empty fields
            await page.click('[data-testid="submit-job-btn"]');

            // Should show validation errors
            const titleError = await page.textContent('[data-testid="title-error"]');
            const wagesError = await page.textContent('[data-testid="wages-error"]');
            
            expect(titleError).toContain('required');
            expect(wagesError).toContain('required');
        });

        test('should handle transaction failure gracefully', async () => {
            await page.click('[data-testid="post-job-btn"]');

            // Fill form
            await page.fill('[name="title"]', 'Test Job');
            await page.fill('[name="wages"]', '100');
            await page.click('[data-testid="submit-job-btn"]');

            // Simulate transaction failure
            await page.evaluate(() => {
                const event = new CustomEvent('ton-connect-transaction-error', {
                    detail: { message: 'Insufficient funds' },
                });
                window.dispatchEvent(event);
            });

            // Should show error message
            const errorMessage = await page.textContent('[data-testid="tx-error"]');
            expect(errorMessage).toContain('Insufficient funds');
        });

        test('should save job draft on network failure', async () => {
            await page.click('[data-testid="post-job-btn"]');

            // Fill form
            await page.fill('[name="title"]', 'Draft Job');
            await page.fill('[name="wages"]', '50');

            // Simulate network failure
            await page.context().setOffline(true);

            await page.click('[data-testid="submit-job-btn"]');

            // Should save as draft
            const draftNotice = await page.textContent('[data-testid="draft-saved"]');
            expect(draftNotice).toContain('saved as draft');

            // Restore network
            await page.context().setOffline(false);

            // Should be able to resume from draft
            await page.reload();
            const titleValue = await page.inputValue('[name="title"]');
            expect(titleValue).toBe('Draft Job');
        });
    });

    test.describe('Job Acceptance and Escrow Flow', () => {
        test('should complete full job acceptance and escrow funding', async () => {
            // Mock worker wallet
            await page.goto('http://localhost:3000');
            await page.evaluate(() => {
                localStorage.setItem('ton-connect-storage_bridge-connection', JSON.stringify({
                    type: 'injected',
                    address: 'EQWorker...MockAddress',
                }));
            });
            await page.reload();

            // Browse jobs
            await page.goto('http://localhost:3000/jobs');

            // Click on a job
            await page.click('[data-testid^="job-card-"]:first-child');

            // Apply for job
            await page.click('[data-testid="apply-job-btn"]');

            // Confirm application
            await page.click('[data-testid="confirm-application-btn"]');

            // Wait for backend processing
            await page.waitForSelector('[data-testid="application-success"]', { timeout: 5000 });

            // Employer accepts (switch context)
            await page.evaluate(() => {
                localStorage.setItem('ton-connect-storage_bridge-connection', JSON.stringify({
                    type: 'injected',
                    address: 'EQEmployer...MockAddress',
                }));
            });
            await page.reload();

            // Accept worker
            await page.click('[data-testid="accept-worker-btn"]');
            await page.click('[data-testid="approve-tx-btn"]');

            await page.waitForSelector('[data-testid="worker-assigned"]');

            // Fund escrow
            await page.click('[data-testid="fund-escrow-btn"]');

            // Approve funding transaction
            await page.waitForSelector('[data-testid="tx-approval-modal"]');
            await page.click('[data-testid="approve-tx-btn"]');

            // Wait for escrow funded
            await page.waitForSelector('[data-testid="escrow-funded"]', { timeout: 30000 });

            // Verify escrow status
            const escrowStatus = await page.textContent('[data-testid="escrow-status"]');
            expect(escrowStatus).toContain('Funded');
        });

        test('should handle concurrent job applications', async () => {
            // Open multiple tabs with different workers
            const worker1Page = page;
            const worker2Page = await page.context().newPage();

            // Setup worker 1
            await worker1Page.goto('http://localhost:3000/jobs');
            await worker1Page.evaluate(() => {
                localStorage.setItem('ton-connect-storage_bridge-connection', JSON.stringify({
                    type: 'injected',
                    address: 'EQWorker1...MockAddress',
                }));
            });

            // Setup worker 2
            await worker2Page.goto('http://localhost:3000/jobs');
            await worker2Page.evaluate(() => {
                localStorage.setItem('ton-connect-storage_bridge-connection', JSON.stringify({
                    type: 'injected',
                    address: 'EQWorker2...MockAddress',
                }));
            });

            // Both apply simultaneously
            const jobSelector = '[data-testid^="job-card-"]:first-child';
            await Promise.all([
                worker1Page.click(jobSelector).then(() => worker1Page.click('[data-testid="apply-job-btn"]')),
                worker2Page.click(jobSelector).then(() => worker2Page.click('[data-testid="apply-job-btn"]')),
            ]);

            // Only one should succeed or both pending
            const status1 = await worker1Page.textContent('[data-testid="application-status"]');
            const status2 = await worker2Page.textContent('[data-testid="application-status"]');

            const successCount = [status1, status2].filter(s => s?.includes('pending')).length;
            expect(successCount).toBeGreaterThan(0);
        });
    });

    test.describe('Job Completion and Payment Flow', () => {
        test('should complete job and release payment', async () => {
            // Mock employer
            await page.goto('http://localhost:3000');
            await page.evaluate(() => {
                localStorage.setItem('ton-connect-storage_bridge-connection', JSON.stringify({
                    type: 'injected',
                    address: 'EQEmployer...MockAddress',
                }));
            });
            await page.reload();

            // Navigate to my jobs
            await page.goto('http://localhost:3000/my-jobs');

            // Select in-progress job
            await page.click('[data-testid="job-in-progress"]:first-child');

            // Mark as complete
            await page.click('[data-testid="complete-job-btn"]');

            // Confirm completion
            await page.click('[data-testid="confirm-completion-btn"]');

            // Approve blockchain transaction
            await page.waitForSelector('[data-testid="tx-approval-modal"]');
            await page.click('[data-testid="approve-tx-btn"]');

            // Wait for payment release
            await page.waitForSelector('[data-testid="payment-released"]', { timeout: 30000 });

            // Verify job status
            const jobStatus = await page.textContent('[data-testid="job-status"]');
            expect(jobStatus).toContain('Completed');
        });

        test('should initiate dispute if disagreement', async () => {
            await page.goto('http://localhost:3000/my-jobs');
            
            await page.click('[data-testid="job-in-progress"]:first-child');

            // Click dispute button
            await page.click('[data-testid="dispute-btn"]');

            // Fill dispute form
            await page.fill('[name="dispute-reason"]', 'Work not completed as agreed');
            await page.click('[data-testid="submit-dispute-btn"]');

            // Approve transaction
            await page.click('[data-testid="approve-tx-btn"]');

            // Wait for dispute created
            await page.waitForSelector('[data-testid="dispute-created"]');

            const disputeStatus = await page.textContent('[data-testid="dispute-status"]');
            expect(disputeStatus).toContain('Under Review');
        });
    });

    test.describe('Reputation and Rating Flow', () => {
        test('should submit reputation rating after job completion', async () => {
            await page.goto('http://localhost:3000/my-jobs');

            // Select completed job
            await page.click('[data-testid="job-completed"]:first-child');

            // Click rate button
            await page.click('[data-testid="rate-user-btn"]');

            // Select 5-star rating
            await page.click('[data-testid="star-5"]');

            // Add review
            await page.fill('[name="review"]', 'Excellent work, very professional!');

            // Submit rating
            await page.click('[data-testid="submit-rating-btn"]');

            // Approve transaction
            await page.click('[data-testid="approve-tx-btn"]');

            // Wait for rating submitted
            await page.waitForSelector('[data-testid="rating-submitted"]');

            const confirmationMessage = await page.textContent('[data-testid="rating-confirmation"]');
            expect(confirmationMessage).toContain('Rating submitted successfully');
        });

        test('should display user reputation score', async () => {
            await page.goto('http://localhost:3000/profile');

            // Wait for reputation to load
            await page.waitForSelector('[data-testid="reputation-score"]');

            const reputationScore = await page.textContent('[data-testid="reputation-score"]');
            const scoreValue = parseFloat(reputationScore || '0');

            expect(scoreValue).toBeGreaterThanOrEqual(0);
            expect(scoreValue).toBeLessThanOrEqual(5);

            // Check rating breakdown
            const totalRatings = await page.textContent('[data-testid="total-ratings"]');
            expect(totalRatings).toBeTruthy();
        });
    });

    test.describe('Network Resilience', () => {
        test('should handle intermittent network failures', async () => {
            await page.goto('http://localhost:3000/jobs');

            // Simulate network disconnection
            await page.context().setOffline(true);

            // Try to load jobs
            await page.reload();

            // Should show offline message
            const offlineMessage = await page.textContent('[data-testid="offline-indicator"]');
            expect(offlineMessage).toContain('offline');

            // Restore network
            await page.context().setOffline(false);

            // Should auto-reconnect
            await page.waitForSelector('[data-testid="jobs-list"]', { timeout: 10000 });
        });

        test('should retry failed transactions', async () => {
            await page.goto('http://localhost:3000/jobs/post');

            await page.fill('[name="title"]', 'Test Job');
            await page.fill('[name="wages"]', '100');

            // Mock transaction failure
            let attemptCount = 0;
            await page.route('**/api/v1/jobs', route => {
                attemptCount++;
                if (attemptCount < 3) {
                    route.abort('failed');
                } else {
                    route.continue();
                }
            });

            await page.click('[data-testid="submit-job-btn"]');

            // Should retry and eventually succeed
            await page.waitForSelector('[data-testid="tx-success"]', { timeout: 60000 });
            expect(attemptCount).toBeGreaterThanOrEqual(3);
        });
    });

    test.describe('Performance Metrics', () => {
        test('should measure page load performance', async () => {
            const start = Date.now();
            await page.goto('http://localhost:3000');
            const loadTime = Date.now() - start;

            console.log(`Page load time: ${loadTime}ms`);
            expect(loadTime).toBeLessThan(3000); // < 3 seconds
        });

        test('should measure transaction processing time', async () => {
            await page.goto('http://localhost:3000/jobs/post');

            await page.fill('[name="title"]', 'Perf Test Job');
            await page.fill('[name="wages"]', '100');

            const txStart = Date.now();
            await page.click('[data-testid="submit-job-btn"]');
            await page.click('[data-testid="approve-tx-btn"]');
            await page.waitForSelector('[data-testid="tx-success"]');
            const txTime = Date.now() - txStart;

            console.log(`Transaction time: ${txTime}ms`);
            expect(txTime).toBeLessThan(30000); // < 30 seconds
        });
    });
});
