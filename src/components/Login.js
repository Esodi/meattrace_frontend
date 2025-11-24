import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MdLogin, MdPerson, MdLock } from 'react-icons/md';
import './Login.css';

function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage (support both legacy and nested 'tokens' response)
        const access = (data.tokens && data.tokens.access) || data.access;
        const refresh = (data.tokens && data.tokens.refresh) || data.refresh;
        const user = data.user || data.user_data || null;

        if (access) localStorage.setItem('authToken', access);
        if (refresh) localStorage.setItem('refreshToken', refresh);
        if (user) localStorage.setItem('user', JSON.stringify(user));

        // Call parent callback with normalized payload
        onLogin({ tokens: { access, refresh }, user });
      } else {
        setError(data.detail || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to connect to the server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-header">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <MdLogin className="login-icon" />
          </motion.div>
          <h1>MeatTrace Admin</h1>
          <p>Dashboard Login</p>
        </div>

        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">
              <MdPerson /> Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <MdLock /> Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <motion.button
            type="submit"
            className="btn btn-primary btn-login"
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-block' }}
              >
                ⚙️
              </motion.span>
            ) : (
              <>
                <MdLogin /> Login
              </>
            )}
          </motion.button>
        </form>

        <div className="login-footer">
          <p>Please contact your administrator if you don't have access.</p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
