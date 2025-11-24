import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  MdPeople, MdTrendingUp, MdAttachMoney, MdSpeed,
  MdCheckCircle, MdWarning, MdPets, MdInventory,
  MdShoppingCart
} from 'react-icons/md';
import './Analytics.css';

// API imports
import { getAnalytics } from '../services/api';

function Analytics() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch analytics data
      const response = await getAnalytics(period);

      if (response.data) {
        setAnalyticsData(response.data);

        // Generate daily stats for chart (mock data for now, will be replaced with real API call)
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const mockDailyStats = generateMockDailyStats(days);
        setDailyStats(mockDailyStats);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Generate mock daily stats (replace with actual API call later)
  const generateMockDailyStats = (days) => {
    const stats = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      stats.push({
        date: date.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 50) + 10,
        animals: Math.floor(Math.random() * 100) + 20,
        products: Math.floor(Math.random() * 80) + 15,
        sales: Math.floor(Math.random() * 200) + 50,
        orders: Math.floor(Math.random() * 150) + 30,
      });
    }

    return stats;
  };

  const overviewMetrics = analyticsData ? [
    {
      icon: <MdPeople />,
      label: 'New Users',
      value: analyticsData.new_users_count || 0,
      change: '+12%',
      color: '#6366f1',
      trend: 'up'
    },
    {
      icon: <MdTrendingUp />,
      label: 'Active Users',
      value: analyticsData.active_users_count || 0,
      change: '+8%',
      color: '#8b5cf6',
      trend: 'up'
    },
    {
      icon: <MdPets />,
      label: 'New Animals',
      value: analyticsData.new_animals_count || 0,
      change: '+15%',
      color: '#10b981',
      trend: 'up'
    },
    {
      icon: <MdInventory />,
      label: 'New Products',
      value: analyticsData.new_products_count || 0,
      change: '+10%',
      color: '#f59e0b',
      trend: 'up'
    },
    {
      icon: <MdShoppingCart />,
      label: 'Orders',
      value: analyticsData.new_orders_count || 0,
      change: '+18%',
      color: '#3b82f6',
      trend: 'up'
    },
    {
      icon: <MdAttachMoney />,
      label: 'Total Sales',
      value: `TZS ${(analyticsData.total_sales_value || 0).toLocaleString()}`,
      change: '+22%',
      color: '#ec4899',
      trend: 'up'
    },
    {
      icon: <MdSpeed />,
      label: 'Processing Efficiency',
      value: `${analyticsData.processing_efficiency || 0}%`,
      change: '+3%',
      color: '#14b8a6',
      trend: 'up'
    },
    {
      icon: <MdCheckCircle />,
      label: 'System Uptime',
      value: `${analyticsData.system_uptime || 0}%`,
      change: '+0.2%',
      color: '#22c55e',
      trend: 'up'
    },
  ] : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'inline-block', fontSize: '3rem' }}
        >
          📊
        </motion.div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics">
      <motion.div
        className="analytics-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Analytics Dashboard</h1>
        <div className="period-selector">
          {['7d', '30d', '90d'].map((p) => (
            <motion.button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </motion.button>
          ))}
        </div>
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

      {/* Overview Metrics */}
      <motion.div
        className="metrics-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {overviewMetrics.map((metric, index) => (
          <motion.div
            key={index}
            className="analytics-metric-card"
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <div className="metric-icon" style={{ color: metric.color }}>
              {metric.icon}
            </div>
            <div className="metric-content">
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value">{metric.value}</div>
              <div className={`metric-change ${metric.trend}`}>
                {metric.change}
                <span className="trend-arrow">
                  {metric.trend === 'up' ? '↑' : '↓'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Daily Activity Chart */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2>Daily Activity Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyStats}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAnimals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                stroke="#fff"
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis stroke="#fff" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 46, 0.95)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorUsers)"
                name="Users"
              />
              <Area
                type="monotone"
                dataKey="animals"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorAnimals)"
                name="Animals"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Sales & Orders Chart */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2>Sales & Orders Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                stroke="#fff"
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis stroke="#fff" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 46, 0.95)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Bar dataKey="sales" fill="#ec4899" name="Sales" radius={[8, 8, 0, 0]} />
              <Bar dataKey="orders" fill="#3b82f6" name="Orders" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Product Activity Chart */}
        <motion.div
          className="chart-card full-width"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2>Product & Inventory Tracking</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                stroke="#fff"
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis stroke="#fff" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 46, 0.95)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Line
                type="monotone"
                dataKey="products"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 4 }}
                name="Products"
              />
              <Line
                type="monotone"
                dataKey="animals"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
                name="Animals"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Performance Insights */}
      {analyticsData && (
        <motion.div
          className="insights-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2>Performance Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon" style={{ color: '#14b8a6' }}>
                <MdSpeed />
              </div>
              <div className="insight-content">
                <h3>Processing Efficiency</h3>
                <div className="insight-value">{analyticsData.processing_efficiency}%</div>
                <p>System is performing optimally</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon" style={{ color: '#22c55e' }}>
                <MdCheckCircle />
              </div>
              <div className="insight-content">
                <h3>Transfer Success Rate</h3>
                <div className="insight-value">{analyticsData.transfer_success_rate}%</div>
                <p>High reliability across transfers</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon" style={{ color: '#ec4899' }}>
                <MdAttachMoney />
              </div>
              <div className="insight-content">
                <h3>Average Order Value</h3>
                <div className="insight-value">TZS {analyticsData.average_order_value}</div>
                <p>Per order average revenue</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon" style={{ color: '#f59e0b' }}>
                <MdWarning />
              </div>
              <div className="insight-content">
                <h3>Error Rate</h3>
                <div className="insight-value">{analyticsData.error_rate}%</div>
                <p>System errors are minimal</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default Analytics;
