import React, { useState, useEffect } from 'react';
import { getProcessingUnits, createProcessingUnit, updateProcessingUnit, deleteProcessingUnit } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdClose, MdSave, MdFactory, MdVisibility } from 'react-icons/md';
import ProcessingUnitDetail from './ProcessingUnitDetail';

import { ProcessingUnit } from '../types';

function ProcessingUnits() {
  const [units, setUnits] = useState<ProcessingUnit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingUnit, setEditingUnit] = useState<ProcessingUnit | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    contact_email: '',
    contact_phone: '',
    license_number: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUnit) {
        await updateProcessingUnit(editingUnit.id, formData);
      } else {
        await createProcessingUnit(formData);
      }
      await loadUnits();
      resetForm();
    } catch (err: any) {
      console.error('Error saving processing unit:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.name?.[0] || err.response?.data?.error || 'Failed to save processing unit';
      setError(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
    }
  };

  const handleEdit = (unit: ProcessingUnit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      description: (unit as any).description || '',
      location: unit.location || '',
      contact_email: unit.contact_email || '',
      contact_phone: unit.contact_phone || '',
      license_number: unit.license_number || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (unitId: number) => {
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
      description: '',
      location: '',
      contact_email: '',
      contact_phone: '',
      license_number: ''
    });
    setEditingUnit(null);
    setShowForm(false);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            transition={{ type: 'spring' as const, damping: 20 }}
          >
            <h2>{editingUnit ? 'Edit Processing Unit' : 'Add New Processing Unit'}</h2>
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
                    placeholder="e.g., Dar es Salaam, Tanzania"
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
                  placeholder="Brief description of the processing unit"
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
              <div className="form-group">
                <label>License Number:</label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                />
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
                <th>Status</th>
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
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedUnitId(unit.id)}
                >
                  <td style={{ fontWeight: 500 }}>{unit.name}</td>
                  <td>{unit.location}</td>
                  <td>
                    {unit.contact_email}<br />
                    {unit.contact_phone}
                  </td>
                  <td><span className="license-badge">{unit.license_number || 'N/A'}</span></td>
                  <td>
                    <span className={`role-badge ${(unit as any).is_active !== false ? 'role-admin' : 'role-farmer'}`}>
                      {(unit as any).is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <motion.button
                      className="btn btn-secondary"
                      onClick={() => setSelectedUnitId(unit.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ marginRight: '4px' }}
                    >
                      <MdVisibility /> View
                    </motion.button>
                    <motion.button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(unit)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ marginRight: '4px' }}
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

      {/* Detail Modal */}
      {selectedUnitId && (
        <ProcessingUnitDetail
          unitId={selectedUnitId}
          onClose={() => setSelectedUnitId(null)}
        />
      )}
    </div>
  );
}

export default ProcessingUnits;