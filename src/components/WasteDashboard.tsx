import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  MdDeleteSweep, MdSearch, MdFilterList, MdRefresh, 
  MdTrendingDown, MdAssignment, MdLocationOn
} from 'react-icons/md';
import { wasteService } from '../services/wasteService';
import { Waste } from '../types';
import './Dashboard.css';
import './Analytics.css';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

function WasteDashboard() {
  const [wasteRecords, setWasteRecords] = useState<Waste[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  useEffect(() => {
    loadWasteData();
  }, []);

  const loadWasteData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await wasteService.getWasteRecords();
      setWasteRecords(response.data);
    } catch (err) {
      console.error('Error loading waste data:', err);
      setError('Failed to load waste records. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = wasteRecords.filter(record => {
    const matchesSearch = 
      (record.animal_id_tag?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (record.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (record.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesType = typeFilter === '' || record.waste_type === typeFilter;
    const matchesStage = stageFilter === '' || record.stage === stageFilter;

    return matchesSearch && matchesType && matchesStage;
  });

  // Calculate summary stats
  const totalWeight = filteredRecords.reduce((sum, r) => sum + Number(r.weight_kg), 0);
  
  const wasteByType = filteredRecords.reduce((acc: any, curr) => {
    acc[curr.waste_type] = (acc[curr.waste_type] || 0) + Number(curr.weight_kg);
    return acc;
  }, {});

  const wasteByStage = filteredRecords.reduce((acc: any, curr) => {
    acc[curr.stage] = (acc[curr.stage] || 0) + Number(curr.weight_kg);
    return acc;
  }, {});

  const typeData = Object.keys(wasteByType).map(key => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    weight: Number(wasteByType[key].toFixed(2))
  }));

  const stageData = Object.keys(wasteByStage).map(key => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    weight: Number(wasteByStage[key].toFixed(2))
  }));

  if (loading && wasteRecords.length === 0) {
    return (
      <div className="analytics-container">
        <div className="loading-state">Loading waste tracking data...</div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <div>
          <h1>Waste Tracking</h1>
          <p>Monitor and manage loss across the supply chain</p>
        </div>
        <div className="analytics-actions">
          <button className="btn-refresh" onClick={loadWasteData}>
            <MdRefresh /> Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="error-message">
          <MdDeleteSweep /> {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="metrics-grid">
        <motion.div 
          className="metric-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="metric-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <MdDeleteSweep />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Waste</span>
            <span className="metric-value">{totalWeight.toFixed(2)} kg</span>
          </div>
        </motion.div>

        <motion.div 
          className="metric-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <MdTrendingDown />
          </div>
          <div className="metric-info">
            <span className="metric-label">Records</span>
            <span className="metric-value">{filteredRecords.length}</span>
          </div>
        </motion.div>

        <motion.div 
          className="metric-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <MdAssignment />
          </div>
          <div className="metric-info">
            <span className="metric-label">Avg. per Record</span>
            <span className="metric-value">
              {filteredRecords.length > 0 ? (totalWeight / filteredRecords.length).toFixed(2) : 0} kg
            </span>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Waste by Type (kg)</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="weight" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Waste by Stage (kg)</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="weight"
                >
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table and Filters */}
      <div className="table-card" style={{ marginTop: '2rem' }}>
        <div className="admin-actions" style={{ padding: '1rem', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
            <MdSearch />
            <input 
              type="text" 
              placeholder="Search by animal tag, product..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="evisceration">Evisceration</option>
            <option value="processing">Processing</option>
            <option value="rejection">Rejection</option>
            <option value="trimming">Trimming</option>
            <option value="spoilage">Spoilage</option>
            <option value="other">Other</option>
          </select>
          <select 
            className="filter-select"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="">All Stages</option>
            <option value="abbatoir">Abbatoir</option>
            <option value="processing_unit">Processing Unit</option>
            <option value="shop">Shop</option>
          </select>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Stage</th>
                <th>Weight (kg)</th>
                <th>Source</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{new Date(record.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${record.waste_type}`}>
                        {record.waste_type}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MdLocationOn style={{ color: '#9ca3af' }} />
                        {record.stage}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{record.weight_kg}</td>
                    <td>
                      {record.animal_id_tag || record.product_name || record.slaughter_part_type || 'System'}
                      {record.auto_generated && (
                        <span style={{ fontSize: '0.7rem', backgroundColor: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>Auto</span>
                      )}
                    </td>
                    <td>{record.recorded_by_name || 'System'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    No waste records found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default WasteDashboard;
