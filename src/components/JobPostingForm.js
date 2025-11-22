import React, { useState } from 'react';
import { useJobRegistry } from '../hooks/useJobRegistry';
import { useEscrow } from '../hooks/useEscrow';
import { useTonWallet } from '../hooks/useTonWallet';
import { TransactionModal, LoadingOverlay, SuccessToast, ErrorToast } from './Modal';
import { getExplorerUrl } from '../config/contracts';

/**
 * Job Posting Form Component
 * Allows employers to create jobs and fund escrow
 */
export const JobPostingForm = ({ onClose, onSuccess }) => {
  const { connected, wallet } = useTonWallet();
  const { createJob, loading: jobLoading } = useJobRegistry();
  const { createEscrow, fundEscrow, loading: escrowLoading } = useEscrow();

  const [step, setStep] = useState(1); // 1: Job Details, 2: Review, 3: Escrow
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [txHash, setTxHash] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    wages: '',
    duration: '',
    category: 'Security',
  });

  const [errors, setErrors] = useState({});

  const categories = ['Security', 'Watchman', 'Gate Security', 'Night Guard'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.wages || parseFloat(formData.wages) <= 0) {
      newErrors.wages = 'Wages must be greater than 0';
    }
    if (!formData.duration || parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!connected) {
      setErrorMessage('Please connect your wallet first');
      return;
    }

    setShowConfirmModal(false);

    try {
      // Step 1: Create job on blockchain
      const jobResult = await createJob(formData);
      
      setSuccessMessage('Job posted successfully! ✅');
      setTxHash(jobResult.boc);

      // Step 2: Optionally create escrow
      setTimeout(() => {
        setSuccessMessage('');
        setStep(3);
      }, 2000);

    } catch (error) {
      console.error('Job creation error:', error);
      setErrorMessage(error.message || 'Failed to create job');
    }
  };

  const handleCreateEscrow = async () => {
    if (!wallet?.account?.address) {
      setErrorMessage('Wallet address not available');
      return;
    }

    try {
      // Create escrow (jobId would come from JobRegistry event in production)
      const escrowResult = await createEscrow({
        jobId: Math.floor(Date.now() / 1000), // Temporary: use timestamp
        employer: wallet.account.address,
        worker: wallet.account.address, // Placeholder until worker applies
        amount: formData.wages,
      });

      setSuccessMessage('Escrow created! Fund it to activate. ✅');
      
      // After creating escrow, fund it
      setTimeout(async () => {
        try {
          const fundResult = await fundEscrow(
            Math.floor(Date.now() / 1000), 
            formData.wages
          );
          setSuccessMessage('Escrow funded successfully! 🎉');
          
          setTimeout(() => {
            if (onSuccess) onSuccess();
            if (onClose) onClose();
          }, 2000);
        } catch (error) {
          setErrorMessage('Escrow created but funding failed: ' + error.message);
        }
      }, 2000);

    } catch (error) {
      console.error('Escrow error:', error);
      setErrorMessage(error.message || 'Failed to create escrow');
    }
  };

  const loading = jobLoading || escrowLoading;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 1 ? 'Post New Job' : step === 2 ? 'Review Job' : 'Setup Escrow'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className={`flex-1 text-center ${step >= 1 ? 'text-ton-blue font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${step >= 1 ? 'bg-ton-blue text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <div className="text-xs mt-1">Details</div>
            </div>
            <div className={`flex-1 h-1 ${step >= 2 ? 'bg-ton-blue' : 'bg-gray-200'}`} />
            <div className={`flex-1 text-center ${step >= 2 ? 'text-ton-blue font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${step >= 2 ? 'bg-ton-blue text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <div className="text-xs mt-1">Review</div>
            </div>
            <div className={`flex-1 h-1 ${step >= 3 ? 'bg-ton-blue' : 'bg-gray-200'}`} />
            <div className={`flex-1 text-center ${step >= 3 ? 'text-ton-blue font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${step >= 3 ? 'bg-ton-blue text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <div className="text-xs mt-1">Escrow</div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Night Security Guard"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ton-blue ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the job responsibilities and requirements..."
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ton-blue ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Downtown Plaza, Mumbai"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ton-blue ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wages (TON) *
                  </label>
                  <input
                    type="number"
                    name="wages"
                    value={formData.wages}
                    onChange={handleInputChange}
                    placeholder="50"
                    min="0"
                    step="0.1"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ton-blue ${errors.wages ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.wages && <p className="text-red-500 text-sm mt-1">{errors.wages}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (hours) *
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="8"
                    min="1"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ton-blue ${errors.duration ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ton-blue"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 px-4 py-2 bg-ton-blue text-white rounded-lg hover:bg-blue-600"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Title</div>
                  <div className="font-semibold">{formData.title}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Description</div>
                  <div>{formData.description}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Location</div>
                    <div>{formData.location}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Category</div>
                    <div>{formData.category}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Wages</div>
                    <div className="font-bold text-ton-blue">{formData.wages} TON</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Duration</div>
                    <div>{formData.duration} hours</div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <span>💡</span>
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-800">Gas Fee</p>
                    <p className="text-yellow-700">~0.05 TON will be charged for blockchain transaction</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!connected}
                  className="flex-1 px-4 py-2 bg-ton-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Post Job
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-bold mb-2">Job Posted Successfully!</h3>
                <p className="text-gray-600 mb-4">Now let's secure the payment with escrow</p>
                
                {txHash && (
                  <a
                    href={getExplorerUrl(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ton-blue text-sm hover:underline"
                  >
                    View Transaction →
                  </a>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <span>🔒</span>
                  <div className="text-sm">
                    <p className="font-semibold text-blue-800">Secure Payment Escrow</p>
                    <p className="text-blue-700">
                      Create an escrow to lock {formData.wages} TON. Funds will be released when job is completed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleCreateEscrow}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-ton-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create & Fund Escrow'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals and Toasts */}
      <TransactionModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSubmit}
        title="Confirm Job Posting"
        message={`Post "${formData.title}" job with ${formData.wages} TON wages? This will create a blockchain transaction.`}
        loading={loading}
      />

      {loading && <LoadingOverlay message="Processing transaction..." />}
      {successMessage && <SuccessToast message={successMessage} onClose={() => setSuccessMessage('')} />}
      {errorMessage && <ErrorToast message={errorMessage} onClose={() => setErrorMessage('')} />}
    </div>
  );
};
