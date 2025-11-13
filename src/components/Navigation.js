import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MdDashboard, MdPeople, MdFactory, MdStorefront, MdLogout, MdAccountCircle } from 'react-icons/md';
import { motion } from 'framer-motion';
import './Navigation.css';

function Navigation({ user, onLogout }) {
  const location = useLocation();

  return (
    <nav className="sidebar">
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
          <Link to="/">
            <span className="icon"><MdDashboard /></span>
            Dashboard
          </Link>
        </li>
        <li className={location.pathname === '/users' ? 'active' : ''}>
          <Link to="/users">
            <span className="icon"><MdPeople /></span>
            Users
          </Link>
        </li>
        <li className={location.pathname === '/processing-units' ? 'active' : ''}>
          <Link to="/processing-units">
            <span className="icon"><MdFactory /></span>
            Processing Units
          </Link>
        </li>
        <li className={location.pathname === '/shops' ? 'active' : ''}>
          <Link to="/shops">
            <span className="icon"><MdStorefront /></span>
            Shops
          </Link>
        </li>
      </ul>

      <div className="sidebar-footer">
        <motion.button 
          className="btn-logout"
          onClick={onLogout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MdLogout /> Logout
        </motion.button>
      </div>
    </nav>
  );
}

export default Navigation;