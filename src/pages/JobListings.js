import React, { useState } from 'react';
import JobCard from '../components/JobCard';
import { useTonWallet } from '../hooks/useTonWallet';
import { NETWORK, areContractsDeployed } from '../config/contracts';

// Mock data - will be replaced with blockchain data
const mockJobs = [
  {
    id: 1,
    title: 'Night Security Guard',
    location: 'Downtown Construction Site',
    payment: '50',
    duration: '8 hours',
    description: 'Need experienced security guard for night shift at construction site. Must be punctual and have prior security experience.',
    category: 'Security',
    verified: true,
  },
  {
    id: 2,
    title: 'Building Watchman',
    location: 'Residential Complex, Sector 15',
    payment: '40',
    duration: '12 hours',
    description: 'Watchman needed for residential building. Day shift position available immediately.',
    category: 'Watchman',
    verified: true,
  },
  {
    id: 3,
    title: 'Gate Security',
    location: 'Industrial Area Gate 3',
    payment: '45',
    duration: '8 hours',
    description: 'Gate security required for industrial complex. Should maintain visitor logs and access control.',
    category: 'Security',
    verified: false,
  },
];

const JobListings = () => {
  const { connected } = useTonWallet();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleApply = (job) => {
    if (!connected) {
      alert('Please connect your TON wallet to apply for jobs');
      return;
    }
    
    if (!areContractsDeployed()) {
      alert(`⚠️ Smart Contracts Not Deployed\n\nContracts need to be deployed to ${NETWORK.current} first.\n\nRun these commands in /contract directory:\n\n1. npx blueprint run deployDeployJobRegistry --testnet\n2. npx blueprint run deployDeployEscrow --testnet\n3. npx blueprint run deployDeployReputation --testnet\n\nThen update contract addresses in src/config/contracts.js`);
      return;
    }
    
    alert(`Applying for: ${job.title}\n\n🧪 Testnet Mode: Blockchain integration ready!`);
    // TODO: Implement blockchain transaction
  };

  const handleView = (job) => {
    alert(`Viewing job: ${job.title}`);
    // TODO: Navigate to job details page
  };

  const categories = ['All', 'Security', 'Watchman', 'Gate Security'];

  const filteredJobs = selectedCategory === 'All' 
    ? mockJobs 
    : mockJobs.filter(job => job.category === selectedCategory);

  const contractsDeployed = areContractsDeployed();

  return (
    <div className="container mx-auto p-4">
      {/* Network and Status Banner */}
      <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
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

      <div className="mb-6">
        
        {/* Category Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-ton-blue text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              onApply={handleApply}
              onView={handleView}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No jobs available in this category</p>
          </div>
        )}
      </div>

      {!connected && (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-50 border-t border-yellow-200 p-4">
          <p className="text-center text-sm text-yellow-800">
            Connect your TON wallet to apply for jobs
          </p>
        </div>
      )}
    </div>
  );
};

export default JobListings;
