import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import ProcessingUnits from './components/ProcessingUnits';
import Shops from './components/Shops';
import AdminAnimals from './components/AdminAnimals';
import AdminProducts from './components/AdminProducts';
import AdminSlaughterParts from './components/AdminSlaughterParts';
import ComplianceManagement from './components/ComplianceManagement';
import Certifications from './components/Certifications';
import SupplyChainMonitor from './components/SupplyChainMonitor';
import ApprovalWorkflows from './components/ApprovalWorkflows';
import GovernmentReports from './components/GovernmentReports';
import Navigation from './components/Navigation';

import { User } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (data: { user: User }) => {
    setIsAuthenticated(true);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app">
        <Navigation user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/processing-units" element={<ProcessingUnits />} />
            <Route path="/shops" element={<Shops />} />
            <Route path="/animals" element={<AdminAnimals />} />
            <Route path="/products" element={<AdminProducts />} />
            <Route path="/slaughter-parts" element={<AdminSlaughterParts />} />
            <Route path="/compliance" element={<ComplianceManagement />} />
            <Route path="/certifications" element={<Certifications />} />
            <Route path="/supply-chain" element={<SupplyChainMonitor />} />
            <Route path="/approvals" element={<ApprovalWorkflows />} />
            <Route path="/reports" element={<GovernmentReports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;