import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="text-3xl font-bold">🛡️</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">GigShield AI</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">PARAMETRIC INSURANCE</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {isAuthenticated ? (
              <>
                <a
                  href="/dashboard"
                  className={`font-semibold transition-colors ${
                    isActive('/dashboard')
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  📊 Dashboard
                </a>
                <a
                  href="/claims"
                  className={`font-semibold transition-colors ${
                    isActive('/claims')
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  💰 Claims
                </a>
                {user?.role === 'admin' && (
                  <a
                    href="/admin"
                    className={`font-semibold transition-colors ${
                      isActive('/admin')
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-slate-600 hover:text-indigo-600'
                    }`}
                  >
                    ⚙️ Admin Portal
                  </a>
                )}

                {/* User Profile Dropdown */}
                <div className="flex items-center space-x-3 pl-8 border-l border-slate-300">
                  <div className="text-right">
                    <p className="font-bold text-slate-800 text-sm">{user?.phone}</p>
                    <p className="text-xs text-slate-500 font-medium">{user?.city}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="btn btn-danger text-sm"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <a href="/" className="text-slate-600 hover:text-indigo-600 font-semibold transition-colors">
                  Home
                </a>
                <a
                  href="/login"
                  className="text-slate-600 hover:text-indigo-600 font-semibold transition-colors"
                >
                  🔐 Login
                </a>
                <a
                  href="/register"
                  className="btn btn-primary"
                >
                  Register →
                </a>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-2xl"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden pb-4 space-y-3 border-t pt-4">
            {isAuthenticated ? (
              <>
                <a
                  href="/dashboard"
                  className="block px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
                >
                  📊 Dashboard
                </a>
                <a
                  href="/claims"
                  className="block px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
                >
                  💰 Claims
                </a>
                {user?.role === 'admin' && (
                  <a
                    href="/admin"
                    className="block px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
                  >
                    ⚙️ Admin
                  </a>
                )}
                <div className="px-4 py-2 bg-blue-50 rounded">
                  <p className="font-semibold text-gray-800">{user?.phone}</p>
                  <p className="text-sm text-gray-600">{user?.city}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="block px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center"
                >
                  🔐 Login
                </a>
                <a
                  href="/register"
                  className="block px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold text-center"
                >
                  Register →
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
