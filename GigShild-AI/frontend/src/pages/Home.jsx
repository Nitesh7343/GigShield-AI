import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">GigShield AI</h1>
          <p className="text-xl mb-8">
            Parametric Insurance for Gig Workers
          </p>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Automated income protection based on environmental disruptions. Get paid automatically when weather or air quality impacts your work.
          </p>

          {!isAuthenticated && (
            <div className="flex justify-center space-x-4">
              <Link to="/login" className="btn btn-secondary px-8 py-3 text-lg">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary px-8 py-3 text-lg">
                Get Started
              </Link>
            </div>
          )}

          {isAuthenticated && (
            <Link to="/dashboard" className="btn btn-secondary px-8 py-3 text-lg">
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-bold mb-2">Sign Up & Create Policy</h3>
              <p>Register with your phone, city, and weekly income. We calculate your risk score and premium.</p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">🌧️</div>
              <h3 className="text-xl font-bold mb-2">Environmental Monitoring</h3>
              <p>We continuously monitor weather and air quality in your city using real-time APIs.</p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">Automatic Payouts</h3>
              <p>When disruptions are detected, claims are automatically generated and payouts processed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why GigShield AI?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex space-x-4">
              <div className="text-3xl">✓</div>
              <div>
                <h4 className="font-bold mb-2">No Manual Claims</h4>
                <p>Everything is automated. No paperwork, no waiting for approval.</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="text-3xl">✓</div>
              <div>
                <h4 className="font-bold mb-2">Fair Pricing</h4>
                <p>Premium based on your risk profile and location, not on claims history.</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="text-3xl">✓</div>
              <div>
                <h4 className="font-bold mb-2">Real-Time Monitoring</h4>
                <p>Events are detected instantly and claims are processed within minutes.</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="text-3xl">✓</div>
              <div>
                <h4 className="font-bold mb-2">Fraud Prevention</h4>
                <p>Our AI engine validates each claim to prevent fraudulent payouts.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Protect Your Income?</h2>
          <p className="text-lg mb-8">Join thousands of gig workers already using GigShield AI</p>
          {!isAuthenticated && (
            <Link to="/register" className="btn bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-bold">
              Sign Up Now
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
