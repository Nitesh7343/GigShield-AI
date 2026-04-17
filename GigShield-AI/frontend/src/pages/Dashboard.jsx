import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { policyAPI, claimsAPI, authAPI, paymentsAPI, weatherAPI } from '../services/api';
import Card from '../components/Card';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [policy, setPolicy] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchWithdrawalHistory();
  }, []);

  useEffect(() => {
    if (user?.city) {
      fetchWeatherData();
    }
  }, [user?.city]);

  const fetchWithdrawalHistory = async () => {
    try {
      const response = await paymentsAPI.getMyWithdrawalRequests();
      setWithdrawalHistory(response.data.withdrawalRequests || []);
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
    }
  };

  const fetchWeatherData = async () => {
    try {
      setWeatherLoading(true);
      const response = await weatherAPI.getWeatherByCity(user?.city);
      setWeather(response.data);
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const profileRes = await authAPI.getProfile();
      setStats({
        weeklyIncome: profileRes.data.user.avgWeeklyIncome,
        riskScore: profileRes.data.user.riskScore,
        walletBalance: profileRes.data.user.walletBalance
      });

      try {
        const policyRes = await policyAPI.getMyPolicy();
        setPolicy(policyRes.data.policy);
      } catch (err) {
        console.log('No active policy');
      }

      try {
        const claimsRes = await claimsAPI.getMyClaiims();
        setClaims(claimsRes.data.claims);
      } catch (err) {
        console.log('No claims');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      await policyAPI.createPolicy();
      alert('Policy created! Waiting period: 24 hours');
      fetchDashboardData();
    } catch (error) {
      alert('Error creating policy: ' + error.response?.data?.message);
    }
  };

  const handleWithdrawalRequest = async (e) => {
    e.preventDefault();
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      setMessage('❌ Please enter a valid amount');
      return;
    }

    if (withdrawalAmount > stats.walletBalance) {
      setMessage('❌ Insufficient balance. Your wallet balance is ₹' + stats.walletBalance);
      return;
    }

    try {
      setWithdrawalLoading(true);
      const response = await paymentsAPI.submitWithdrawal({
        amount: parseFloat(withdrawalAmount)
      });

      setMessage(`✅ ${response.data.message}`);
      setWithdrawalAmount('');
      setShowWithdrawalModal(false);

      setTimeout(() => {
        fetchWithdrawalHistory();
        setMessage('');
      }, 2000);
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.message || 'Failed to process withdrawal'}`);
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const handlePaymentRequest = async (e) => {
    e.preventDefault();
    if (!paymentAmount || paymentAmount <= 0) {
      setMessage('❌ Please enter a valid payment amount');
      return;
    }

    try {
      setPaymentLoading(true);
      const response = await paymentsAPI.createPayment({
        amount: parseFloat(paymentAmount),
        paymentMethod: paymentMethod
      });

      setMessage(`✅ Payment of ₹${paymentAmount} successful! Transaction ID: ${response.data.payment.transactionId}`);
      setPaymentAmount('');
      setShowPaymentModal(false);

      setTimeout(() => {
        fetchDashboardData();
        setMessage('');
      }, 2000);
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.message || 'Failed to process payment'}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="inline-block animate-spin">⏳</div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const getRiskColor = (score) => {
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Welcome Header */}
      <div className="mb-8 bg-gradient-to-r from-indigo-900 to-violet-900 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.phone} 👋</h1>
          <p className="text-indigo-200">Your parametric insurance dashboard</p>
        </div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white/80 border-0 shadow-lg hover-lift">
          <p className="text-slate-500 text-sm font-semibold mb-2">💰 Weekly Income</p>
          <p className="text-3xl font-bold text-emerald-600">₹{stats.weeklyIncome?.toLocaleString()}</p>
        </Card>
        <Card className="bg-white/80 border-0 shadow-lg hover-lift">
          <p className="text-slate-500 text-sm font-semibold mb-2">📊 Risk Score</p>
          <p className={`text-3xl font-bold ${getRiskColor(stats.riskScore)}`}>{stats.riskScore}/100</p>
        </Card>
        <Card className="bg-white/80 border-0 shadow-lg hover-lift">
          <p className="text-slate-500 text-sm font-semibold mb-2">💳 Wallet Balance</p>
          <p className="text-3xl font-bold text-indigo-600">₹{stats.walletBalance?.toLocaleString() || 0}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex-1 px-3 py-2 rounded text-white text-sm font-semibold bg-green-500 hover:bg-green-600 transition"
            >
              💳 Add
            </button>
            <button
              onClick={() => setShowWithdrawalModal(true)}
              disabled={!stats.walletBalance || stats.walletBalance <= 0}
              className={`flex-1 px-3 py-2 rounded text-white text-sm font-semibold transition ${
                stats.walletBalance && stats.walletBalance > 0
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              💸 Withdraw
            </button>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-semibold transition-all duration-300 ${
            activeTab === 'overview'
              ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
              : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          🌤️ Overview
        </button>
        <button
          onClick={() => setActiveTab('policy')}
          className={`px-6 py-3 font-semibold transition-all duration-300 ${
            activeTab === 'policy'
              ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
              : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          📋 Policy
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-6 py-3 font-semibold transition-all duration-300 ${
            activeTab === 'claims'
              ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
              : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          💰 Claims
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-6 py-3 font-semibold transition-all duration-300 ${
            activeTab === 'withdrawals'
              ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
              : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          💸 Withdrawals
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border-l-4 ${
          message.includes('✅')
            ? 'bg-green-50 border-green-500 text-green-700'
            : 'bg-red-50 border-red-500 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Weather & AQI Section */}
          {weatherLoading ? (
            <Card title="🌤️ Weather & Air Quality">
              <p className="text-center text-gray-600">Loading weather data...</p>
            </Card>
          ) : weather ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Weather Card */}
              <Card className="border-blue-200">
                <h3 className="font-bold text-lg mb-4 text-gray-800">🌤️ Current Weather</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="text-gray-700">Temperature</span>
                    <span className="font-bold text-blue-600 text-lg">{weather.weather.temperature}°C</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="text-gray-700">Rainfall</span>
                    <span className="font-bold text-blue-500 text-lg">{weather.weather.rainfall} mm</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="text-gray-700">Condition</span>
                    <span className={`font-bold ${weather.weather.risk === 'HIGH' ? 'text-red-600' : 'text-green-600'}`}>
                      {weather.weather.condition}
                    </span>
                  </div>
                  {weather.weather.risk === 'HIGH' && (
                    <div className="bg-red-100 border border-red-300 rounded p-3">
                      <p className="text-sm text-red-700">⚠️ Heavy rain detected - You may be eligible for a claim!</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* AQI Card */}
              <Card className="border-purple-200">
                <h3 className="font-bold text-lg mb-4 text-gray-800">💨 Air Quality Index</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span className="text-gray-700">AQI Value</span>
                    <span className="font-bold text-purple-600 text-lg">{weather.aqi.value}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span className="text-gray-700">Status</span>
                    <span className={`font-bold ${
                      weather.aqi.risk === 'HIGH' ? 'text-red-600' :
                      weather.aqi.risk === 'MEDIUM' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {weather.aqi.condition}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span className="text-gray-700">Risk Level</span>
                    <span className={`px-3 py-1 rounded text-white font-bold text-sm ${
                      weather.aqi.risk === 'HIGH' ? 'bg-red-500' :
                      weather.aqi.risk === 'MEDIUM' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}>
                      {weather.aqi.risk}
                    </span>
                  </div>
                  {weather.aqi.risk === 'HIGH' && (
                    <div className="bg-red-100 border border-red-300 rounded p-3">
                      <p className="text-sm text-red-700">⚠️ Poor air quality - You may be eligible for a claim!</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      )}

      {/* POLICY TAB */}
      {activeTab === 'policy' && (
        <Card>
          {policy ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded border border-green-200">
                <span className="text-gray-700">Status</span>
                <span className="px-4 py-2 rounded-full bg-green-500 text-white font-bold text-sm">✓ Active</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-gray-600 text-sm mb-1">Premium Amount</p>
                  <p className="text-2xl font-bold text-green-600">₹{policy.premium}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-gray-600 text-sm mb-1">Valid Period</p>
                  <p className="text-lg font-bold text-gray-800">
                    {new Date(policy.startDate).toLocaleDateString()} to {new Date(policy.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-gray-600 text-sm mb-1">Weekly Payout Used</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-blue-600">₹{policy.weeklyPayoutUsed}</p>
                    <p className="text-sm text-gray-600">/ ₹300</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-gray-600 text-sm mb-1">Remaining Budget</p>
                  <p className="text-2xl font-bold text-purple-600">₹{300 - policy.weeklyPayoutUsed}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-600 mb-4 text-lg">No active policy</p>
              <p className="text-gray-500 mb-6">Create a policy to start protecting yourself from environmental disruptions</p>
              <button onClick={handleCreatePolicy} className="btn btn-primary">
                Create Policy Now
              </button>
            </div>
          )}
        </Card>
      )}

      {/* CLAIMS TAB */}
      {activeTab === 'claims' && (
        <Card>
          {claims.length > 0 ? (
            <div className="space-y-3">
              {claims.slice(0, 10).map((claim) => (
                <div key={claim._id} className="border-l-4 border-blue-500 p-4 bg-blue-50 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-800">Claim #{claim._id?.slice(-8)}</p>
                      <p className="text-sm text-gray-600">{new Date(claim.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-white text-xs font-bold ${
                      claim.status === 'APPROVED' ? 'bg-green-500' :
                      claim.status === 'PAID' ? 'bg-blue-500' :
                      claim.status === 'FLAGGED' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Amount</p>
                      <p className="font-bold text-green-600">₹{claim.amount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Fraud Score</p>
                      <p className="font-bold">{claim.fraudScore}/100</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💭</div>
              <p className="text-gray-600">No claims yet</p>
              <p className="text-gray-500 text-sm">Claims will appear here when environmental triggers are detected</p>
            </div>
          )}
        </Card>
      )}

      {/* WITHDRAWALS TAB */}
      {activeTab === 'withdrawals' && (
        <Card>
          {withdrawalHistory.length > 0 ? (
            <div className="space-y-3">
              {withdrawalHistory.map((wr) => (
                <div
                  key={wr._id}
                  className={`border-l-4 p-4 rounded ${
                    wr.status === 'PENDING'
                      ? 'border-yellow-500 bg-yellow-50'
                      : wr.status === 'APPROVED'
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-800">Withdrawal Request #{wr._id?.slice(-8)}</p>
                      <p className="text-sm text-gray-600">{new Date(wr.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-white text-xs font-bold ${
                        wr.status === 'PENDING'
                          ? 'bg-yellow-500'
                          : wr.status === 'APPROVED'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {wr.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Amount</p>
                      <p className="font-bold text-lg">₹{wr.amount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Requested On</p>
                      <p className="font-semibold text-sm">
                        {new Date(wr.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {wr.status === 'APPROVED' && (
                    <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded">
                      <p className="text-xs text-green-700">
                        ✅ Approved on {new Date(wr.approvedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {wr.status === 'REJECTED' && (
                    <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
                      <p className="text-xs text-red-700 font-semibold mb-1">❌ Rejected</p>
                      <p className="text-xs text-red-700">Reason: {wr.rejectionReason}</p>
                    </div>
                  )}
                  {wr.status === 'PENDING' && (
                    <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded">
                      <p className="text-xs text-yellow-700">
                        ⏳ Your request is being reviewed by admin. You'll be notified soon.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💸</div>
              <p className="text-gray-600">No withdrawal requests yet</p>
              <p className="text-gray-500 text-sm">Submit a withdrawal request to see it here</p>
            </div>
          )}
        </Card>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">💸 Withdraw from Wallet</h2>
            <form onSubmit={handleWithdrawalRequest}>
              <div className="mb-4">
                <label className="form-label">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  max={stats.walletBalance || 0}
                  className="input border-2"
                  disabled={withdrawalLoading}
                  required
                />
                <p className="text-xs text-gray-600 mt-1">Available: ₹{stats.walletBalance || 0}</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={withdrawalLoading}
                  className="btn btn-primary flex-1"
                >
                  {withdrawalLoading ? 'Processing...' : 'Withdraw'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawalModal(false)}
                  className="btn bg-gray-300 hover:bg-gray-400 text-gray-800 flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">💳 Add Funds to Wallet</h2>
            <form onSubmit={handlePaymentRequest}>
              <div className="mb-4">
                <label className="form-label">Payment Amount (₹)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                  className="input border-2"
                  disabled={paymentLoading}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="form-label">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input border-2"
                  disabled={paymentLoading}
                >
                  <option value="UPI">🔗 UPI</option>
                  <option value="Credit Card">💳 Credit Card</option>
                  <option value="Debit Card">💳 Debit Card</option>
                  <option value="Net Banking">🏦 Net Banking</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="btn bg-green-500 hover:bg-green-600 text-white flex-1"
                >
                  {paymentLoading ? 'Processing...' : 'Pay Now'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn bg-gray-300 hover:bg-gray-400 text-gray-800 flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
