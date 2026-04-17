/**
 * Utility functions for debugging and testing
 */

// Mock user data generator
export const generateMockUser = (city = 'Delhi') => {
  const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];
  return {
    phone: Math.random().toString().slice(2, 12),
    password: 'test123',
    city: city || cities[Math.floor(Math.random() * cities.length)],
    avgWeeklyIncome: 10000 + Math.random() * 20000
  };
};

// Format currency
export const formatCurrency = (amount) => {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};

// Format date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN');
};

// Format date and time
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-IN');
};

// Calculate days remaining in policy
export const daysRemainingInPolicy = (endDate) => {
  const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
};

// Get fraud risk color
export const getFraudRiskColor = (score) => {
  if (score < 40) return 'text-green-600';
  if (score < 70) return 'text-yellow-600';
  return 'text-red-600';
};

// Get status badge variant
export const getStatusVariant = (status) => {
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

// Simulate API delay for testing
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Log system state (for debugging)
export const logSystemState = (state) => {
  console.log('%c=== GigShield System State ===', 'color: blue; font-weight: bold');
  console.table(state);
};
