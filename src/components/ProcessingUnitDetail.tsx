import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdEmail, MdPhone, MdLocationOn, MdPerson, MdInventory, MdAccessTime } from 'react-icons/md';
import api from '../services/api';

interface ProcessingUnitDetailProps {
    unitId: number;
    onClose: () => void;
}

interface Member {
    id: number;
    user_username: string;
    user_email: string;
    role: string;
    is_active: boolean;
    permissions: string;
}

interface Product {
    id: number;
    name: string;
    batch_number: string;
    product_type: string;
    quantity: number;
    created_at: string;
}

interface UnitDetail {
    id: number;
    name: string;
    description: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    contact_email: string;
    contact_phone: string;
    license_number: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    member_count: number;
    active_members_count: number;
    product_count: number;
}

function ProcessingUnitDetail({ unitId, onClose }: ProcessingUnitDetailProps) {
    const [unit, setUnit] = useState<UnitDetail | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'members' | 'products'>('info');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const [unitRes, membersRes, productsRes] = await Promise.all([
                    api.get(`/admin/processing-units/${unitId}/`),
                    api.get(`/admin/processing-units/${unitId}/members/`),
                    api.get(`/admin/processing-units/${unitId}/products/`)
                ]);
                setUnit(unitRes.data);
                setMembers(membersRes.data.results || membersRes.data || []);
                setProducts((productsRes.data.results || productsRes.data || []).slice(0, 10));
            } catch (err) {
                console.error('Error fetching processing unit details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [unitId]);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}
            >
                <motion.div
                    className="modal-content"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'var(--bg-card, #fff)',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '800px',
                        maxHeight: '85vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--border-color, #e5e7eb)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        color: 'white'
                    }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
                                🏭 {loading ? 'Loading...' : unit?.name}
                            </h2>
                            {unit && (
                                <span style={{
                                    fontSize: '0.875rem',
                                    opacity: 0.9,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    marginTop: '4px'
                                }}>
                                    <MdLocationOn /> {unit.location || 'No location'}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}
                        >
                            <MdClose size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid var(--border-color, #e5e7eb)',
                        background: 'var(--bg-secondary, #f9fafb)'
                    }}>
                        {[
                            { key: 'info', label: 'Details', icon: '📋' },
                            { key: 'members', label: `Members (${members.length})`, icon: '👥' },
                            { key: 'products', label: `Products (${products.length})`, icon: '📦' }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    border: 'none',
                                    background: activeTab === tab.key ? 'var(--bg-card, #fff)' : 'transparent',
                                    borderBottom: activeTab === tab.key ? '2px solid #6366f1' : '2px solid transparent',
                                    cursor: 'pointer',
                                    fontWeight: activeTab === tab.key ? 600 : 400,
                                    color: activeTab === tab.key ? '#6366f1' : 'var(--text-secondary, #6b7280)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    style={{ fontSize: '2rem', display: 'inline-block' }}
                                >
                                    ⚙️
                                </motion.div>
                                <p>Loading details...</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'info' && unit && (
                                    <div style={{ display: 'grid', gap: '20px' }}>
                                        {/* Stats */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                            <div style={{ background: 'var(--bg-secondary, #f3f4f6)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1' }}>{unit.member_count}</div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #6b7280)' }}>Total Members</div>
                                            </div>
                                            <div style={{ background: 'var(--bg-secondary, #f3f4f6)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{unit.active_members_count}</div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #6b7280)' }}>Active Members</div>
                                            </div>
                                            <div style={{ background: 'var(--bg-secondary, #f3f4f6)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{unit.product_count}</div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #6b7280)' }}>Products</div>
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #6b7280)', textTransform: 'uppercase' }}>Description</label>
                                                <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{unit.description || 'No description'}</p>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #6b7280)', textTransform: 'uppercase' }}>Status</label>
                                                <p style={{ margin: '4px 0 0' }}>
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '20px',
                                                        background: unit.is_active ? '#dcfce7' : '#fee2e2',
                                                        color: unit.is_active ? '#166534' : '#991b1b',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500
                                                    }}>
                                                        {unit.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </p>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #6b7280)', textTransform: 'uppercase' }}>
                                                    <MdEmail style={{ verticalAlign: 'middle' }} /> Email
                                                </label>
                                                <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{unit.contact_email || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #6b7280)', textTransform: 'uppercase' }}>
                                                    <MdPhone style={{ verticalAlign: 'middle' }} /> Phone
                                                </label>
                                                <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{unit.contact_phone || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #6b7280)', textTransform: 'uppercase' }}>License Number</label>
                                                <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{unit.license_number || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #6b7280)', textTransform: 'uppercase' }}>Coordinates</label>
                                                <p style={{ margin: '4px 0 0', fontWeight: 500 }}>
                                                    {unit.latitude && unit.longitude ? `${unit.latitude}, ${unit.longitude}` : 'Not geocoded'}
                                                </p>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #6b7280)', textTransform: 'uppercase' }}>
                                                    <MdAccessTime style={{ verticalAlign: 'middle' }} /> Created
                                                </label>
                                                <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{formatDate(unit.created_at)}</p>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #6b7280)', textTransform: 'uppercase' }}>Last Updated</label>
                                                <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{formatDate(unit.updated_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'members' && (
                                    <div>
                                        {members.length === 0 ? (
                                            <p style={{ textAlign: 'center', color: 'var(--text-secondary, #6b7280)' }}>No members found</p>
                                        ) : (
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '2px solid var(--border-color, #e5e7eb)' }}>
                                                        <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
                                                        <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                                                        <th style={{ padding: '12px', textAlign: 'left' }}>Permissions</th>
                                                        <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {members.map((member) => (
                                                        <tr key={member.id} style={{ borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
                                                            <td style={{ padding: '12px' }}>
                                                                <strong>{member.user_username}</strong>
                                                                <br />
                                                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #6b7280)' }}>{member.user_email}</span>
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <span style={{ textTransform: 'capitalize' }}>{member.role}</span>
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <span style={{ textTransform: 'capitalize' }}>{member.permissions}</span>
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <span style={{
                                                                    padding: '2px 8px',
                                                                    borderRadius: '12px',
                                                                    background: member.is_active ? '#dcfce7' : '#fee2e2',
                                                                    color: member.is_active ? '#166534' : '#991b1b',
                                                                    fontSize: '0.75rem'
                                                                }}>
                                                                    {member.is_active ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'products' && (
                                    <div>
                                        {products.length === 0 ? (
                                            <p style={{ textAlign: 'center', color: 'var(--text-secondary, #6b7280)' }}>No products found</p>
                                        ) : (
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '2px solid var(--border-color, #e5e7eb)' }}>
                                                        <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                                                        <th style={{ padding: '12px', textAlign: 'left' }}>Batch</th>
                                                        <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                                                        <th style={{ padding: '12px', textAlign: 'left' }}>Qty</th>
                                                        <th style={{ padding: '12px', textAlign: 'left' }}>Created</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {products.map((product) => (
                                                        <tr key={product.id} style={{ borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
                                                            <td style={{ padding: '12px', fontWeight: 500 }}>{product.name}</td>
                                                            <td style={{ padding: '12px' }}>{product.batch_number}</td>
                                                            <td style={{ padding: '12px', textTransform: 'capitalize' }}>{product.product_type}</td>
                                                            <td style={{ padding: '12px' }}>{product.quantity}</td>
                                                            <td style={{ padding: '12px', fontSize: '0.875rem' }}>{formatDate(product.created_at)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default ProcessingUnitDetail;
