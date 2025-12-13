import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSearch, MdFilterList, MdAssignment, MdWarning, MdCheckCircle, MdSchedule, MdFileDownload } from 'react-icons/md';
import { getComplianceAudits } from '../services/api';
import DateRangePicker from './DateRangePicker';

function ComplianceManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [audits, setAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
        start: null,
        end: null
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    React.useEffect(() => {
        const fetchAudits = async () => {
            try {
                const response = await getComplianceAudits();
                setAudits(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch audits", err);
                setError("Failed to load compliance audits");
                setLoading(false);
            }
        };

        fetchAudits();
    }, []);

    // Filter audits by search term and date range
    const filteredAudits = useMemo(() => {
        return audits.filter(audit => {
            // Search filter
            const searchMatch = !searchTerm ||
                audit.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                audit.auditor_name?.toLowerCase().includes(searchTerm.toLowerCase());

            // Date filter
            let dateMatch = true;
            if (dateRange.start || dateRange.end) {
                const auditDate = new Date(audit.audit_date);
                if (dateRange.start && auditDate < dateRange.start) dateMatch = false;
                if (dateRange.end && auditDate > dateRange.end) dateMatch = false;
            }

            return searchMatch && dateMatch;
        });
    }, [audits, searchTerm, dateRange]);

    const handleDateChange = (start: Date | null, end: Date | null) => {
        setDateRange({ start, end });
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Entity', 'Status', 'Outcome', 'Date', 'Score', 'Auditor'];
        const rows = filteredAudits.map(audit => [
            audit.id,
            audit.entity_name || 'Unknown',
            audit.status,
            audit.outcome || '-',
            new Date(audit.audit_date).toLocaleDateString(),
            audit.score || '-',
            audit.auditor_name || 'Unassigned'
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `compliance_audits_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };


    const getStatusColor = (status: string, outcome: string) => {
        if (status !== 'completed') return 'info';
        switch (outcome?.toLowerCase()) {
            case 'pass': return 'success';
            case 'pass_with_conditions': return 'warning';
            case 'fail':
            case 'critical_fail': return 'danger';
            default: return 'secondary';
        }
    };

    const getStatusLabel = (audit: any) => {
        if (audit.status !== 'completed') return audit.status; // Scheduled, In Progress
        // Map outcome codes to readable labels
        const outcomeMap: { [key: string]: string } = {
            'pass': 'Passed',
            'pass_with_conditions': 'Warning Issued',
            'fail': 'Failed',
            'critical_fail': 'Critical Failure'
        };
        return outcomeMap[audit.outcome] || audit.outcome || 'Completed';
    };

    const getStatusIcon = (status: string, outcome: string) => {
        if (status === 'scheduled') return <MdSchedule />;
        if (status !== 'completed') return <MdAssignment />;

        switch (outcome?.toLowerCase()) {
            case 'pass': return <MdCheckCircle />;
            case 'pass_with_conditions': return <MdWarning />;
            case 'fail':
            case 'critical_fail': return <MdWarning />; // Or distinct icon
            default: return <MdCheckCircle />;
        }
    };

    return (
        <div className="admin-page">
            <motion.div
                className="header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>Compliance Audits</h1>
                <div className="actions">
                    <div className="search-bar">
                        <MdSearch />
                        <input
                            type="text"
                            placeholder="Search entity, auditor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        className={`btn btn-secondary ${showDatePicker ? 'active' : ''}`}
                        onClick={() => setShowDatePicker(!showDatePicker)}
                    >
                        <MdFilterList /> Date Filter
                    </button>
                    <button className="btn btn-secondary" onClick={exportToCSV}>
                        <MdFileDownload /> Export CSV
                    </button>
                    <button className="btn btn-primary">
                        <MdAssignment /> Schedule Audit
                    </button>
                </div>
            </motion.div>

            {showDatePicker && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ marginBottom: '1rem' }}
                >
                    <DateRangePicker onDateChange={handleDateChange} />
                </motion.div>
            )}

            <motion.div
                className="metrics-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <div className="metric-card">
                    <div className="metric-icon" style={{ color: '#10b981' }}><MdCheckCircle /></div>
                    <div className="metric-value">
                        {audits.length > 0
                            ? `${Math.round((audits.filter(a => a.outcome === 'pass').length / audits.filter(a => a.status === 'completed').length) * 100) || 0}%`
                            : '-'}
                    </div>
                    <div className="metric-label">Compliance Rate</div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon" style={{ color: '#f59e0b' }}><MdWarning /></div>
                    <div className="metric-value">
                        {audits.filter(a => a.outcome === 'pass_with_conditions' || a.outcome === 'fail').length}
                    </div>
                    <div className="metric-label">Active Warnings</div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon" style={{ color: '#3b82f6' }}><MdSchedule /></div>
                    <div className="metric-value">
                        {audits.filter(a => {
                            const auditDate = new Date(a.audit_date);
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            return auditDate >= weekAgo;
                        }).length}
                    </div>
                    <div className="metric-label">Audits This Week</div>
                </div>
            </motion.div>

            <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h2>Recent Audits</h2>
                {loading ? <p>Loading audits...</p> : error ? <p className="text-danger">{error}</p> : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Audit ID</th>
                                    <th>Entity</th>
                                    <th>Status/Outcome</th>
                                    <th>Date</th>
                                    <th>Score</th>
                                    <th>Auditor</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAudits.map((audit) => (
                                    <tr key={audit.id}>
                                        <td>{audit.id}</td>
                                        <td>{audit.entity_name || 'Unknown Entity'}</td>
                                        <td>
                                            <span className={`status-badge status-${getStatusColor(audit.status, audit.outcome)}`}>
                                                <span className="badge-icon-left">{getStatusIcon(audit.status, audit.outcome)}</span>
                                                {getStatusLabel(audit)}
                                            </span>
                                        </td>
                                        <td>{new Date(audit.audit_date).toLocaleDateString()}</td>
                                        <td>{audit.score ? `${audit.score}/100` : '-'}</td>
                                        <td>{audit.auditor_name || 'Unassigned'}</td>
                                        <td>
                                            <button className="btn btn-sm btn-secondary">
                                                View Report
                                            </button>
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

export default ComplianceManagement;
