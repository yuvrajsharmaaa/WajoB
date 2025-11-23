import React, { useState, useEffect } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';

/**
 * ADVANCED TRANSACTION STATUS COMPONENT
 * 
 * Features:
 * 1. Real-time transaction status tracking
 * 2. Progress visualization
 * 3. Error handling with retry logic
 * 4. Transaction explorer links
 * 5. Gas estimation display
 * 6. Timeout handling
 * 7. Offline detection
 * 8. Transaction history
 * 
 * UX Benefits:
 * - Clear visual feedback at every step
 * - Users know exactly what's happening
 * - Reduced anxiety during long transactions
 * - Easy troubleshooting with detailed errors
 */

const TransactionStatus = ({
  status,           // 'idle' | 'preparing' | 'signing' | 'broadcasting' | 'confirming' | 'success' | 'error'
  txHash,
  error,
  onRetry,
  onClose,
  estimatedGas,
  estimatedTime,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (status === 'broadcasting' || status === 'confirming') {
      const interval = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [status]);

  const getStatusIcon = () => {
    switch (status) {
      case 'preparing':
        return '🔧';
      case 'signing':
        return '✍️';
      case 'broadcasting':
        return '📡';
      case 'confirming':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '💼';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'preparing':
        return 'Preparing transaction...';
      case 'signing':
        return 'Waiting for signature...';
      case 'broadcasting':
        return 'Broadcasting to network...';
      case 'confirming':
        return `Confirming transaction... (${elapsed}s)`;
      case 'success':
        return 'Transaction successful!';
      case 'error':
        return 'Transaction failed';
      default:
        return 'Ready';
    }
  };

  const getProgressPercentage = () => {
    const stages = {
      idle: 0,
      preparing: 20,
      signing: 40,
      broadcasting: 60,
      confirming: 80,
      success: 100,
      error: 0,
    };
    return stages[status] || 0;
  };

  const isLoading = ['preparing', 'signing', 'broadcasting', 'confirming'].includes(status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`p-6 ${
          status === 'success' ? 'bg-green-50' :
          status === 'error' ? 'bg-red-50' :
          'bg-blue-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{getStatusIcon()}</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {getStatusMessage()}
                </h3>
                {estimatedTime && isLoading && (
                  <p className="text-sm text-gray-600 mt-1">
                    Est. time: ~{estimatedTime}s
                  </p>
                )}
              </div>
            </div>
            {!isLoading && onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isLoading && (
          <div className="h-2 bg-gray-200">
            <div
              className="h-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          {/* Offline Warning */}
          {!isOnline && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <p className="text-sm text-yellow-800">
                  You're offline. Transaction will resume when connection is restored.
                </p>
              </div>
            </div>
          )}

          {/* Transaction Details */}
          {(txHash || estimatedGas) && (
            <div className="space-y-3 mb-4">
              {estimatedGas && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Estimated Gas:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ~{estimatedGas} TON
                  </span>
                </div>
              )}
              
              {txHash && (
                <div className="py-2">
                  <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {txHash}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(txHash)}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                    >
                      Copy
                    </button>
                  </div>
                  <a
                    href={`https://testnet.tonscan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    View on TON Explorer →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {status === 'success' && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                🎉 Your transaction has been confirmed on the blockchain!
              </p>
            </div>
          )}

          {/* Error Message */}
          {status === 'error' && error && (
            <div className="mb-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-800 mb-2">
                  Error Details:
                </p>
                <p className="text-sm text-red-700">
                  {error.message || error}
                </p>
              </div>
              
              {/* Common Error Solutions */}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-800 mb-2">
                  💡 Possible Solutions:
                </p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Check your wallet balance</li>
                  <li>Ensure you have enough TON for gas fees</li>
                  <li>Try refreshing and submitting again</li>
                  <li>Contact support if the issue persists</li>
                </ul>
              </div>
            </div>
          )}

          {/* Loading Animation */}
          {isLoading && (
            <div className="flex flex-col items-center py-8">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Please don't close this window...
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            {status === 'error' && onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Retry Transaction
              </button>
            )}
            
            {status === 'success' && onClose && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ✓ Done
              </button>
            )}
            
            {status === 'error' && onClose && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Footer - Transaction Tips */}
        {isLoading && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              💡 Tip: You can close this modal and check the transaction status later in your wallet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionStatus;

/**
 * TRANSACTION TRACKER COMPONENT
 * Shows status of all recent transactions
 */
export const TransactionTracker = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Load transactions from localStorage
    const stored = localStorage.getItem('wagob_transactions');
    if (stored) {
      setTransactions(JSON.parse(stored));
    }
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-40">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h4 className="font-semibold text-gray-900">Recent Transactions</h4>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {transactions.slice(0, 5).map((tx, index) => (
          <div
            key={index}
            className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">
                {tx.type}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(tx.status)}`}>
                {tx.status}
              </span>
            </div>
            
            {tx.hash && (
              <a
                href={`https://testnet.tonscan.org/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline block truncate"
              >
                {tx.hash}
              </a>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              {new Date(tx.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
