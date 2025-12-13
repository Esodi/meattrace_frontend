import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSearch, MdFilterList, MdInventory, MdVisibility, MdRefresh } from 'react-icons/md';
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

function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

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
            case 'raw': return { bg: '#fef3c7', color: '#92400e' };
            case 'processed': return { bg: '#dbeafe', color: '#1e40af' };
            case 'packaged': return { bg: '#dcfce7', color: '#166534' };
            case 'frozen': return { bg: '#e0e7ff', color: '#4338ca' };
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
                            placeholder="Search name, batch, animal..."
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
                    gridTemplateColumns: 'repeat(4, 1fr)',
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

export default AdminProducts;
