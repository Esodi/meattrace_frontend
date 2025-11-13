import React, { useState, useEffect } from 'react';
import { getShops, createShop, updateShop, deleteShop } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdClose, MdSave, MdStorefront } from 'react-icons/md';

function Shops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contact_email: '',
    contact_phone: '',
    license_number: '',
    business_type: 'retail'
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingShop) {
        await updateShop(editingShop.id, formData);
      } else {
        await createShop(formData);
      }
      await loadShops();
      resetForm();
    } catch (err) {
      console.error('Error saving shop:', err);
      setError('Failed to save shop');
    }
  };

  const handleEdit = (shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      location: shop.location,
      contact_email: shop.contact_email,
      contact_phone: shop.contact_phone,
      license_number: shop.license_number,
      business_type: shop.business_type
    });
    setShowForm(true);
  };

  const handleDelete = async (shopId) => {
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
      location: '',
      contact_email: '',
      contact_phone: '',
      license_number: '',
      business_type: 'retail'
    });
    setEditingShop(null);
    setShowForm(false);
  };

  const handleInputChange = (e) => {
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
            transition={{ type: 'spring', damping: 20 }}
          >
          <h2>{editingShop ? 'Edit Shop' : 'Add New Shop'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location:</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Contact Email:</label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contact Phone:</label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>License Number:</label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Business Type:</label>
                <select
                  name="business_type"
                  value={formData.business_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="supermarket">Supermarket</option>
                </select>
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
                <th>Type</th>
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
                >
                  <td>{shop.name}</td>
                  <td>{shop.location}</td>
                  <td>
                    {shop.contact_email}<br/>
                    {shop.contact_phone}
                  </td>
                  <td><span className="license-badge">{shop.license_number}</span></td>
                  <td><span className={`role-badge role-${shop.business_type}`}>{shop.business_type}</span></td>
                  <td>
                    <motion.button 
                      className="btn btn-secondary" 
                      onClick={() => handleEdit(shop)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
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
    </div>
  );
}

export default Shops;