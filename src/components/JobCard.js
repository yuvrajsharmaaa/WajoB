import React from 'react';
import { useNavigate } from 'react-router-dom';

const JobCard = ({ job, currentUser }) => {
  const navigate = useNavigate();
  
  const getStatusColor = (status) => {
    const colors = {
      POSTED: 'bg-green-100 text-green-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
          <p className="text-sm text-gray-600">{job.location || 'Remote'}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-blue-600">{job.wages} TON</p>
          <p className="text-xs text-gray-500">{job.duration} hours</p>
        </div>
      </div>
      
      <p className="text-gray-700 text-sm mb-3 line-clamp-2">{job.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {job.category}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(job.status)}`}>
            {job.status}
          </span>
        </div>
        
        <button 
          onClick={() => navigate(`/jobs/${job.id}`)}
          className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default JobCard;
