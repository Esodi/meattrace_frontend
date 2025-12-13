import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MdSearch, MdFilterList, MdVerified, MdAdd, MdDateRange, MdBusiness } from 'react-icons/md';
import { getCertifications } from '../services/api';

function Certifications() {
    const [searchTerm, setSearchTerm] = useState('');
    const [certifications, setCertifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        const fetchCertifications = async () => {
            try {
                const response = await getCertifications();
                setCertifications(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch certifications", err);
                setError("Failed to load certifications");
                setLoading(false);
            }
        };

        fetchCertifications();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'success';
            case 'expiring soon': // Backend doesn't have this yet, maybe compute it?
            case 'pending': return 'warning';
            case 'expired':
            case 'suspended': return 'danger';
            default: return 'secondary';
        }
    };

    return (
        <div className="admin-page">
            <motion.div
                className="header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>Certifications Management</h1>
                <div className="actions">
                    <div className="search-bar">
                        <MdSearch />
                        <input
                            type="text"
                            placeholder="Search certificate or entity..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-secondary">
                        <MdFilterList /> Filter
                    </button>
                    <button className="btn btn-primary">
                        <MdAdd /> Issue Certificate
                    </button>
                </div>
            </motion.div>

            <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {loading ? <p>Loading certifications...</p> : error ? <p className="text-danger">{error}</p> : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Certificate ID</th>
                                    <th>Entity</th>
                                    <th>Certificate Name</th>
                                    <th>Type</th>
                                    <th>Valid Until</th>
                                    <th>Status</th>
                                    <th>Issuer</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {certifications.map((cert) => (
                                    <tr key={cert.id}>
                                        <td>
                                            <div className="flex-center gap-2">
                                                <MdVerified className="text-secondary" /> {cert.certificate_number || cert.id}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex-center gap-2">
                                                <MdBusiness className="text-muted" /> {cert.entity_name || 'Unknown'}
                                            </div>
                                        </td>
                                        <td><strong>{cert.name}</strong></td>
                                        <td>{cert.cert_type}</td>
                                        <td>
                                            <div className="flex-center gap-2">
                                                <MdDateRange className="text-muted" /> {cert.expiry_date}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${getStatusColor(cert.status)}`}>
                                                {cert.status}
                                            </span>
                                        </td>
                                        <td>{cert.issuing_authority}</td>
                                        <td>
                                            <button className="btn btn-sm btn-secondary">Manage</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export default Certifications;
