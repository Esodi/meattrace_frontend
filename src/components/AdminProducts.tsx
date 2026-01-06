import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSearch, MdFilterList, MdInventory, MdVisibility, MdRefresh, MdAdd, MdClose, MdDelete } from 'react-icons/md';
import { createProduct, deleteProduct, getProcessingUnits, getAnimals, getShops } from '../services/api';
import api from '../services/api';

interface Product {
    id: number;
    name: string;
    batch_number: string;
    product_type: string;
    quantity: number;
    weight: number;
    animal_id: string | null;
    processing_unit_name: string | null;
    transferred_to_name: string | null;
    received_by_shop_name: string | null;
    category_name: string | null;
    created_at: string;
    transferred_at: string | null;
}

interface ProcessingUnit {
    id: number;
    name: string;
    location: string;
}

interface Animal {
    id: number;
    animal_id: string;
    animal_name: string;
    species: string;
    lifecycle_status: string;
}

interface Shop {
    id: number;
    name: string;
    location: string;
}

interface ProductFormData {
    processing_unit_id: number | '';
    animal_id: number | '';
    shop_id: number | '' | null;
    name: string;
    batch_number: string;
    product_type: string;
    quantity: number | '';
    weight: number | '';
    weight_unit: string;
    price: number | '';
    description: string;
}

const PRODUCT_TYPE_OPTIONS = [
    { value: 'meat', label: 'Meat' },
    { value: 'milk', label: 'Milk' },
    { value: 'eggs', label: 'Eggs' },
    { value: 'wool', label: 'Wool' },
];

const WEIGHT_UNIT_OPTIONS = [
    { value: 'kg', label: 'Kilograms' },
    { value: 'lbs', label: 'Pounds' },
    { value: 'g', label: 'Grams' },
];

