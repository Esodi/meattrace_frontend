import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import SimpleBarChart from './SimpleBarChart';
import { motion } from 'framer-motion';
import { 
  MdPeople, 
  MdFactory, 
  MdStorefront, 
  MdPets, 
  MdInventory, 
  MdShoppingCart 
} from 'react-icons/md';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    total_processing_units: 0,
    total_shops: 0,
    total_animals: 0,
    total_products: 0,
    total_sales: 0,
    total_orders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Failed to load dashboard data. Please ensure the backend is running and you are authenticated.');
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { 
      icon: <MdPeople />, 
      value: stats.total_users, 
      label: 'Total Users',
      color: '#6366f1'
    },
    { 
      icon: <MdFactory />, 
      value: stats.total_processing_units, 
      label: 'Processing Units',
      color: '#8b5cf6'
    },
    { 
      icon: <MdStorefront />, 
      value: stats.total_shops, 
      label: 'Shops',
      color: '#ec4899'
    },
    { 
      icon: <MdPets />, 
      value: stats.total_animals, 
      label: 'Animals Tracked',
      color: '#10b981'
    },
    { 
      icon: <MdInventory />, 
      value: stats.total_products, 
      label: 'Products',
      color: '#f59e0b'
    },
    { 
      icon: <MdShoppingCart />, 
      value: stats.total_orders || stats.total_sales, 
      label: 'Orders',
      color: '#3b82f6'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'inline-block', fontSize: '3rem' }}
        >
          ⚙️
        </motion.div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <motion.div 
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Dashboard Overview</h1>
      </motion.div>

      {error && (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {error}
        </motion.div>
      )}

      <motion.div 
        className="metrics-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            className="metric-card stagger-item"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="metric-icon" style={{ color: metric.color }}>
              {metric.icon}
            </div>
            <motion.div 
              className="metric-value"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1, type: 'spring' }}
            >
              {metric.value}
            </motion.div>
            <div className="metric-label">{metric.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="charts-section">
        <motion.div 
          className="chart-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2>System Overview</h2>
          <p className="chart-note">Note: Charts will display analytics data when backend analytics endpoint is connected.</p>
          {/* Chart data will be fetched from backend analytics API */}
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;