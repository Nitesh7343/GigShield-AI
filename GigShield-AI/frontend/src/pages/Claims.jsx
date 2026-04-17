import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { claimsAPI } from '../services/api';
import Card from '../components/Card';

const Claims = () => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await claimsAPI.getMyClaiims();
      setClaims(response.data.claims);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'FLAGGED':
        return 'bg-red-100 text-red-800';
      case 'PAID':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredClaims = filter === 'ALL'
    ? claims
    : claims.filter(c => c.status === filter);

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Your Claims</h1>

      {/* Filter */}
      <div className="mb-6 flex space-x-2">
        {['ALL', 'APPROVED', 'FLAGGED', 'PAID'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded ${
              filter === status
                ? 'btn btn-primary'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.length > 0 ? (
          filteredClaims.map((claim) => (
            <Card key={claim._id}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="mb-2">
                    <strong>Type:</strong>{' '}
                    {claim.triggerId?.type || 'Unknown'}
                  </p>
                  <p className="mb-2">
                    <strong>City:</strong>{' '}
                    {claim.triggerId?.city || 'N/A'}
                  </p>
                  <p className="mb-2">
                    <strong>Amount:</strong> ₹{claim.amount}
                  </p>
                  <p className="mb-2">
                    <strong>Fraud Score:</strong> {claim.fraudScore}/100
                  </p>
                  {claim.fraudReasons?.length > 0 && (
                    <p className="mb-2">
                      <strong>Fraud Flags:</strong>{' '}
                      {claim.fraudReasons.join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    {new Date(claim.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded font-bold ${getStatusColor(claim.status)}`}>
                  {claim.status}
                </span>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-center text-gray-600">No claims found</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Claims;