function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
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
    const [processingUnits, setProcessingUnits] = useState<ProcessingUnit[]>([]);
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);

    // Form data
    const [formData, setFormData] = useState<ProductFormData>({
        processing_unit_id: '',
        animal_id: '',
        shop_id: null,
        name: '',
        batch_number: '',
        product_type: 'meat',
        quantity: '',
        weight: '',
        weight_unit: 'kg',
        price: '',
        description: '',
    });

    useEffect(() => {
        loadProducts();
    }, [typeFilter]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            let url = '/admin/products/';
            const params = new URLSearchParams();
            if (typeFilter) {
                params.append('product_type', typeFilter);
            }
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            const response = await api.get(url);
            setProducts(response.data.results || response.data || []);
        } catch (err: any) {
            console.error('Error loading products:', err);
            setError('Failed to load products. Please ensure you are authenticated.');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const loadDropdownData = async () => {
        setLoadingDropdowns(true);
        try {
            const [puRes, animalsRes, shopsRes] = await Promise.all([
                getProcessingUnits(),
                getAnimals(),
                getShops()
            ]);
            setProcessingUnits(puRes.data.results || puRes.data || []);
            setAnimals(animalsRes.data.results || animalsRes.data || []);
            setShops(shopsRes.data.results || shopsRes.data || []);
        } catch (err) {
            console.error('Error loading dropdown data:', err);
        } finally {
            setLoadingDropdowns(false);
        }
    };

    const handleOpenAddModal = () => {
        setFormData({
            processing_unit_id: '',
            animal_id: '',
            shop_id: null,
            name: '',
            batch_number: '',
            product_type: 'meat',
            quantity: '',
            weight: '',
            weight_unit: 'kg',
            price: '',
            description: '',
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
        if (!formData.processing_unit_id) {
            setFormError('Please select a processing unit.');
            return;
        }
        if (!formData.animal_id) {
            setFormError('Please select a source animal.');
            return;
        }
        if (!formData.name) {
            setFormError('Please enter a product name.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                processing_unit_id: Number(formData.processing_unit_id),
                animal_id: Number(formData.animal_id),
                shop_id: formData.shop_id ? Number(formData.shop_id) : null,
            };

            await createProduct(payload);
            setShowAddModal(false);
            loadProducts();
        } catch (err: any) {
            console.error('Error creating product:', err);
            const errorMsg = err.response?.data?.detail ||
                err.response?.data?.message ||
                Object.values(err.response?.data || {}).flat().join(', ') ||
                'Failed to create product.';
            setFormError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProduct = async (id: number, name: string) => {
        if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) {
            return;
        }
        try {
            await deleteProduct(id);
            loadProducts();
        } catch (err: any) {
            console.error('Error deleting product:', err);
            setError('Failed to delete product.');
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

    const getTypeColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'meat': return { bg: '#fee2e2', color: '#991b1b' };
            case 'milk': return { bg: '#dbeafe', color: '#1e40af' };
            case 'eggs': return { bg: '#fef3c7', color: '#92400e' };
            case 'wool': return { bg: '#dcfce7', color: '#166534' };
            default: return { bg: '#f3f4f6', color: '#374151' };
        }
    };

    const getLocation = (product: Product) => {
        if (product.received_by_shop_name) return `🏪 ${product.received_by_shop_name}`;
        if (product.transferred_to_name) return `🔄 ${product.transferred_to_name}`;
        if (product.processing_unit_name) return `🏭 ${product.processing_unit_name}`;
        return 'N/A';
    };

    const getStatus = (product: Product) => {
        if (product.received_by_shop_name) return { label: 'At Shop', bg: '#dcfce7', color: '#166534' };
        if (product.transferred_at) return { label: 'In Transit', bg: '#fef3c7', color: '#92400e' };
        return { label: 'At Processing', bg: '#dbeafe', color: '#1e40af' };
    };

    // Get unique product types for filter
    const productTypes = [...new Set(products.map(p => p.product_type).filter(Boolean))];

    const filteredProducts = products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.animal_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.processing_unit_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="loading">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', fontSize: '3rem' }}
                >
                    📦
                </motion.div>
                <p>Loading products...</p>
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
                <h1><MdInventory style={{ verticalAlign: 'middle', marginRight: '8px' }} />Product Traceability</h1>
                <div className="actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="search-bar" style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--bg-secondary, #f3f4f6)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        gap: '8px',
                        flex: '1 1 auto',
                        minWidth: '200px'
                    }}>
                        <MdSearch />
                        <input
                            type="text"
                            placeholder="Search name, batch, animal..."
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
                        <MdAdd /> Add Product
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
                        onClick={loadProducts}
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
                            <label style={{ fontWeight: 500 }}>Product Type:</label>
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
                            {productTypes.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        border: typeFilter === type ? '2px solid #6366f1' : '1px solid #e5e7eb',
                                        background: typeFilter === type ? '#eef2ff' : 'white',
                                        cursor: 'pointer',
                                        fontWeight: typeFilter === type ? 600 : 400,
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {type}
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
                    { label: 'Total Products', count: products.length, color: '#6366f1' },
                    { label: 'At Processing', count: products.filter(p => !p.transferred_at && !p.received_by_shop_name).length, color: '#3b82f6' },
                    { label: 'In Transit', count: products.filter(p => p.transferred_at && !p.received_by_shop_name).length, color: '#f59e0b' },
                    { label: 'At Shops', count: products.filter(p => p.received_by_shop_name).length, color: '#10b981' }
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
                    Products List
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                        ({filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'})
                    </span>
                </h2>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Batch</th>
                                <th>Type</th>
                                <th>Qty</th>
                                <th>Weight</th>
                                <th>Source Animal</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                        {searchTerm ? 'No products match your search' : 'No products found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product, index) => {
                                    const typeStyle = getTypeColor(product.product_type);
                                    const status = getStatus(product);
                                    return (
                                        <motion.tr
                                            key={product.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td style={{ fontWeight: 500 }}>{product.name}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{product.batch_number}</td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    background: typeStyle.bg,
                                                    color: typeStyle.color,
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {product.product_type || 'N/A'}
                                                </span>
                                            </td>
                                            <td>{product.quantity}</td>
                                            <td>{product.weight ? `${product.weight} kg` : 'N/A'}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                                {product.animal_id || 'N/A'}
                                            </td>
                                            <td>{getLocation(product)}</td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    background: status.bg,
                                                    color: status.color
                                                }}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td>{formatDate(product.created_at)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <motion.button
                                                        className="btn btn-sm btn-secondary"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <MdVisibility /> View
                                                    </motion.button>
                                                    <motion.button
                                                        className="btn btn-sm btn-danger"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleDeleteProduct(product.id, product.name)}
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

            {/* Add Product Modal */}
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
                                maxWidth: '650px',
                                maxHeight: '90vh',
                                overflow: 'auto',
                                padding: '24px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0 }}>Add New Product</h2>
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
                                    {/* Processing Unit Selection */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                                            Processing Unit <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <select
                                            name="processing_unit_id"
                                            value={formData.processing_unit_id}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loadingDropdowns}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        >
                                            <option value="">Select a processing unit...</option>
                                            {processingUnits.map(pu => (
                                                <option key={pu.id} value={pu.id}>
                                                    {pu.name} - {pu.location}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Animal Selection */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                                            Source Animal <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <select
                                            name="animal_id"
                                            value={formData.animal_id}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loadingDropdowns}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        >
                                            <option value="">Select an animal...</option>
                                            {animals.map(animal => (
                                                <option key={animal.id} value={animal.id}>
                                                    {animal.animal_id} - {animal.animal_name || animal.species} ({animal.lifecycle_status})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Product Name and Type */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                                                Product Name <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="e.g., Beef Steak, Ground Beef"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Product Type</label>
                                            <select
                                                name="product_type"
                                                value={formData.product_type}
                                                onChange={handleInputChange}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                            >
                                                {PRODUCT_TYPE_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Batch Number */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Batch Number</label>
                                        <input
                                            type="text"
                                            name="batch_number"
                                            value={formData.batch_number}
                                            onChange={handleInputChange}
                                            placeholder="e.g., BATCH-2024-001"
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        />
                                    </div>

                                    {/* Quantity, Weight, Price */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Quantity</label>
                                            <input
                                                type="number"
                                                name="quantity"
                                                value={formData.quantity}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="1"
                                                placeholder="e.g., 10"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Weight</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="number"
                                                    name="weight"
                                                    value={formData.weight}
                                                    onChange={handleInputChange}
                                                    min="0"
                                                    step="0.1"
                                                    placeholder="e.g., 5"
                                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                />
                                                <select
                                                    name="weight_unit"
                                                    value={formData.weight_unit}
                                                    onChange={handleInputChange}
                                                    style={{ width: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                >
                                                    {WEIGHT_UNIT_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.value}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Price</label>
                                            <input
                                                type="number"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                                placeholder="e.g., 25.00"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Shop Assignment (Optional) */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                                            Assign to Shop (Optional)
                                        </label>
                                        <select
                                            name="shop_id"
                                            value={formData.shop_id || ''}
                                            onChange={handleInputChange}
                                            disabled={loadingDropdowns}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        >
                                            <option value="">Keep at Processing Unit</option>
                                            {shops.map(shop => (
                                                <option key={shop.id} value={shop.id}>
                                                    {shop.name} - {shop.location}
                                                </option>
                                            ))}
                                        </select>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                                            Select a shop to directly assign this product to a retail location
                                        </p>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={3}
                                            placeholder="Product description..."
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
                                        {submitting ? 'Creating...' : <><MdAdd /> Create Product</>}
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

export default AdminProducts;
