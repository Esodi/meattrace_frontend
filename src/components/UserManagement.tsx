import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, getProcessingUnits, getShops } from '../services/api';
import { translateRole } from '../services/translate';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdClose, MdSave } from 'react-icons/md';

import { User } from '../types';

interface ProcessingUnit {
  id: number;
  name: string;
  location: string;
}

interface Shop {
  id: number;
  name: string;
  location: string;
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'Farmer',
    phone: '',
    address: '',
    processing_unit_id: '' as number | '',
    shop_id: '' as number | ''
  });
  const [processingUnits, setProcessingUnits] = useState<ProcessingUnit[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loadingPUs, setLoadingPUs] = useState(false);
  const [loadingShops, setLoadingShops] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      setUsers(response.data.results || response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please ensure the backend is running and you are authenticated.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProcessingUnits = async () => {
    setLoadingPUs(true);
    try {
      const response = await getProcessingUnits();
      setProcessingUnits(response.data.results || response.data || []);
    } catch (err) {
      console.error('Error loading processing units:', err);
    } finally {
      setLoadingPUs(false);
    }
  };

  const loadShops = async () => {
    setLoadingShops(true);
    try {
      const response = await getShops();
      setShops(response.data.results || response.data || []);
    } catch (err) {
      console.error('Error loading shops:', err);
    } finally {
      setLoadingShops(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // For update, only send password if it's set
        const updateData = { ...formData };
        if (!updateData.password) {
          delete (updateData as any).password;
        }
        // Only send processing_unit_id if role is Processor
        if (updateData.role !== 'Processor') {
          delete (updateData as any).processing_unit_id;
        } else if (updateData.processing_unit_id) {
          (updateData as any).processing_unit_id = Number(updateData.processing_unit_id);
        }
        // Only send shop_id if role is ShopOwner
        if (updateData.role !== 'ShopOwner') {
          delete (updateData as any).shop_id;
        } else if (updateData.shop_id) {
          (updateData as any).shop_id = Number(updateData.shop_id);
        }
        await updateUser(editingUser.id, updateData);
      } else {
        // For create, password is required
        if (!formData.password) {
          setError('Password is required for new users');
          return;
        }
        const createData = { ...formData };
        // Only send processing_unit_id if role is Processor
        if (createData.role !== 'Processor') {
          delete (createData as any).processing_unit_id;
        } else if (createData.processing_unit_id) {
          (createData as any).processing_unit_id = Number(createData.processing_unit_id);
        }
        // Only send shop_id if role is ShopOwner
        if (createData.role !== 'ShopOwner') {
          delete (createData as any).shop_id;
        } else if (createData.shop_id) {
          (createData as any).shop_id = Number(createData.shop_id);
        }
        await createUser(createData);
      }
      await loadUsers();
      resetForm();
    } catch (err: any) {
      console.error('Error saving user:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Failed to save user';
      setError(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '', // Don't populate password for editing
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.profile_role || user.role || 'Farmer',
      phone: (user as any).profile_phone || '',
      address: (user as any).profile_address || '',
      processing_unit_id: (user as any).profile_processing_unit_id || '',
      shop_id: (user as any).profile_shop_id || ''
    });
    setShowForm(true);
    // Load associated data if roles require it
    const userRole = user.profile_role || user.role;
    if (userRole === 'Processor') {
      loadProcessingUnits();
    } else if (userRole === 'ShopOwner') {
      loadShops();
    }
  };

  const handleDelete = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        await loadUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'Farmer',
      phone: '',
      address: '',
      processing_unit_id: '',
      shop_id: ''
    });
    setEditingUser(null);
    setShowForm(false);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // If role changed, load associated data
    if (name === 'role') {
      if (value === 'Processor') {
        loadProcessingUnits();
      } else if (value === 'ShopOwner') {
        loadShops();
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
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <motion.div
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>User Management</h1>
        <motion.button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MdAdd /> Add New User
        </motion.button>
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

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring' as const, damping: 20 }}
          >
            <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Username:</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Password:{!editingUser && <span style={{ color: '#dc2626' }}>*</span>}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                    required={!editingUser}
                  />
                </div>
                <div className="form-group">
                  <label>Role:</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Farmer">Abattoir</option>
                    <option value="Processor">Processor</option>
                    <option value="ShopOwner">Shop Owner</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              {formData.role === 'Processor' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Assigned Processing Unit:</label>
                    <select
                      name="processing_unit_id"
                      value={formData.processing_unit_id}
                      onChange={handleInputChange}
                      required={formData.role === 'Processor'}
                      disabled={loadingPUs}
                    >
                      <option value="">Select a processing unit...</option>
                      {processingUnits.map(pu => (
                        <option key={pu.id} value={pu.id}>
                          {pu.name} ({pu.location})
                        </option>
                      ))}
                    </select>
                    {loadingPUs && <span style={{ fontSize: '12px', color: '#666' }}>Loading facilities...</span>}
                    {processingUnits.length === 0 && !loadingPUs && (
                      <span style={{ fontSize: '12px', color: '#dc2626' }}>No processing units found. Create one first.</span>
                    )}
                  </div>
                </div>
              )}

              {formData.role === 'ShopOwner' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Assigned Shop:</label>
                    <select
                      name="shop_id"
                      value={formData.shop_id}
                      onChange={handleInputChange}
                      required={formData.role === 'ShopOwner'}
                      disabled={loadingShops}
                    >
                      <option value="">Select a shop...</option>
                      {shops.map(shop => (
                        <option key={shop.id} value={shop.id}>
                          {shop.name} ({shop.location})
                        </option>
                      ))}
                    </select>
                    {loadingShops && <span style={{ fontSize: '12px', color: '#666' }}>Loading shops...</span>}
                    {shops.length === 0 && !loadingShops && (
                      <span style={{ fontSize: '12px', color: '#dc2626' }}>No shops found. Create one first.</span>
                    )}
                  </div>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>First Name:</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name:</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone:</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+255..."
                  />
                </div>
                <div className="form-group">
                  <label>
                    Location/Address:
                    <span style={{ fontSize: '11px', color: '#666', marginLeft: '4px' }}>
                      (for map display)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g., Morogoro, Tanzania"
                  />
                </div>
              </div>
              <div className="form-actions">
                <motion.button
                  type="submit"
                  className="btn btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MdSave /> {editingUser ? 'Update User' : 'Create User'}
                </motion.button>
                <motion.button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MdClose /> Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2>Users List</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>
                    <span className={`role-badge role-${(user.profile_role || user.role || 'unknown').toLowerCase().replace(/\s+/g, '-')}`}>
                      {translateRole((user.profile_role || user.role || 'Unknown').replace(/_/g, ' '))}
                    </span>
                  </td>
                  <td>
                    <motion.button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(user)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MdEdit /> Edit
                    </motion.button>
                    <motion.button
                      className="btn btn-danger"
                      onClick={() => handleDelete(user.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MdDelete /> Delete
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

export default UserManagement;