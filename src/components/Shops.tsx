import React, { useState, useEffect } from 'react';
import { getShops, createShop, updateShop, deleteShop } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdClose, MdSave, MdStorefront, MdVisibility } from 'react-icons/md';
import ShopDetail from './ShopDetail';

import { Shop } from '../types';

function Shops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    contact_email: '',
    contact_phone: '',
    business_license: '',
    tax_id: ''
  });

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      const response = await getShops();
      setShops(response.data.results || response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading shops:', err);
      setError('Failed to load shops. Please ensure the backend is running and you are authenticated.');
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingShop) {
        await updateShop(editingShop.id, formData);
      } else {
        await createShop(formData);
      }
      await loadShops();
      resetForm();
    } catch (err: any) {
      console.error('Error saving shop:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.name?.[0] || err.response?.data?.error || 'Failed to save shop';
      setError(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
    }
  };

  const handleEdit = (shop: Shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      description: (shop as any).description || '',
      location: shop.location || '',
      contact_email: shop.contact_email || '',
      contact_phone: shop.contact_phone || '',
      business_license: (shop as any).business_license || '',
      tax_id: (shop as any).tax_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (shopId: number) => {
    if (window.confirm('Are you sure you want to delete this shop?')) {
      try {
        await deleteShop(shopId);
        await loadShops();
      } catch (err) {
        console.error('Error deleting shop:', err);
        setError('Failed to delete shop');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      contact_email: '',
      contact_phone: '',
      business_license: '',
      tax_id: ''
    });
    setEditingShop(null);
    setShowForm(false);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
        <p>Loading shops...</p>
      </div>
    );
  }

  return (
    <div className="shops">
      <motion.div
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ flexWrap: 'wrap', height: 'auto' }}
      >
        <h1><MdStorefront style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Shops Management</h1>
        <motion.button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MdAdd /> Add New Shop
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
            <h2>{editingShop ? 'Edit Shop' : 'Add New Shop'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name:<span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Location:<span style={{ color: '#dc2626' }}>*</span>
                    <span style={{ fontSize: '11px', color: '#666', marginLeft: '4px' }}>(for map display)</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Arusha, Tanzania"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description:</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the shop"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Email:</label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone:</label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    placeholder="+255..."
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Business License:</label>
                  <input
                    type="text"
                    name="business_license"
                    value={formData.business_license}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Tax ID:</label>
                  <input
                    type="text"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleInputChange}
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
                  <MdSave /> {editingShop ? 'Update Shop' : 'Create Shop'}
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
        <h2>Shops List</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Contact</th>
                <th>License</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop, index) => (
                <motion.tr
                  key={shop.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedShopId(shop.id)}
                >
                  <td style={{ fontWeight: 500 }}>{shop.name}</td>
                  <td>{shop.location}</td>
                  <td>
                    {shop.contact_email}<br />
                    {shop.contact_phone}
                  </td>
                  <td><span className="license-badge">{(shop as any).business_license || 'N/A'}</span></td>
                  <td>
                    <span className={`role-badge ${(shop as any).is_active !== false ? 'role-admin' : 'role-farmer'}`}>
                      {(shop as any).is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <motion.button
                      className="btn btn-secondary"
                      onClick={() => setSelectedShopId(shop.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ marginRight: '4px' }}
                    >
                      <MdVisibility /> View
                    </motion.button>
                    <motion.button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(shop)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ marginRight: '4px' }}
                    >
                      <MdEdit /> Edit
                    </motion.button>
                    <motion.button
                      className="btn btn-danger"
                      onClick={() => handleDelete(shop.id)}
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

      {/* Detail Modal */}
      {selectedShopId && (
        <ShopDetail
          shopId={selectedShopId}
          onClose={() => setSelectedShopId(null)}
        />
      )}
    </div>
  );
}

export default Shops;