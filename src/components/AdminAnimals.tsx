import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSearch, MdFilterList, MdPets, MdVisibility, MdRefresh } from 'react-icons/md';
import api from '../services/api';

interface Animal {
    id: number;
    animal_id: string;
    animal_name: string;
    species: string;
    age: number;
    live_weight: number;
    farmer_name: string;
    processing_unit_name: string | null;
    slaughtered: boolean;
    slaughtered_at: string | null;
    transferred_at: string | null;
    lifecycle_status: string;
    has_rejections: boolean;
    has_appeals: boolean;
    created_at: string;
}

function AdminAnimals() {
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadAnimals();
    }, [statusFilter]);

    const loadAnimals = async () => {
        try {
            setLoading(true);
            setError(null);
            let url = '/admin/animals/';
            const params = new URLSearchParams();
            if (statusFilter) {
                params.append('lifecycle_status', statusFilter);
            }
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            const response = await api.get(url);
            setAnimals(response.data.results || response.data || []);
        } catch (err: any) {
            console.error('Error loading animals:', err);
            setError('Failed to load animals. Please ensure you are authenticated.');
            setAnimals([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'HEALTHY': return { bg: '#dcfce7', color: '#166534' };
            case 'SLAUGHTERED': return { bg: '#fee2e2', color: '#991b1b' };
            case 'TRANSFERRED': return { bg: '#dbeafe', color: '#1e40af' };
            case 'SEMI-TRANSFERRED': return { bg: '#fef3c7', color: '#92400e' };
            default: return { bg: '#f3f4f6', color: '#374151' };
        }
    };

    const filteredAnimals = animals.filter(animal =>
        animal.animal_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.animal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.species?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="loading">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', fontSize: '3rem' }}
                >
                    🐄
                </motion.div>
                <p>Loading animals...</p>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <motion.div
                className="header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1><MdPets style={{ verticalAlign: 'middle', marginRight: '8px' }} />Animal Traceability</h1>
                <div className="actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="search-bar" style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--bg-secondary, #f3f4f6)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        gap: '8px'
                    }}>
                        <MdSearch />
                        <input
                            type="text"
                            placeholder="Search ID, name, farmer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                outline: 'none',
                                width: '200px'
                            }}
                        />
                    </div>
                    <motion.button
                        className="btn btn-secondary"
                        onClick={() => setShowFilters(!showFilters)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <MdFilterList /> Filter
                    </motion.button>
                    <motion.button
                        className="btn btn-secondary"
                        onClick={loadAnimals}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <MdRefresh /> Refresh
                    </motion.button>
                </div>
            </motion.div>

            {/* Filter Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        className="card"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ marginBottom: '16px', overflow: 'hidden' }}
                    >
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <label style={{ fontWeight: 500 }}>Status:</label>
                            {['', 'HEALTHY', 'SLAUGHTERED', 'TRANSFERRED', 'SEMI-TRANSFERRED'].map((status) => (
                                <button
                                    key={status || 'all'}
                                    onClick={() => setStatusFilter(status)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        border: statusFilter === status ? '2px solid #6366f1' : '1px solid #e5e7eb',
                                        background: statusFilter === status ? '#eef2ff' : 'white',
                                        cursor: 'pointer',
                                        fontWeight: statusFilter === status ? 600 : 400
                                    }}
                                >
                                    {status || 'All'}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <motion.div
                    className="error-message"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                        padding: '12px 16px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}
                >
                    {error}
                </motion.div>
            )}

            {/* Stats Summary */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                    marginBottom: '16px'
                }}
            >
                {[
                    { label: 'Total Animals', count: animals.length, color: '#6366f1' },
                    { label: 'Healthy', count: animals.filter(a => a.lifecycle_status === 'HEALTHY').length, color: '#10b981' },
                    { label: 'Slaughtered', count: animals.filter(a => a.lifecycle_status === 'SLAUGHTERED').length, color: '#ef4444' },
                    { label: 'Transferred', count: animals.filter(a => a.lifecycle_status === 'TRANSFERRED').length, color: '#3b82f6' }
                ].map((stat) => (
                    <div
                        key={stat.label}
                        style={{
                            background: 'var(--bg-card, white)',
                            padding: '16px',
                            borderRadius: '12px',
                            textAlign: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: stat.color }}>{stat.count}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #6b7280)' }}>{stat.label}</div>
                    </div>
                ))}
            </motion.div>

            <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h2 style={{ marginBottom: '16px' }}>
                    Animals List
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                        ({filteredAnimals.length} {filteredAnimals.length === 1 ? 'animal' : 'animals'})
                    </span>
                </h2>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Animal ID</th>
                                <th>Name</th>
                                <th>Species</th>
                                <th>Status</th>
                                <th>Farmer</th>
                                <th>Location</th>
                                <th>Registered</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAnimals.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                        {searchTerm ? 'No animals match your search' : 'No animals found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredAnimals.map((animal, index) => {
                                    const statusStyle = getStatusColor(animal.lifecycle_status);
                                    return (
                                        <motion.tr
                                            key={animal.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{animal.animal_id}</td>
                                            <td>{animal.animal_name || 'N/A'}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{animal.species}</td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    background: statusStyle.bg,
                                                    color: statusStyle.color
                                                }}>
                                                    {animal.lifecycle_status || 'Unknown'}
                                                </span>
                                                {animal.has_rejections && (
                                                    <span title="Has rejections" style={{ marginLeft: '4px' }}>⚠️</span>
                                                )}
                                                {animal.has_appeals && (
                                                    <span title="Has appeals" style={{ marginLeft: '4px' }}>📝</span>
                                                )}
                                            </td>
                                            <td>{animal.farmer_name || 'N/A'}</td>
                                            <td>{animal.processing_unit_name || 'At Farm'}</td>
                                            <td>{formatDate(animal.created_at)}</td>
                                            <td>
                                                <motion.button
                                                    className="btn btn-sm btn-secondary"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <MdVisibility /> View
                                                </motion.button>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}

export default AdminAnimals;
