import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSearch, MdFilterList, MdRefresh, MdAdd, MdClose, MdDelete, MdVisibility, MdContentCut } from 'react-icons/md';
import { getSlaughterParts, createSlaughterPart, deleteSlaughterPart, getAnimals, getProcessingUnits } from '../services/api';

interface SlaughterPart {
    id: number;
    part_id: string;
    part_type: string;
    weight: number;
    remaining_weight: number;
    weight_unit: string;
    description: string;
    used_in_product: boolean;
    animal: number;
    animal_id?: string;
    animal_species?: string;
    transferred_to: number | null;
    processing_unit_name: string | null;
    created_at: string;
    transferred_at: string | null;
}

interface Animal {
    id: number;
    animal_id: string;
    animal_name: string;
    species: string;
    slaughtered: boolean;
}

interface ProcessingUnit {
    id: number;
    name: string;
    location: string;
}

interface PartFormData {
    animal_id: number | '';
    part_type: string;
    weight: number | '';
    weight_unit: string;
    description: string;
    processing_unit_id: number | '' | null;
}

const PART_TYPE_OPTIONS = [
    { value: 'whole_carcass', label: 'Whole Carcass' },
    { value: 'left_side', label: 'Left Side' },
    { value: 'right_side', label: 'Right Side' },
    { value: 'left_carcass', label: 'Left Carcass' },
    { value: 'right_carcass', label: 'Right Carcass' },
    { value: 'head', label: 'Head' },
    { value: 'feet', label: 'Feet' },
    { value: 'internal_organs', label: 'Internal Organs' },
    { value: 'torso', label: 'Torso' },
    { value: 'front_legs', label: 'Front Legs' },
    { value: 'hind_legs', label: 'Hind Legs' },
];

const WEIGHT_UNIT_OPTIONS = [
    { value: 'kg', label: 'Kilograms' },
    { value: 'lbs', label: 'Pounds' },
    { value: 'g', label: 'Grams' },
];

