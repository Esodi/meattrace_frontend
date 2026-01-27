import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSearch, MdFilterList, MdPets, MdVisibility, MdRefresh, MdAdd, MdClose, MdEdit, MdDelete } from 'react-icons/md';
import { createAnimal, updateAnimal, deleteAnimal, getAbbatoirs, getProcessingUnits } from '../services/api';
import api from '../services/api';

interface Animal {
    id: number;
    animal_id: string;
    animal_name: string;
    species: string;
    breed?: string;
    age: number;
    gender?: string;
    live_weight: number;
    notes?: string;
    abbatoir: number;
    abbatoir_name: string;
    transferred_to?: number;
    processing_unit_name: string | null;
    slaughtered: boolean;
    slaughtered_at: string | null;
    transferred_at: string | null;
    lifecycle_status: string;
    has_rejections: boolean;
    has_appeals: boolean;
    created_at: string;
}

interface Abbatoir {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    location: string;
    animal_count: number;
}

interface ProcessingUnit {
    id: number;
    name: string;
    location: string;
}

interface AnimalFormData {
    abbatoir_id: number | '';
    species: string;
    animal_name: string;
    age: number | '';
    gender: string;
    live_weight: number | '';
    notes: string;
    processing_unit_id: number | '' | null;
    slaughtered: boolean;
}

const SPECIES_OPTIONS = [
    { value: 'cow', label: 'Cow' },
    { value: 'pig', label: 'Pig' },
    { value: 'chicken', label: 'Chicken' },
    { value: 'sheep', label: 'Sheep' },
    { value: 'goat', label: 'Goat' },
];

const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'unknown', label: 'Unknown' },
];

