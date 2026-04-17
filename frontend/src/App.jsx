import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Claims from './pages/Claims';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ component: Component }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return isAuthenticated ? Component : <Navigate to="/login" />;
};

const AdminRoute = ({ component: Component }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  return Component;
};

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<AdminRoute component={<AdminDashboard />} />} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute component={<Dashboard />} />}
            />
            <Route
              path="/claims"
              element={<ProtectedRoute component={<Claims />} />}
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
