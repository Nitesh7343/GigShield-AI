import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, weatherAPI } from '../services/api';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [wallets, setWallets] = useState(null);
  const [users, setUsers] = useState([]);
  const [claims, setClaims] = useState([]);
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');
  const [triggerForm, setTriggerForm] = useState({ type: 'RAIN', city: '', value: 0 });
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [payoutModal, setPayoutModal] = useState({ open: false, userId: null, userName: '', amount: '', reason: '' });
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [claimSearchQuery, setClaimSearchQuery] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState('ALL');
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalSearchQuery, setWithdrawalSearchQuery] = useState('');
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState('ALL');
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [rejectionReasonModal, setRejectionReasonModal] = useState({ open: false, reason: '', requestId: null });
  const [rejectionReasonLoading, setRejectionReasonLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      setStats(response.data);
      setMessage('');
    } catch (error) {
      setMessage('Failed to fetch admin stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await adminAPI.getDetailedUsers();
      setUsers(response.data.users || []);
      if (response.data.users?.length === 0) {
        setMessage('ℹ️ No users found in the system. Users will appear here after they register.');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage(`❌ Error fetching users: ${error.response?.data?.message || error.message}`);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchClaims = async () => {
    try {
      setClaimsLoading(true);
      const response = await adminAPI.getClaims();
      setClaims(response.data.claims || []);
      if (response.data.claims?.length === 0) {
        setMessage('ℹ️ No claims found. Claims will appear here after triggers are created.');
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
      setMessage(`❌ Error fetching claims: ${error.response?.data?.message || error.message}`);
    } finally {
      setClaimsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await adminAPI.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setMessage(`❌ Error fetching analytics: ${error.response?.data?.message || error.message}`);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchWallets = async () => {
    try {
      setWalletsLoading(true);
      const response = await adminAPI.getWallets();
      setWallets(response.data);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      setMessage(`❌ Error fetching wallets: ${error.response?.data?.message || error.message}`);
    } finally {
      setWalletsLoading(false);
    }
  };

  const fetchWeatherData = async () => {
    try {
      setWeatherLoading(true);
      const response = await weatherAPI.getAllCitiesWeather();
      console.log('Weather response:', response.data);
      setWeatherData(response.data.cities || []);
    } catch (error) {
      console.error('Error fetching weather:', error);
      setMessage(`❌ Error fetching weather: ${error.response?.data?.message || error.message}`);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchWithdrawalRequests = async () => {
    try {
      setWithdrawalLoading(true);
      const response = await adminAPI.getWithdrawalRequests();
      setWithdrawalRequests(response.data.withdrawalRequests || []);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      setMessage(`❌ Error fetching withdrawal requests: ${error.response?.data?.message || error.message}`);
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const handleApproveWithdrawal = async (requestId) => {
    try {
      const response = await adminAPI.approveWithdrawal(requestId);
      setMessage(`✅ ${response.data.message}`);
      setTimeout(() => {
        fetchWithdrawalRequests();
        setMessage('');
      }, 2000);
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.message || 'Failed to approve withdrawal'}`);
    }
  };

  const handleOpenRejectModal = (requestId) => {
    setRejectionReasonModal({ open: true, reason: '', requestId });
  };

  const handleRejectWithdrawal = async (e) => {
    e.preventDefault();
    if (!rejectionReasonModal.reason.trim()) {
      setMessage('❌ Please enter a rejection reason');
      return;
    }

    try {
      setRejectionReasonLoading(true);
      const response = await adminAPI.rejectWithdrawal(rejectionReasonModal.requestId, {
        rejectionReason: rejectionReasonModal.reason
      });
      setMessage(`✅ ${response.data.message}`);
      setRejectionReasonModal({ open: false, reason: '', requestId: null });

      setTimeout(() => {
        fetchWithdrawalRequests();
        setMessage('');
      }, 2000);
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.message || 'Failed to reject withdrawal'}`);
    } finally {
      setRejectionReasonLoading(false);
    }
  };


  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'analytics' && !analytics) {
      fetchAnalytics();
    }
    if (tab === 'wallets' && !wallets) {
      fetchWallets();
    }
    if (tab === 'users' && users.length === 0) {
      fetchUsers();
    }
    if (tab === 'claims' && claims.length === 0) {
      fetchClaims();
    }
    if (tab === 'weather' && weatherData.length === 0) {
      fetchWeatherData();
    }
    if (tab === 'withdrawals' && withdrawalRequests.length === 0) {
      fetchWithdrawalRequests();
    }
  };

  const handleTriggerChange = (e) => {
    const { name, value } = e.target;
    setTriggerForm({
      ...triggerForm,
      [name]: name === 'value' ? parseFloat(value) : value
    });
  };

  const handleCreateTrigger = async (e) => {
    e.preventDefault();
    if (!triggerForm.city || triggerForm.value <= 0) {
      setMessage('Please fill all fields correctly');
      return;
    }

    try {
      setTriggerLoading(true);
      await adminAPI.createTrigger(triggerForm);
      setMessage(`✅ ${triggerForm.type} trigger created for ${triggerForm.city}!`);
      setTriggerForm({ type: 'RAIN', city: '', value: 0 });
      
      // Refresh stats
      setTimeout(() => fetchStats(), 1000);
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.message || 'Failed to create trigger'}`);
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleOpenPayoutModal = (user) => {
    setPayoutModal({ open: true, userId: user._id, userName: user.phone, amount: '', reason: '' });
  };

  const handlePayoutChange = (e) => {
    const { name, value } = e.target;
    setPayoutModal({
      ...payoutModal,
      [name]: name === 'amount' ? (value ? parseFloat(value) : '') : value
    });
  };

  const handleCreatePayout = async (e) => {
    e.preventDefault();
    if (!payoutModal.amount || payoutModal.amount <= 0) {
      setMessage('❌ Please enter a valid amount');
      return;
    }

    try {
      setPayoutLoading(true);
      await adminAPI.createManualPayout({
        userId: payoutModal.userId,
        amount: payoutModal.amount,
        reason: payoutModal.reason || 'Manual admin payout'
      });
      setMessage(`✅ Manual payout of ₹${payoutModal.amount} created for ${payoutModal.userName}!`);
      setPayoutModal({ open: false, userId: null, userName: '', amount: '', reason: '' });
      
      // Refresh users and claims
      setTimeout(() => {
        fetchUsers();
        fetchClaims();
      }, 1000);
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.message || 'Failed to create payout'}`);
    } finally {
      setPayoutLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="btn btn-secondary"
        >
          Logout
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin text-4xl">🔄</div>
        </div>
      ) : (
        <div>
          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b border-gray-300 flex-wrap">
            <button
              onClick={() => handleTabChange('stats')}
              className={`px-4 py-2 font-semibold ${activeTab === 'stats' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              📊 Statistics
            </button>
            <button
              onClick={() => handleTabChange('analytics')}
              className={`px-4 py-2 font-semibold ${activeTab === 'analytics' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              💹 Analytics
            </button>
            <button
              onClick={() => handleTabChange('weather')}
              className={`px-4 py-2 font-semibold ${activeTab === 'weather' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              🌤️ Weather & AQI
            </button>
            <button
              onClick={() => handleTabChange('wallets')}
              className={`px-4 py-2 font-semibold ${activeTab === 'wallets' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              💳 Wallets
            </button>
            <button
              onClick={() => handleTabChange('users')}
              className={`px-4 py-2 font-semibold ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              👥 All Users
            </button>
            <button
              onClick={() => handleTabChange('claims')}
              className={`px-4 py-2 font-semibold ${activeTab === 'claims' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              💰 Claims & Payouts
            </button>
            <button
              onClick={() => handleTabChange('withdrawals')}
              className={`px-4 py-2 font-semibold ${activeTab === 'withdrawals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              💸 Withdrawals
            </button>
          </div>

          {/* STATS TAB */}
          {activeTab === 'stats' && stats && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card title="Total Users" className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.claimStats?.totalUsers || 0}
                  </p>
                </Card>
                <Card title="Total Claims" className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {stats.claimStats?.totalClaims || 0}
                  </p>
                </Card>
                <Card title="Approved Claims" className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">
                    {stats.claimStats?.approvedClaims || 0}
                  </p>
                </Card>
                <Card title="Flagged Claims" className="text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {stats.claimStats?.flaggedClaims || 0}
                  </p>
                </Card>
              </div>

              {/* Financial Stats */}
              <Card title="Financial Overview" className="mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-600">Total Payouts</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{stats.claimStats?.totalPayouts || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">In Wallets</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{stats.walletStats?.totalWalletBalance || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg Wallet/User</p>
                    <p className="text-2xl font-bold">
                      ₹{Math.round((stats.walletStats?.totalWalletBalance || 0) / (stats.walletStats?.totalUsers || 1))}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Weekly Cap/User</p>
                    <p className="text-2xl font-bold">
                      ₹{stats.payoutStats?.maxWeeklyCapPerUser || 300}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Recent Triggers */}
              <Card title="Recent Environmental Triggers">
                {stats.recentTriggers?.length > 0 ? (
                  <div className="space-y-2">
                    {stats.recentTriggers.slice(0, 10).map((trigger) => (
                      <div key={trigger._id} className="border-l-4 border-orange-500 pl-4 py-2">
                        <p>
                          <strong>{trigger.type}</strong> in {trigger.city}
                        </p>
                        <p className="text-gray-600">Value: {trigger.value}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(trigger.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No triggers yet</p>
                )}
              </Card>

              {/* Manual Trigger Form */}
              <Card title="🔧 Create Manual Trigger" className="mb-8">
                <form onSubmit={handleCreateTrigger} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="form-label">Event Type</label>
                      <select
                        name="type"
                        value={triggerForm.type}
                        onChange={handleTriggerChange}
                        className="input"
                      >
                        <option value="RAIN">🌧️ Heavy Rain</option>
                        <option value="AQI">😷 Poor Air Quality</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        name="city"
                        value={triggerForm.city}
                        onChange={handleTriggerChange}
                        placeholder="e.g., Mumbai"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="form-label">
                        {triggerForm.type === 'RAIN' ? 'Rainfall (mm)' : 'AQI Value'}
                      </label>
                      <input
                        type="number"
                        name="value"
                        value={triggerForm.value}
                        onChange={handleTriggerChange}
                        placeholder={triggerForm.type === 'RAIN' ? '50' : '300'}
                        min="0"
                        className="input"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={triggerLoading}
                        className="btn btn-primary w-full"
                      >
                        {triggerLoading ? 'Creating...' : 'Create Trigger'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    💡 RAIN: &gt;50mm = high, &gt;75mm = critical | AQI: &gt;300 = high, &gt;400 = critical
                  </p>
                </form>
              </Card>
            </>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <>
              {analyticsLoading ? (
                <Card>
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading analytics...</p>
                  </div>
                </Card>
              ) : analytics ? (
                <>
                  {/* Total Funds Raised Card */}
                  <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
                    <div className="text-center">
                      <p className="text-gray-600 text-sm mb-2">TOTAL FUNDS RAISED</p>
                      <p className="text-5xl font-bold text-green-600">₹{analytics.totalFundsRaised?.toLocaleString()}</p>
                      <p className="text-gray-600 text-sm mt-2">Across {analytics.claimsBreakdown?.APPROVED + analytics.claimsBreakdown?.PAID + analytics.claimsBreakdown?.FLAGGED || 0} processed claims</p>
                    </div>
                  </Card>

                  {/* Fund Breakdown */}
                  <Card title="Funds by Status" className="mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-green-50 p-4 rounded">
                        <p className="text-gray-600 text-sm">✅ Paid</p>
                        <p className="text-2xl font-bold text-green-600">₹{analytics.fundByStatus?.paid?.toLocaleString() || 0}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded">
                        <p className="text-gray-600 text-sm">⏳ Approved</p>
                        <p className="text-2xl font-bold text-blue-600">₹{analytics.fundByStatus?.approved?.toLocaleString() || 0}</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded">
                        <p className="text-gray-600 text-sm">⚠️ Flagged</p>
                        <p className="text-2xl font-bold text-yellow-600">₹{analytics.fundByStatus?.flagged?.toLocaleString() || 0}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded">
                        <p className="text-gray-600 text-sm">❌ Rejected</p>
                        <p className="text-2xl font-bold text-red-600">₹{analytics.fundByStatus?.rejected?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Claims Overview */}
                  <Card title="Claims Overview" className="mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Total Claims</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {Object.values(analytics.claimsBreakdown || {}).reduce((a, b) => a + b, 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Users Benefited</p>
                        <p className="text-3xl font-bold text-green-600">{analytics.usersWithPayouts}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Avg Payout/User</p>
                        <p className="text-3xl font-bold text-purple-600">₹{analytics.avgPayoutPerUser?.toLocaleString() || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Success Rate</p>
                        <p className="text-3xl font-bold text-indigo-600">
                          {analytics.claimsBreakdown?.APPROVED + analytics.claimsBreakdown?.PAID > 0
                            ? Math.round(((analytics.claimsBreakdown?.APPROVED + analytics.claimsBreakdown?.PAID) / 
                                (Object.values(analytics.claimsBreakdown || {}).reduce((a, b) => a + b, 0))) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Top Cities */}
                  {analytics.claimsByCity && analytics.claimsByCity.length > 0 && (
                    <Card title="Top Performing Cities" className="mb-8">
                      <div className="space-y-3">
                        {analytics.claimsByCity.map((city, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <p className="font-semibold">{city._id || 'Unknown'}</p>
                              <p className="text-sm text-gray-600">{city.claims} claims</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">₹{city.payout?.toLocaleString() || 0}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Recent Trends */}
                  {analytics.monthlyTrends && analytics.monthlyTrends.length > 0 && (
                    <Card title="Last 30 Days Activity">
                      <div className="space-y-2">
                        {analytics.monthlyTrends.slice(-7).map((day, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 border-b">
                            <div>
                              <p className="text-sm font-semibold">{day._id}</p>
                              <p className="text-xs text-gray-600">{day.claims} claims</p>
                            </div>
                            <p className="font-bold">₹{day.payout?.toLocaleString() || 0}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <div className="text-center py-8 bg-blue-50 rounded">
                    <p className="text-gray-600">📊 No analytics data available yet</p>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* WEATHER TAB */}
          {activeTab === 'weather' && (
            <>
              {weatherLoading ? (
                <Card>
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading weather data...</p>
                  </div>
                </Card>
              ) : weatherData && weatherData.length > 0 ? (
                <>
                  <Card title="🌤️ Real-time Weather & Air Quality Monitoring" className="mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {weatherData.map((city, idx) => (
                        <div key={idx} className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                          <h3 className="text-lg font-bold mb-4 text-gray-800">{city.city}</h3>

                          {/* Weather Section */}
                          <div className="mb-4 pb-4 border-b">
                            <p className="text-sm text-gray-600 mb-2">🌡️ Weather</p>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-700">Temperature:</span>
                                <span className="font-bold text-blue-600">{city.weather.temperature}°C</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Rainfall:</span>
                                <span className="font-bold text-blue-500">{city.weather.rainfall} mm</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700">Condition:</span>
                                <span className={`font-bold ${
                                  city.weather.risk === 'HIGH' ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {city.weather.condition}
                                </span>
                              </div>
                              {city.weather.risk === 'HIGH' && (
                                <div className="bg-red-100 border border-red-300 rounded p-2 mt-2">
                                  <p className="text-xs text-red-700">⚠️ Heavy rain - Trigger eligible</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* AQI Section */}
                          <div>
                            <p className="text-sm text-gray-600 mb-2">💨 Air Quality</p>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-700">AQI Value:</span>
                                <span className="font-bold text-purple-600">{city.aqi.value}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700">Status:</span>
                                <span className={`font-bold ${
                                  city.aqi.risk === 'HIGH' ? 'text-red-600' :
                                  city.aqi.risk === 'MEDIUM' ? 'text-yellow-600' :
                                  'text-green-600'
                                }`}>
                                  {city.aqi.condition}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Risk:</span>
                                <span className={`px-2 py-1 rounded text-white text-xs font-bold ${
                                  city.aqi.risk === 'HIGH' ? 'bg-red-500' :
                                  city.aqi.risk === 'MEDIUM' ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}>
                                  {city.aqi.risk}
                                </span>
                              </div>
                              {city.aqi.risk === 'HIGH' && (
                                <div className="bg-red-100 border border-red-300 rounded p-2 mt-2">
                                  <p className="text-xs text-red-700">⚠️ Poor AQI - Trigger eligible</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Weather Summary */}
                  <Card title="📈 Weather Summary">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded text-center">
                        <p className="text-gray-600 text-sm">🌧️ High Rain Events</p>
                        <p className="text-2xl font-bold text-red-600">
                          {weatherData.filter(c => c.weather.risk === 'HIGH').length}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded text-center">
                        <p className="text-gray-600 text-sm">😷 High AQI Events</p>
                        <p className="text-2xl font-bold text-red-600">
                          {weatherData.filter(c => c.aqi.risk === 'HIGH').length}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded text-center">
                        <p className="text-gray-600 text-sm">✓ Safe Cities</p>
                        <p className="text-2xl font-bold text-green-600">
                          {weatherData.filter(c => c.weather.risk === 'LOW' && c.aqi.risk === 'LOW').length}
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded text-center">
                        <p className="text-gray-600 text-sm">Last Updated</p>
                        <p className="text-sm font-bold text-gray-700">
                          {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <Card>
                  <div className="text-center py-8 bg-blue-50 rounded">
                    <p className="text-gray-600">🌤️ No weather data available yet</p>
                  </div>
                </Card>
              )}
            </>
          )}
          {activeTab === 'wallets' && (
            <>
              {walletsLoading ? (
                <Card>
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading wallets...</p>
                  </div>
                </Card>
              ) : wallets ? (
                <>
                  {/* Total Wallet Balance Card */}
                  <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                    <div className="text-center">
                      <p className="text-gray-600 text-sm mb-2">TOTAL WALLET BALANCE</p>
                      <p className="text-5xl font-bold text-blue-600">₹{wallets.totalWalletBalance?.toLocaleString()}</p>
                      <p className="text-gray-600 text-sm mt-2">Across {wallets.totalUsers} users</p>
                    </div>
                  </Card>

                  {/* Wallet Stats */}
                  <Card title="Wallet Statistics" className="mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded text-center">
                        <p className="text-gray-600 text-sm mb-2">Total Users</p>
                        <p className="text-3xl font-bold text-blue-600">{wallets.totalUsers}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded text-center">
                        <p className="text-gray-600 text-sm mb-2">Active Wallets</p>
                        <p className="text-3xl font-bold text-green-600">{wallets.usersWithWallet}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded text-center">
                        <p className="text-gray-600 text-sm mb-2">Average Balance</p>
                        <p className="text-3xl font-bold text-purple-600">₹{wallets.averageWalletBalance?.toLocaleString() || 0}</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded text-center">
                        <p className="text-gray-600 text-sm mb-2">Penetration</p>
                        <p className="text-3xl font-bold text-orange-600">
                          {wallets.totalUsers > 0 ? Math.round((wallets.usersWithWallet / wallets.totalUsers) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* User Wallets Table */}
                  <Card title="User Wallet Details">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b">
                          <tr>
                            <th className="text-left p-3">Phone</th>
                            <th className="text-left p-3">City</th>
                            <th className="text-right p-3">Wallet Balance</th>
                            <th className="text-right p-3">Weekly Income</th>
                            <th className="text-center p-3">Risk Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wallets.users?.map((user, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-semibold">{user.phone}</td>
                              <td className="p-3">{user.city}</td>
                              <td className="p-3 text-right font-bold text-blue-600">₹{user.walletBalance?.toLocaleString() || 0}</td>
                              <td className="p-3 text-right">₹{user.avgWeeklyIncome?.toLocaleString() || 0}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                                  user.riskScore < 30 ? 'bg-green-500' : 
                                  user.riskScore < 60 ? 'bg-yellow-500' : 
                                  'bg-red-500'
                                }`}>
                                  {user.riskScore}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(!wallets.users || wallets.users.length === 0) && (
                        <div className="text-center py-8 text-gray-600">
                          No users found
                        </div>
                      )}
                    </div>
                  </Card>
                </>
              ) : (
                <Card>
                  <div className="text-center py-8 bg-blue-50 rounded">
                    <p className="text-gray-600">💳 No wallet data available yet</p>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <Card title="All Users & Payout History">
              <div className="mb-4 flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="🔍 Search by phone number or city..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value.toLowerCase())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => setUserSearchQuery('')}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold"
                >
                  ✕ Clear
                </button>
              </div>

              {usersLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading users...</p>
                </div>
              ) : users.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Showing {users.filter(u => u.phone?.includes(userSearchQuery) || u.city?.toLowerCase().includes(userSearchQuery)).length} of {users.length} users
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Phone</th>
                          <th className="px-4 py-2 text-left">City</th>
                          <th className="px-4 py-2 text-right">Weekly Income</th>
                          <th className="px-4 py-2 text-center">Total Claims</th>
                          <th className="px-4 py-2 text-center">Approved</th>
                          <th className="px-4 py-2 text-center">Flagged</th>
                          <th className="px-4 py-2 text-center">Rejected</th>
                          <th className="px-4 py-2 text-right">Total Payout</th>
                          <th className="px-4 py-2 text-left">Last Claim</th>
                          <th className="px-4 py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.phone?.includes(userSearchQuery) || u.city?.toLowerCase().includes(userSearchQuery)).map((user) => (
                          <tr key={user._id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-semibold">{user.phone}</td>
                            <td className="px-4 py-2">{user.city}</td>
                            <td className="px-4 py-2 text-right">₹{user.avgWeeklyIncome}</td>
                            <td className="px-4 py-2 text-center bg-blue-50">{user.totalClaims}</td>
                            <td className="px-4 py-2 text-center bg-green-50">{user.approvedClaims}</td>
                            <td className="px-4 py-2 text-center bg-yellow-50">{user.flaggedClaims}</td>
                            <td className="px-4 py-2 text-center bg-red-50">{user.rejectedClaims}</td>
                            <td className="px-4 py-2 text-right font-bold text-green-600">
                              ₹{user.totalPayoutTriggered}
                            </td>
                            <td className="px-4 py-2 text-xs">
                              {user.lastClaimDate ? new Date(user.lastClaimDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => handleOpenPayoutModal(user)}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                              >
                                💰 Payout
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 bg-blue-50 rounded">
                  <p className="text-gray-600 mb-2">📭 No users found</p>
                  <p className="text-sm text-gray-500">Users will appear here after they register at /register</p>
                </div>
              )}
            </Card>
          )}

          {/* CLAIMS TAB */}
          {activeTab === 'claims' && (
            <Card title="All Claims & Payouts">
              <div className="mb-4 flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="🔍 Search by phone, city, or event..."
                  value={claimSearchQuery}
                  onChange={(e) => setClaimSearchQuery(e.target.value.toLowerCase())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
                <select
                  value={claimStatusFilter}
                  onChange={(e) => setClaimStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">📋 All Status</option>
                  <option value="APPROVED">✅ Approved</option>
                  <option value="PAID">🏦 Paid</option>
                  <option value="FLAGGED">⚠️ Flagged</option>
                  <option value="REJECTED">❌ Rejected</option>
                </select>
                <button
                  onClick={() => {
                    setClaimSearchQuery('');
                    setClaimStatusFilter('ALL');
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold"
                >
                  ✕ Clear
                </button>
              </div>

              {claimsLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading claims...</p>
                </div>
              ) : claims.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Showing {claims.filter(c =>
                      (c.userId?.phone?.includes(claimSearchQuery) ||
                       c.triggerId?.city?.toLowerCase().includes(claimSearchQuery) ||
                       c.triggerId?.type?.toLowerCase().includes(claimSearchQuery)) &&
                      (claimStatusFilter === 'ALL' || c.status === claimStatusFilter)
                    ).length} of {claims.length} claims
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">User Phone</th>
                          <th className="px-4 py-2 text-left">Event</th>
                          <th className="px-4 py-2 text-left">City</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-center">Status</th>
                          <th className="px-4 py-2 text-right">Fraud Score</th>
                          <th className="px-4 py-2 text-left">Fraud Reasons</th>
                          <th className="px-4 py-2 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {claims
                          .filter(c =>
                            (c.userId?.phone?.includes(claimSearchQuery) ||
                             c.triggerId?.city?.toLowerCase().includes(claimSearchQuery) ||
                             c.triggerId?.type?.toLowerCase().includes(claimSearchQuery)) &&
                            (claimStatusFilter === 'ALL' || c.status === claimStatusFilter)
                          )
                          .map((claim) => (
                          <tr key={claim._id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-semibold">{claim.userId?.phone || 'N/A'}</td>
                            <td className="px-4 py-2">{claim.triggerId?.type || 'N/A'}</td>
                            <td className="px-4 py-2">{claim.triggerId?.city || 'N/A'}</td>
                            <td className="px-4 py-2 text-right font-bold">₹{claim.amount}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                                claim.status === 'APPROVED' ? 'bg-green-500' :
                                claim.status === 'PAID' ? 'bg-blue-500' :
                                claim.status === 'FLAGGED' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}>
                                {claim.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right">{claim.fraudScore}/100</td>
                            <td className="px-4 py-2 text-xs">
                              {claim.fraudReasons?.length > 0 ? (
                                <ul className="list-disc pl-4">
                                  {claim.fraudReasons.map((reason, idx) => (
                                    <li key={idx}>{reason}</li>
                                  ))}
                                </ul>
                              ) : (
                                'None'
                              )}
                            </td>
                            <td className="px-4 py-2 text-xs">
                              {new Date(claim.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 bg-blue-50 rounded">
                  <p className="text-gray-600 mb-2">📭 No claims found</p>
                  <p className="text-sm text-gray-500">Create a manual trigger first to generate claims</p>
                </div>
              )}
            </Card>
          )}

          {/* WITHDRAWALS TAB */}
          {activeTab === 'withdrawals' && (
            <Card title="Withdrawal Requests Management">
              <div className="mb-4 flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="🔍 Search by phone number..."
                  value={withdrawalSearchQuery}
                  onChange={(e) => setWithdrawalSearchQuery(e.target.value.toLowerCase())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
                <select
                  value={withdrawalStatusFilter}
                  onChange={(e) => setWithdrawalStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">📋 All Status</option>
                  <option value="PENDING">⏳ Pending</option>
                  <option value="APPROVED">✅ Approved</option>
                  <option value="REJECTED">❌ Rejected</option>
                </select>
                <button
                  onClick={() => {
                    setWithdrawalSearchQuery('');
                    setWithdrawalStatusFilter('ALL');
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold"
                >
                  ✕ Clear
                </button>
              </div>

              {withdrawalLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading withdrawal requests...</p>
                </div>
              ) : withdrawalRequests.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Showing {withdrawalRequests.filter(wr =>
                      wr.userId?.phone?.includes(withdrawalSearchQuery) &&
                      (withdrawalStatusFilter === 'ALL' || wr.status === withdrawalStatusFilter)
                    ).length} of {withdrawalRequests.length} withdrawal requests
                  </p>
                  <div className="space-y-3">
                    {withdrawalRequests
                      .filter(wr =>
                        wr.userId?.phone?.includes(withdrawalSearchQuery) &&
                        (withdrawalStatusFilter === 'ALL' || wr.status === withdrawalStatusFilter)
                      )
                      .map((wr) => (
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
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-gray-800">
                              {wr.userId?.phone} - ₹{wr.amount}
                            </p>
                            <p className="text-sm text-gray-600">
                              From: {wr.userId?.city} | Weekly Income: ₹{wr.userId?.avgWeeklyIncome}
                            </p>
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

                        <div className="text-xs text-gray-600 mb-3">
                          Requested: {new Date(wr.createdAt).toLocaleString()}
                        </div>

                        {wr.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveWithdrawal(wr._id)}
                              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded transition text-sm"
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(wr._id)}
                              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded transition text-sm"
                            >
                              ❌ Reject
                            </button>
                          </div>
                        )}

                        {wr.status === 'APPROVED' && (
                          <div className="p-2 bg-green-100 border border-green-300 rounded">
                            <p className="text-xs text-green-700">
                              ✅ Approved on {new Date(wr.approvedAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {wr.status === 'REJECTED' && (
                          <div className="p-2 bg-red-100 border border-red-300 rounded">
                            <p className="text-xs text-red-700 font-semibold mb-1">❌ Rejected</p>
                            <p className="text-xs text-red-700">Reason: {wr.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 bg-blue-50 rounded">
                  <p className="text-gray-600 mb-2">📭 No withdrawal requests</p>
                  <p className="text-sm text-gray-500">Withdrawal requests will appear here</p>
                </div>
              )}
            </Card>
          )}

          {/* REJECTION REASON MODAL */}
          {rejectionReasonModal.open && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">❌ Reject Withdrawal Request</h3>
                <form onSubmit={handleRejectWithdrawal}>
                  <div className="mb-4">
                    <label className="form-label">Rejection Reason *</label>
                    <textarea
                      value={rejectionReasonModal.reason}
                      onChange={(e) =>
                        setRejectionReasonModal({
                          ...rejectionReasonModal,
                          reason: e.target.value
                        })
                      }
                      placeholder="e.g., Suspicious activity detected, Account verification pending, etc."
                      className="input border-2 h-24"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={rejectionReasonLoading}
                      className="btn bg-red-500 hover:bg-red-600 text-white flex-1"
                    >
                      {rejectionReasonLoading ? 'Rejecting...' : 'Reject Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRejectionReasonModal({ open: false, reason: '', requestId: null })
                      }
                      className="btn bg-gray-300 hover:bg-gray-400 text-gray-800 flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* MANUAL PAYOUT MODAL */}
          {payoutModal.open && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">💰 Manual Payout</h3>
                  <button
                    onClick={() => setPayoutModal({ open: false, userId: null, userName: '', amount: '', reason: '' })}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleCreatePayout} className="space-y-4">
                  <div>
                    <label className="form-label">User</label>
                    <input
                      type="text"
                      value={payoutModal.userName}
                      disabled
                      className="input bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="form-label">Amount (₹)</label>
                    <input
                      type="number"
                      name="amount"
                      value={payoutModal.amount}
                      onChange={handlePayoutChange}
                      placeholder="e.g., 100"
                      min="1"
                      step="1"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Reason (Optional)</label>
                    <input
                      type="text"
                      name="reason"
                      value={payoutModal.reason}
                      onChange={handlePayoutChange}
                      placeholder="e.g., Emergency assistance"
                      className="input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={payoutLoading}
                      className="btn btn-primary flex-1"
                    >
                      {payoutLoading ? 'Processing...' : 'Create Payout'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutModal({ open: false, userId: null, userName: '', amount: '', reason: '' })}
                      className="btn btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