function AdminAnimals() {
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Dropdown data
    const [abbatoirs, setAbbatoirs] = useState<Abbatoir[]>([]);
    const [processingUnits, setProcessingUnits] = useState<ProcessingUnit[]>([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);

    // Form data
    const [formData, setFormData] = useState<AnimalFormData>({
        abbatoir_id: '',
        species: 'cow',
        animal_name: '',
        age: '',
        gender: 'unknown',
        live_weight: '',
        notes: '',
        processing_unit_id: null,
        slaughtered: false,
    });

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

    const loadDropdownData = async () => {
        setLoadingDropdowns(true);
        try {
            const [abbatoirsRes, puRes] = await Promise.all([
                getAbbatoirs(),
                getProcessingUnits()
            ]);
            setAbbatoirs(abbatoirsRes.data.results || abbatoirsRes.data || []);
            setProcessingUnits(puRes.data.results || puRes.data || []);
        } catch (err) {
            console.error('Error loading dropdown data:', err);
        } finally {
            setLoadingDropdowns(false);
        }
    };

    const handleOpenAddModal = () => {
        setEditingAnimal(null);
        setFormData({
            abbatoir_id: '',
            species: 'cow',
            animal_name: '',
            age: '',
            gender: 'unknown',
            live_weight: '',
            notes: '',
            processing_unit_id: null,
            slaughtered: false,
        });
        setFormError(null);
        loadDropdownData();
        setShowModal(true);
    };

    const handleOpenEditModal = (animal: Animal) => {
        setEditingAnimal(animal);
        setFormData({
            abbatoir_id: animal.abbatoir || '',
            species: animal.species || 'cow',
            animal_name: animal.animal_name || '',
            age: animal.age || '',
            gender: animal.gender || 'unknown',
            live_weight: animal.live_weight || '',
            notes: animal.notes || '',
            processing_unit_id: animal.transferred_to || null,
            slaughtered: animal.slaughtered || false,
        });
        setFormError(null);
        loadDropdownData();
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingAnimal(null);
        setFormError(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Validation
        if (!formData.abbatoir_id) {
            setFormError('Please select an abattoir.');
            return;
        }
        if (!formData.age || formData.age <= 0) {
            setFormError('Please enter a valid age.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                abbatoir_id: Number(formData.abbatoir_id),
                processing_unit_id: formData.processing_unit_id ? Number(formData.processing_unit_id) : null,
            };

            if (editingAnimal) {
                await updateAnimal(editingAnimal.id, payload);
            } else {
                await createAnimal(payload);
            }
            setShowModal(false);
            setEditingAnimal(null);
            loadAnimals();
        } catch (err: any) {
            console.error('Error saving animal:', err);
            const errorMsg = err.response?.data?.detail ||
                err.response?.data?.message ||
                Object.values(err.response?.data || {}).flat().join(', ') ||
                `Failed to ${editingAnimal ? 'update' : 'create'} animal.`;
            setFormError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAnimal = async (id: number, animalId: string) => {
        if (!window.confirm(`Are you sure you want to delete animal ${animalId}?`)) {
            return;
        }
        try {
            await deleteAnimal(id);
            loadAnimals();
        } catch (err: any) {
            console.error('Error deleting animal:', err);
            setError('Failed to delete animal.');
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
        animal.abbatoir_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                <div className="actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="search-bar" style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--bg-secondary, #f3f4f6)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        gap: '8px',
                        flex: '1 1 200px',
                        minWidth: '0'
                    }}>
                        <MdSearch />
                        <input
                            type="text"
                            placeholder="Search ID, name, abattoir..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                outline: 'none',
                                width: '100%',
                                minWidth: '150px',
                                maxWidth: '200px'
                            }}
                        />
                    </div>
                    <motion.button
                        className="btn btn-primary"
                        onClick={handleOpenAddModal}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <MdAdd /> Add Animal
                    </motion.button>
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
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
                                <th>Abattoir</th>
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
                                            <td>{animal.abbatoir_name || 'N/A'}</td>
                                            <td>{animal.processing_unit_name || 'At Abbatoir'}</td>
                                            <td>{formatDate(animal.created_at)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <motion.button
                                                        className="btn btn-sm btn-secondary"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleOpenEditModal(animal)}
                                                        title="Edit"
                                                    >
                                                        <MdEdit />
                                                    </motion.button>
                                                    <motion.button
                                                        className="btn btn-sm btn-danger"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleDeleteAnimal(animal.id, animal.animal_id)}
                                                        title="Delete"
                                                        style={{ background: '#ef4444', color: 'white', border: 'none' }}
                                                    >
                                                        <MdDelete />
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Add/Edit Animal Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseModal}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                    >
                        <motion.div
                            className="modal-content card"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '100%',
                                maxWidth: '600px',
                                maxHeight: '90vh',
                                overflow: 'auto',
                                padding: '24px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0 }}>{editingAnimal ? 'Edit Animal' : 'Add New Animal'}</h2>
                                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>
                                    <MdClose />
                                </button>
                            </div>

                            {formError && (
                                <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px' }}>
                                    {formError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {/* Abbatoir Selection */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                                            Abattoir <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <select
                                            name="abbatoir_id"
                                            value={formData.abbatoir_id}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loadingDropdowns}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        >
                                            <option value="">Select an abattoir...</option>
                                            {abbatoirs.map(abbatoir => (
                                                <option key={abbatoir.id} value={abbatoir.id}>
                                                    {abbatoir.full_name} ({abbatoir.username}) - {abbatoir.animal_count} animals
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Species and Gender Row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Species</label>
                                            <select
                                                name="species"
                                                value={formData.species}
                                                onChange={handleInputChange}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                            >
                                                {SPECIES_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Gender</label>
                                            <select
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleInputChange}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                            >
                                                {GENDER_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Animal Name */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Animal Name (Optional)</label>
                                        <input
                                            type="text"
                                            name="animal_name"
                                            value={formData.animal_name}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Bessie, Tag #1234"
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        />
                                    </div>

                                    {/* Age and Weight Row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                                                Age (months) <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="age"
                                                value={formData.age}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.1"
                                                required
                                                placeholder="e.g., 24"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Live Weight (kg)</label>
                                            <input
                                                type="number"
                                                name="live_weight"
                                                value={formData.live_weight}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.1"
                                                placeholder="e.g., 450"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Processing Unit (Optional) */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                                            Processing Unit (if already transferred)
                                        </label>
                                        <select
                                            name="processing_unit_id"
                                            value={formData.processing_unit_id || ''}
                                            onChange={handleInputChange}
                                            disabled={loadingDropdowns}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        >
                                            <option value="">At Abbatoir (not transferred)</option>
                                            {processingUnits.map(pu => (
                                                <option key={pu.id} value={pu.id}>
                                                    {pu.name} - {pu.location}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Slaughtered Checkbox */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="checkbox"
                                            name="slaughtered"
                                            checked={formData.slaughtered}
                                            onChange={handleInputChange}
                                            id="slaughtered"
                                        />
                                        <label htmlFor="slaughtered" style={{ fontWeight: 500 }}>Already Slaughtered</label>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Notes</label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            rows={3}
                                            placeholder="Additional notes about the animal..."
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', resize: 'vertical' }}
                                        />
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="btn btn-secondary"
                                        style={{ padding: '10px 20px' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={submitting}
                                        style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        {submitting ? (editingAnimal ? 'Saving...' : 'Creating...') : (editingAnimal ? <><MdEdit /> Save Changes</> : <><MdAdd /> Create Animal</>)}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AdminAnimals;
