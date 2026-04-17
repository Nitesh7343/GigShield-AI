import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdminTab, setIsAdminTab] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(phone, password);
      if (data.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 text-white">
          <div className="text-6xl mb-4 hover-lift inline-block cursor-default">🛡️</div>
          <h1 className="text-4xl font-bold mb-2">GigShield AI</h1>
          <p className="text-indigo-200">Parametric Insurance for Gig Workers</p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-2xl">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border-l-4 border-red-500 text-red-100 p-4 mb-6 rounded glass">
              <p className="font-semibold">❌ {error}</p>
            </div>
          )}

          <div className="flex mb-6 bg-white/10 rounded-lg p-1 border border-white/20">
            <button
              onClick={() => setIsAdminTab(false)}
              className={`flex-1 py-2 font-semibold rounded-md transition-all ${
                !isAdminTab ? 'bg-indigo-500 text-white shadow-md' : 'text-indigo-200 hover:text-white'
              }`}
            >
              User Login
            </button>
            <button
              onClick={() => {
                setIsAdminTab(true);
                setPhone('0000000000'); // Auto-fill hint
                setPassword('admin123');
              }}
              className={`flex-1 py-2 font-semibold rounded-md transition-all ${
                isAdminTab ? 'bg-indigo-500 text-white shadow-md' : 'text-indigo-200 hover:text-white'
              }`}
            >
              Admin Login
            </button>
          </div>

          <form onSubmit={handleLogin}>
            <h2 className="text-2xl font-bold mb-6 text-center text-white">
              {isAdminTab ? 'Admin Portal' : 'Welcome Back'}
            </h2>

            <div className="form-group">
              <label className="form-label text-indigo-100">📱 Phone Number</label>
              <input
                type="tel"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-indigo-300/50 transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div className="form-group mb-8">
              <label className="form-label text-indigo-100">🔒 Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-indigo-300/50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-lg font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {loading ? '🔄 Logging in...' : 'Sign In →'}
            </button>

            {!isAdminTab && (
              <div className="text-center">
                <p className="text-indigo-200">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-white hover:text-indigo-300 font-semibold underline decoration-2 underline-offset-4 transition-colors">
                    Register Now
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-indigo-200 mt-8 text-sm">
          <p>Protecting gig workers from environmental disruptions</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
