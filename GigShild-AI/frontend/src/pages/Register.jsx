import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1); // Step 1: Basic, Step 2: Income & Password
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('Delhi');
  const [avgWeeklyIncome, setAvgWeeklyIncome] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setError('');

    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!avgWeeklyIncome || avgWeeklyIncome < 5000) {
      setError('Weekly income must be at least ₹5000');
      return;
    }

    setLoading(true);

    try {
      await register(phone, password, city, parseInt(avgWeeklyIncome));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 text-white">
          <div className="text-5xl mb-2">🛡️</div>
          <h1 className="text-4xl font-bold mb-2">GigShield AI</h1>
          <p className="text-blue-100">Join thousands of gig workers</p>
        </div>

        <Card className="shadow-2xl border-0">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}>
                2
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Contact Info</span>
              <span>Profile Setup</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
              <p className="font-semibold">❌ {error}</p>
            </div>
          )}

          {/* STEP 1: Phone & City */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit}>
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Your Account</h2>

              <div className="form-group">
                <label className="form-label">📱 Phone Number</label>
                <input
                  type="tel"
                  className="input border-2 focus:border-blue-600"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  maxLength="10"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">10-digit mobile number</p>
              </div>

              <div className="form-group">
                <label className="form-label">🏙️ City</label>
                <select
                  className="input border-2 focus:border-blue-600"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full text-lg font-semibold py-3 mb-4"
              >
                ✓ Next
              </button>

              <div className="text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
                    Login Here
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* STEP 2: Income & Password */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit}>
              <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Almost There!</h2>
              <p className="text-center text-gray-600 text-sm mb-6">Complete your profile to get insured</p>

              <div className="form-group">
                <label className="form-label">💰 Average Weekly Income</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-600 font-semibold">₹</span>
                  <input
                    type="number"
                    className="input border-2 focus:border-blue-600 pl-8"
                    value={avgWeeklyIncome}
                    onChange={(e) => setAvgWeeklyIncome(e.target.value)}
                    placeholder="15000"
                    min="5000"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum ₹5,000 per week required</p>
              </div>

              <div className="form-group">
                <label className="form-label">🔒 Password</label>
                <input
                  type="password"
                  className="input border-2 focus:border-blue-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a strong password"
                  minLength="6"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">🔒 Confirm Password</label>
                <input
                  type="password"
                  className="input border-2 focus:border-blue-600"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  minLength="6"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="btn bg-gray-300 hover:bg-gray-400 text-gray-800 flex-1"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1 text-lg font-semibold py-3"
                >
                  {loading ? '⏳ Registering...' : '✓ Register'}
                </button>
              </div>
            </form>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center text-white mt-6 text-sm">
          <p>💡 Free insurance for gig workers | Instant payouts</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
