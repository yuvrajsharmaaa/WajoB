import React from 'react';

const JobCard = ({ job, onApply, onView }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
          <p className="text-sm text-gray-600">{job.location}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-ton-blue">{job.payment} TON</p>
          <p className="text-xs text-gray-500">{job.duration}</p>
        </div>
      </div>
      
      <p className="text-gray-700 text-sm mb-3 line-clamp-2">{job.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {job.category}
          </span>
          {job.verified && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              ✓ Verified
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => onView(job)}
            className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            View
          </button>
          <button 
            onClick={() => onApply(job)}
            className="text-sm px-3 py-1 bg-ton-blue text-white rounded hover:bg-blue-600"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
