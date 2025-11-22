import React from 'react';

/**
 * Reusable Modal component for confirmations and messages
 */
export const Modal = ({ isOpen, onClose, title, children, type = 'info' }) => {
  if (!isOpen) return null;

  const typeStyles = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  const iconStyles = {
    info: '🔵',
    success: '✅',
    error: '❌',
    warning: '⚠️',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full border-2 ${typeStyles[type]}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{iconStyles[type]}</span>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="text-gray-700">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Transaction confirmation modal with loading state
 */
export const TransactionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  loading 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type="warning">
      <div className="space-y-4">
        <p>{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-ton-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                Processing...
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Loading spinner component
 */
export const Spinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`${sizes[size]} animate-spin rounded-full border-2 border-gray-300 border-t-ton-blue`} />
  );
};

/**
 * Loading overlay for full-page loading states
 */
export const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

/**
 * Success notification toast
 */
export const SuccessToast = ({ message, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
      <span className="text-xl">✅</span>
      <span>{message}</span>
    </div>
  );
};

/**
 * Error notification toast
 */
export const ErrorToast = ({ message, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
      <span className="text-xl">❌</span>
      <div className="flex-1">
        <p className="font-semibold">Transaction Failed</p>
        <p className="text-sm opacity-90">{message}</p>
      </div>
      <button onClick={onClose} className="text-white opacity-75 hover:opacity-100 text-xl">
        ×
      </button>
    </div>
  );
};
