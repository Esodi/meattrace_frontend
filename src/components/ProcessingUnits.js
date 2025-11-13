import React, { useState, useEffect } from 'react';
import { getProcessingUnits, createProcessingUnit, updateProcessingUnit, deleteProcessingUnit } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdClose, MdSave, MdFactory } from 'react-icons/md';

function ProcessingUnits() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contact_email: '',
    contact_phone: '',
    license_number: '',
    capacity: ''
  });

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const response = await getProcessingUnits();
      setUnits(response.data.results || response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading processing units:', err);
      setError('Failed to load processing units. Please ensure the backend is running and you are authenticated.');
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const unitData = {
        ...formData,
        capacity: parseInt(formData.capacity)
      };

      if (editingUnit) {
        await updateProcessingUnit(editingUnit.id, unitData);
      } else {
        await createProcessingUnit(unitData);
      }
      await loadUnits();
      resetForm();
    } catch (err) {
      console.error('Error saving processing unit:', err);
      setError('Failed to save processing unit');
    }
  };

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      location: unit.location,
      contact_email: unit.contact_email,
      contact_phone: unit.contact_phone,
      license_number: unit.license_number,
      capacity: unit.capacity.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (unitId) => {
    if (window.confirm('Are you sure you want to delete this processing unit?')) {
      try {
        await deleteProcessingUnit(unitId);
        await loadUnits();
      } catch (err) {
        console.error('Error deleting processing unit:', err);
        setError('Failed to delete processing unit');
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
      capacity: ''
    });
    setEditingUnit(null);
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
        <p>Loading processing units...</p>
      </div>
    );
  }

  return (
    <div className="processing-units">
      <motion.div 
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1><MdFactory style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Processing Units Management</h1>
        <motion.button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MdAdd /> Add New Unit
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
          <h2>{editingUnit ? 'Edit Processing Unit' : 'Add New Processing Unit'}</h2>
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
                <label>Capacity (animals/day):</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  required
                  min="1"
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
                <MdSave /> {editingUnit ? 'Update Unit' : 'Create Unit'}
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
        <h2>Processing Units List</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Contact</th>
                <th>License</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit, index) => (
                <motion.tr 
                  key={unit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td>{unit.name}</td>
                  <td>{unit.location}</td>
                  <td>
                    {unit.contact_email}<br/>
                    {unit.contact_phone}
                  </td>
                  <td><span className="license-badge">{unit.license_number}</span></td>
                  <td><strong>{unit.capacity}</strong> animals/day</td>
                  <td>
                    <motion.button 
                      className="btn btn-secondary" 
                      onClick={() => handleEdit(unit)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MdEdit /> Edit
                    </motion.button>
                    <motion.button 
                      className="btn btn-danger" 
                      onClick={() => handleDelete(unit.id)}
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

export default ProcessingUnits;