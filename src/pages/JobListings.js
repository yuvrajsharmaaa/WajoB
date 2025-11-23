import React, { useState } from 'react';
import JobCard from '../components/JobCard';
import { JobPostingForm } from '../components/JobPostingForm';
import { useWalletContext } from '../contexts/WalletContext';
import { useJobs, useJobStats } from '../hooks/useJobsAPI';
import { NETWORK, areContractsDeployed } from '../config/contracts';
import { useTelegramUser } from '../hooks/useTelegramWebApp';

const JobListings = () => {
  const { connected, address, isReady } = useWalletContext();
  const telegramUser = useTelegramUser();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showPostJobForm, setShowPostJobForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Fetch jobs from API
  const { data: jobsData, isLoading, error, refetch } = useJobs({
    page: currentPage,
    limit: 20,
    status: selectedCategory === 'All' ? undefined : selectedCategory,
  });
  
  // Fetch stats
  const { data: stats } = useJobStats();

  const handleApply = (job) => {
    if (!connected) {
      alert('Please connect your TON wallet to apply for jobs');
      return;
    }
    
    if (!areContractsDeployed()) {
      alert(`⚠️ Smart Contracts Not Deployed\n\nContracts need to be deployed to ${NETWORK.current} first.\n\nRun these commands in /contract directory:\n\n1. npx blueprint run deployDeployJobRegistry --testnet\n2. npx blueprint run deployDeployEscrow --testnet\n3. npx blueprint run deployDeployReputation --testnet\n\nThen update contract addresses in src/config/contracts.js`);
      return;
    }
    
    // Navigate to job details or trigger accept transaction
    console.log('Applying for job:', job);
    alert(`Applying for: ${job.title}\n\n🧪 Testnet Mode: Ready to accept job!`);
  };

  const handleView = (job) => {
    // Navigate to job details page
    console.log('Viewing job:', job);
    alert(`Viewing job: ${job.title}`);
  };

  const categories = ['All', 'POSTED', 'ASSIGNED', 'COMPLETED', 'CANCELLED'];

  const contractsDeployed = areContractsDeployed();

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ton-blue"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Failed to load jobs</p>
          <p className="text-red-600 text-sm mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const jobs = jobsData?.jobs || [];
  const total = jobsData?.total || 0;
  const totalPages = jobsData?.totalPages || 1;

  return (
    <div className="container mx-auto p-4">
      {/* Header with Stats */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Available Jobs</h2>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              NETWORK.current === 'testnet' 
                ? 'bg-orange-100 text-orange-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {NETWORK.current === 'testnet' ? '🧪 TESTNET' : '🚀 MAINNET'}
            </span>
            {!contractsDeployed && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                ⚠️ Deploy Contracts
              </span>
            )}
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-ton-blue">{stats.total || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-2xl font-bold text-green-600">{stats.posted || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.assigned || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-purple-600">{stats.completed || 0}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-ton-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Post Job Button */}
          <button
            onClick={() => setShowPostJobForm(true)}
            disabled={!connected}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Post Job
          </button>
        </div>

        {/* Telegram User Info */}
        {telegramUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              👤 Logged in as: <span className="font-semibold">{telegramUser.first_name} {telegramUser.last_name}</span>
              {telegramUser.username && ` (@${telegramUser.username})`}
            </p>
          </div>
        )}
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {jobs.length > 0 ? (
          jobs.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              onApply={handleApply}
              onView={handleView}
              currentUser={address}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-2">No jobs available</p>
            <p className="text-sm text-gray-400">
              {selectedCategory === 'All' 
                ? 'Be the first to post a job!' 
                : `No jobs in "${selectedCategory}" status`}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Job Posting Form Modal */}
      {showPostJobForm && (
        <JobPostingForm 
          onClose={() => setShowPostJobForm(false)}
          onSuccess={() => {
            setShowPostJobForm(false);
            refetch(); // Refresh jobs list
          }}
        />
      )}

      {/* Wallet Connection Banner */}
      {!connected && (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-50 border-t border-yellow-200 p-4">
          <p className="text-center text-sm text-yellow-800">
            Connect your TON wallet to post and apply for jobs
          </p>
        </div>
      )}
    </div>
  );
};

export default JobListings;
