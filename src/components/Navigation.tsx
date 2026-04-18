import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MdDashboard, MdPeople, MdFactory, MdStorefront, MdLogout, MdAccountCircle, MdPets, MdInventory, MdAssignment, MdVerified, MdMap, MdPendingActions, MdTrendingUp, MdMenu, MdClose, MdContentCut, MdAssessment, MdDeleteSweep } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import './Navigation.css';

import { NavigationProps } from '../types';
import { getRegistrationApplications } from '../services/api';

function Navigation({ user, onLogout }: NavigationProps) {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Poll for pending approvals count every 30 seconds
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await getRegistrationApplications();
        const pending = response.data.filter((app: any) => app.status === 'pending').length;
        setPendingCount(pending);
      } catch (err) {
        // Silently fail - badge just won't update
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <MdClose /> : <MdMenu />}
      </button>

      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${mobileMenuOpen ? 'visible' : ''}`}
        onClick={closeMobileMenu}
      />

      {/* Sidebar */}
      <nav className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>MeatTrace</h2>
          <p>Admin Dashboard</p>
        </div>

        {user && (
          <div className="user-info">
            <MdAccountCircle className="user-avatar" />
            <div className="user-details">
              <p className="user-name">{user.username || user.first_name || 'Admin'}</p>
              <p className="user-role">{user.role || 'Administrator'}</p>
            </div>
          </div>
        )}

        <ul className="sidebar-menu">
          <li className={location.pathname === '/' ? 'active' : ''}>
            <Link to="/" onClick={closeMobileMenu}>
              <span className="icon"><MdDashboard /></span>
              Dashboard
            </Link>
          </li>

          <li className={location.pathname === '/supply-chain' ? 'active' : ''}>
            <Link to="/supply-chain" onClick={closeMobileMenu}>
              <span className="icon"><MdMap /></span>
              Supply Chain
            </Link>
          </li>

          <li className="menu-section-label">Entity Management</li>

          <li className={location.pathname === '/users' ? 'active' : ''}>
            <Link to="/users" onClick={closeMobileMenu}>
              <span className="icon"><MdPeople /></span>
              Users
            </Link>
          </li>
          <li className={location.pathname === '/processing-units' ? 'active' : ''}>
            <Link to="/processing-units" onClick={closeMobileMenu}>
              <span className="icon"><MdFactory /></span>
              Processing Units
            </Link>
          </li>
          <li className={location.pathname === '/shops' ? 'active' : ''}>
            <Link to="/shops" onClick={closeMobileMenu}>
              <span className="icon"><MdStorefront /></span>
              Shops
            </Link>
          </li>
          <li className={location.pathname === '/animals' ? 'active' : ''}>
            <Link to="/animals" onClick={closeMobileMenu}>
              <span className="icon"><MdPets /></span>
              Animals
            </Link>
          </li>
          <li className={location.pathname === '/products' ? 'active' : ''}>
            <Link to="/products" onClick={closeMobileMenu}>
              <span className="icon"><MdInventory /></span>
              Products
            </Link>
          </li>
          <li className={location.pathname === '/slaughter-parts' ? 'active' : ''}>
            <Link to="/slaughter-parts" onClick={closeMobileMenu}>
              <span className="icon"><MdContentCut /></span>
              Slaughter Parts
            </Link>
          </li>
          <li className={location.pathname === '/waste' ? 'active' : ''}>
            <Link to="/waste" onClick={closeMobileMenu}>
              <span className="icon"><MdDeleteSweep /></span>
              Waste Tracking
            </Link>
          </li>

          <li className={location.pathname === '/reports' ? 'active' : ''}>
            <Link to="/reports" onClick={closeMobileMenu}>
              <span className="icon"><MdTrendingUp /></span>
              Standard Reports
            </Link>
          </li>
          <li className={location.pathname === '/reports/custom' ? 'active' : ''}>
            <Link to="/reports/custom" onClick={closeMobileMenu}>
              <span className="icon"><MdAssessment /></span>
              Custom Reports
            </Link>
          </li>
        </ul>

        <ul className="sidebar-menu">
          <li className="menu-section-label">Approvals</li>
          <li className={location.pathname === '/approvals' ? 'active' : ''}>
            <Link to="/approvals" onClick={closeMobileMenu}>
              <span className="icon"><MdPendingActions /></span>
              Requests
              {pendingCount > 0 && (
                <span className="notification-badge">{pendingCount}</span>
              )}
            </Link>
          </li>
        </ul>

        <ul className="sidebar-menu">
          <li className="menu-section-label">Compliance</li>

          <li className={location.pathname === '/compliance' ? 'active' : ''}>
            <Link to="/compliance" onClick={closeMobileMenu}>
              <span className="icon"><MdAssignment /></span>
              Audits
            </Link>
          </li>
          <li className={location.pathname === '/certifications' ? 'active' : ''}>
            <Link to="/certifications" onClick={closeMobileMenu}>
              <span className="icon"><MdVerified /></span>
              Certifications
            </Link>
          </li>
        </ul>

        <div className="sidebar-footer">
          <motion.button
            className="btn-logout"
            onClick={onLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MdLogout /> Logout
          </motion.button>
        </div>
      </nav>
    </>
  );
}

export default Navigation;