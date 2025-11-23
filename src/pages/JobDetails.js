import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJob, useAcceptJob, useCompleteJob, useCancelJob } from '../hooks/useJobsAPI';
import { useEscrowByJob, useFundEscrow, useReleaseEscrow } from '../hooks/useEscrowAPI';
import { useJobRatings, useSubmitRating } from '../hooks/useReputationAPI';
import { useWalletContext } from '../contexts/WalletContext';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import toast from 'react-hot-toast';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { address, connected, isReady } = useWalletContext();
  const { webApp } = useTelegramWebApp();
  
  // Data fetching
  const { data: job, isLoading: jobLoading, error: jobError } = useJob(jobId);
  const { data: escrow, isLoading: escrowLoading } = useEscrowByJob(jobId);
  const { data: ratings } = useJobRatings(jobId);
  
  // Mutations
  const acceptJob = useAcceptJob();
  const completeJob = useCompleteJob();
  const cancelJob = useCancelJob();
  const fundEscrow = useFundEscrow();
  const releaseEscrow = useReleaseEscrow();
  const submitRating = useSubmitRating();
  
  // State
  const [showRatingForm, setShowRatingForm] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');
  
  if (jobLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (jobError) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load job details</p>
          <p className="text-sm text-red-600 mt-1">{jobError.message}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }
  
  if (!job) return null;
  
  const isEmployer = address && job.employerAddress === address;
  const isWorker = address && job.workerAddress === address;
  const canAccept = address && job.status === 'POSTED' && !isEmployer;
  const canComplete = isEmployer && job.status === 'ASSIGNED';
  const canCancel = (isEmployer || isWorker) && ['POSTED', 'ASSIGNED'].includes(job.status);
  const canRate = (isEmployer || isWorker) && job.status === 'COMPLETED';
  
  const handleAccept = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    try {
      // TODO: Sign transaction with TON Connect
      const txHash = 'mock-tx-hash'; // Replace with actual transaction
      
      await acceptJob.mutateAsync({
        jobId: job.id,
        data: { workerAddress: address, txHash }
      });
      
      toast.success('Job accepted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to accept job');
    }
  };
  
  const handleComplete = async () => {
    if (!isEmployer) return;
    
    webApp?.showConfirm('Mark this job as completed?', async (confirmed) => {
      if (confirmed) {
        try {
          const txHash = 'mock-tx-hash'; // Replace with actual transaction
          
          await completeJob.mutateAsync({
            jobId: job.id,
            data: { txHash }
          });
          
          toast.success('Job marked as completed!');
        } catch (error) {
          toast.error(error.message || 'Failed to complete job');
        }
      }
    });
  };
  
  const handleCancel = async () => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;
    
    try {
      const txHash = 'mock-tx-hash'; // Replace with actual transaction
      
      await cancelJob.mutateAsync({
        jobId: job.id,
        data: { reason, txHash }
      });
      
      toast.success('Job cancelled');
    } catch (error) {
      toast.error(error.message || 'Failed to cancel job');
    }
  };
  
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    
    if (!rating || !comment.trim()) {
      toast.error('Please provide rating and comment');
      return;
    }
    
    try {
      const targetAddress = isEmployer ? job.workerAddress : job.employerAddress;
      const txHash = 'mock-tx-hash'; // Replace with actual transaction
      
      await submitRating.mutateAsync({
        jobId: job.id,
        targetAddress,
        rating,
        comment: comment.trim(),
        txHash
      });
      
      setShowRatingForm(false);
      setRating(5);
      setComment('');
      toast.success('Rating submitted!');
    } catch (error) {
      toast.error(error.message || 'Failed to submit rating');
    }
  };
  
  const getStatusBadge = (status) => {
    const colors = {
      POSTED: 'bg-green-100 text-green-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/jobs')}
          className="text-blue-600 hover:text-blue-800 mb-2"
        >
          ← Back to Jobs
        </button>
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <div className="mt-2">{getStatusBadge(job.status)}</div>
      </div>
      
      {/* Job Details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Wages</p>
            <p className="text-lg font-semibold">💰 {job.wages} TON</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="text-lg font-semibold">⏱️ {job.duration} hours</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Category</p>
            <p className="text-lg">{job.category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="text-lg">📍 {job.location || 'Remote'}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Description</p>
          <p className="text-gray-800">{job.description}</p>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">Employer</p>
          <p className="text-sm font-mono bg-gray-100 p-2 rounded">
            {job.employerAddress?.slice(0, 8)}...{job.employerAddress?.slice(-6)}
          </p>
        </div>
        
        {job.workerAddress && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">Worker</p>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded">
              {job.workerAddress.slice(0, 8)}...{job.workerAddress.slice(-6)}
            </p>
          </div>
        )}
        
        <div className="text-sm text-gray-500">
          Posted: {new Date(job.createdAt).toLocaleDateString()}
        </div>
      </div>
      
      {/* Escrow Status */}
      {escrow && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">💰 Escrow Status</h2>
          {escrowLoading ? (
            <p className="text-gray-500">Loading escrow details...</p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold">{escrow.amount} TON</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold">{escrow.status}</span>
              </div>
              {escrow.status === 'DISPUTED' && escrow.disputeReason && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm font-semibold text-yellow-800">Dispute Reason:</p>
                  <p className="text-sm text-yellow-700">{escrow.disputeReason}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Ratings */}
      {ratings && ratings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">⭐ Ratings</h2>
          <div className="space-y-3">
            {ratings.map((r, index) => (
              <div key={index} className="border-b border-gray-200 pb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">
                    {r.fromAddress?.slice(0, 8)}...{r.fromAddress?.slice(-6)}
                  </span>
                  <span className="text-yellow-500">{'⭐'.repeat(r.rating)}</span>
                </div>
                <p className="text-sm text-gray-700">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Actions</h2>
        <div className="space-y-3">
          {canAccept && (
            <button
              onClick={handleAccept}
              disabled={acceptJob.isPending}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {acceptJob.isPending ? 'Accepting...' : 'Accept Job'}
            </button>
          )}
          
          {canComplete && (
            <button
              onClick={handleComplete}
              disabled={completeJob.isPending}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {completeJob.isPending ? 'Processing...' : 'Mark as Completed'}
            </button>
          )}
          
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelJob.isPending}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {cancelJob.isPending ? 'Cancelling...' : 'Cancel Job'}
            </button>
          )}
          
          {canRate && !showRatingForm && (
            <button
              onClick={() => setShowRatingForm(true)}
              className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              Submit Rating
            </button>
          )}
          
          {showRatingForm && (
            <form onSubmit={handleSubmitRating} className="border-t pt-4">
              <h3 className="font-semibold mb-3">Submit Rating</h3>
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-2xl"
                    >
                      {star <= rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2"
                  rows="3"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitRating.isPending}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                >
                  {submitRating.isPending ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRatingForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