function AdminSlaughterParts() {
    const [parts, setParts] = useState<SlaughterPart[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Dropdown data
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [processingUnits, setProcessingUnits] = useState<ProcessingUnit[]>([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);

    // Form data
    const [formData, setFormData] = useState<PartFormData>({
        animal_id: '',
        part_type: 'whole_carcass',
        weight: '',
        weight_unit: 'kg',
        description: '',
        processing_unit_id: null,
    });

    useEffect(() => {
        loadParts();
    }, [typeFilter]);

    const loadParts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getSlaughterParts();
            setParts(response.data.results || response.data || []);
        } catch (err: any) {
            console.error('Error loading slaughter parts:', err);
            setError('Failed to load slaughter parts. Please ensure you are authenticated.');
            setParts([]);
        } finally {
            setLoading(false);
        }
    };

    const loadDropdownData = async () => {
        setLoadingDropdowns(true);
        try {
            const [animalsRes, puRes] = await Promise.all([
                getAnimals({ lifecycle_status: 'SLAUGHTERED' }),
                getProcessingUnits()
            ]);
            // Filter to only slaughtered animals
            const allAnimals = animalsRes.data.results || animalsRes.data || [];
            setAnimals(allAnimals.filter((a: Animal) => a.slaughtered));
            setProcessingUnits(puRes.data.results || puRes.data || []);
        } catch (err) {
            console.error('Error loading dropdown data:', err);
        } finally {
            setLoadingDropdowns(false);
        }
    };

    const handleOpenAddModal = () => {
        setFormData({
            animal_id: '',
            part_type: 'whole_carcass',
            weight: '',
            weight_unit: 'kg',
            description: '',
            processing_unit_id: null,
        });
        setFormError(null);
        loadDropdownData();
        setShowAddModal(true);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setFormError(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Validation
        if (!formData.animal_id) {
            setFormError('Please select an animal.');
            return;
        }
        if (!formData.weight || formData.weight <= 0) {
            setFormError('Please enter a valid weight.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                animal_id: Number(formData.animal_id),
                processing_unit_id: formData.processing_unit_id ? Number(formData.processing_unit_id) : null,
            };

            await createSlaughterPart(payload);
            setShowAddModal(false);
            loadParts();
        } catch (err: any) {
            console.error('Error creating slaughter part:', err);
            const errorMsg = err.response?.data?.detail ||
                err.response?.data?.message ||
                Object.values(err.response?.data || {}).flat().join(', ') ||
                'Failed to create slaughter part.';
            setFormError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePart = async (id: number, partId: string) => {
        if (!window.confirm(`Are you sure you want to delete part ${partId}?`)) {
            return;
        }
        try {
            await deleteSlaughterPart(id);
            loadParts();
        } catch (err: any) {
            console.error('Error deleting slaughter part:', err);
            setError('Failed to delete slaughter part.');
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

    const getPartTypeLabel = (type: string) => {
        const option = PART_TYPE_OPTIONS.find(opt => opt.value === type);
        return option ? option.label : type;
    };

    // Get unique part types for filter
    const partTypes = [...new Set(parts.map(p => p.part_type).filter(Boolean))];

    const filteredParts = parts.filter(part => {
        const matchesSearch =
            part.part_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            part.animal_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            part.part_type?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = !typeFilter || part.part_type === typeFilter;

        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="loading">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', fontSize: '3rem' }}
                >
                    🥩
                </motion.div>
                <p>Loading slaughter parts...</p>
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
                <h1><MdContentCut style={{ verticalAlign: 'middle', marginRight: '8px' }} />Slaughter Parts</h1>
                <div className="actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                            placeholder="Search part ID, animal..."
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
                        className="btn btn-primary"
                        onClick={handleOpenAddModal}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <MdAdd /> Add Part
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
                        onClick={loadParts}
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
                            <label style={{ fontWeight: 500 }}>Part Type:</label>
                            <button
                                onClick={() => setTypeFilter('')}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    border: typeFilter === '' ? '2px solid #6366f1' : '1px solid #e5e7eb',
                                    background: typeFilter === '' ? '#eef2ff' : 'white',
                                    cursor: 'pointer',
                                    fontWeight: typeFilter === '' ? 600 : 400
                                }}
                            >
                                All
                            </button>
                            {partTypes.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        border: typeFilter === type ? '2px solid #6366f1' : '1px solid #e5e7eb',
                                        background: typeFilter === type ? '#eef2ff' : 'white',
                                        cursor: 'pointer',
                                        fontWeight: typeFilter === type ? 600 : 400
                                    }}
                                >
                                    {getPartTypeLabel(type)}
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
                    { label: 'Total Parts', count: parts.length, color: '#6366f1' },
                    { label: 'Available', count: parts.filter(p => !p.used_in_product).length, color: '#10b981' },
                    { label: 'Used in Products', count: parts.filter(p => p.used_in_product).length, color: '#f59e0b' },
                    { label: 'Transferred', count: parts.filter(p => p.transferred_to !== null).length, color: '#3b82f6' }
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
                    Parts List
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                        ({filteredParts.length} {filteredParts.length === 1 ? 'part' : 'parts'})
                    </span>
                </h2>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Part ID</th>
                                <th>Type</th>
                                <th>Animal</th>
                                <th>Weight</th>
                                <th>Remaining</th>
                                <th>Status</th>
                                <th>Location</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParts.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                        {searchTerm ? 'No parts match your search' : 'No slaughter parts found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredParts.map((part, index) => {
                                    const isUsed = part.used_in_product;
                                    return (
                                        <motion.tr
                                            key={part.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{part.part_id}</td>
                                            <td>{getPartTypeLabel(part.part_type)}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                                {part.animal_id || `Animal #${part.animal}`}
                                                {part.animal_species && <span style={{ color: '#6b7280' }}> ({part.animal_species})</span>}
                                            </td>
                                            <td>{part.weight} {part.weight_unit}</td>
                                            <td>{part.remaining_weight} {part.weight_unit}</td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    background: isUsed ? '#fef3c7' : '#dcfce7',
                                                    color: isUsed ? '#92400e' : '#166534'
                                                }}>
                                                    {isUsed ? 'Used' : 'Available'}
                                                </span>
                                            </td>
                                            <td>{part.processing_unit_name || 'At Source'}</td>
                                            <td>{formatDate(part.created_at)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <motion.button
                                                        className="btn btn-sm btn-secondary"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        title="View"
                                                    >
                                                        <MdVisibility />
                                                    </motion.button>
                                                    <motion.button
                                                        className="btn btn-sm btn-danger"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleDeletePart(part.id, part.part_id)}
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

            {/* Add Part Modal */}
            <AnimatePresence>
                {showAddModal && (
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
                                maxWidth: '550px',
                                maxHeight: '90vh',
                                overflow: 'auto',
                                padding: '24px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0 }}>Add Slaughter Part</h2>
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
                                    {/* Animal Selection */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                                            Slaughtered Animal <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <select
                                            name="animal_id"
                                            value={formData.animal_id}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loadingDropdowns}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        >
                                            <option value="">Select a slaughtered animal...</option>
                                            {animals.length === 0 && !loadingDropdowns && (
                                                <option value="" disabled>No slaughtered animals available</option>
                                            )}
                                            {animals.map(animal => (
                                                <option key={animal.id} value={animal.id}>
                                                    {animal.animal_id} - {animal.animal_name || animal.species}
                                                </option>
                                            ))}
                                        </select>
                                        {animals.length === 0 && !loadingDropdowns && (
                                            <p style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '4px' }}>
                                                No slaughtered animals found. Only slaughtered animals can have parts added.
                                            </p>
                                        )}
                                    </div>

                                    {/* Part Type */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Part Type</label>
                                        <select
                                            name="part_type"
                                            value={formData.part_type}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        >
                                            {PART_TYPE_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Weight */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                                            Weight <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="number"
                                                name="weight"
                                                value={formData.weight}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.1"
                                                required
                                                placeholder="e.g., 50"
                                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                            />
                                            <select
                                                name="weight_unit"
                                                value={formData.weight_unit}
                                                onChange={handleInputChange}
                                                style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                            >
                                                {WEIGHT_UNIT_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Processing Unit (Optional) */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                                            Transfer to Processing Unit (Optional)
                                        </label>
                                        <select
                                            name="processing_unit_id"
                                            value={formData.processing_unit_id || ''}
                                            onChange={handleInputChange}
                                            disabled={loadingDropdowns}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        >
                                            <option value="">Keep at Source</option>
                                            {processingUnits.map(pu => (
                                                <option key={pu.id} value={pu.id}>
                                                    {pu.name} - {pu.location}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={3}
                                            placeholder="Additional notes about this part..."
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
                                        disabled={submitting || animals.length === 0}
                                        style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        {submitting ? 'Creating...' : <><MdAdd /> Create Part</>}
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

export default AdminSlaughterParts;
