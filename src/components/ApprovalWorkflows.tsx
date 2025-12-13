import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdCheckCircle, MdCancel, MdVisibility, MdPendingActions, MdHistory, MdClose } from 'react-icons/md';
import { getRegistrationApplications, approveApplication, rejectApplication } from '../services/api';
import Timeline, { TimelineEvent } from './Timeline';

function ApprovalWorkflows() {
    const [activeTab, setActiveTab] = useState('pending');
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);
    const [timelineItem, setTimelineItem] = useState<any | null>(null);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const response = await getRegistrationApplications();
            setApplications(response.data);
            setLoading(false);
            setSelectedIds(new Set());
        } catch (err) {
            console.error("Failed to fetch applications", err);
            setError("Failed to load approval requests");
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchApplications();
    }, []);

    const handleApprove = async (id: string | number) => {
        if (!window.confirm("Are you sure you want to approve this application?")) return;
        setActionLoading(String(id));
        try {
            await approveApplication(id);
            fetchApplications();
        } catch (err) {
            console.error("Failed to approve", err);
            alert("Failed to approve application");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string | number) => {
        const reason = window.prompt("Enter rejection reason:");
        if (!reason) return;
        setActionLoading(String(id));
        try {
            await rejectApplication(id, reason);
            fetchApplications();
        } catch (err) {
            console.error("Failed to reject", err);
            alert("Failed to reject application");
        } finally {
            setActionLoading(null);
        }
    };

    const toggleSelection = (id: string | number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const selectAll = () => {
        if (selectedIds.size === pendingRequests.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pendingRequests.map(r => r.id)));
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm("Approve " + selectedIds.size + " applications?")) return;
        setBulkLoading(true);
        try {
            await Promise.all(Array.from(selectedIds).map(id => approveApplication(id)));
            fetchApplications();
        } catch (err) {
            console.error("Bulk approve failed", err);
            alert("Some approvals failed");
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkReject = async () => {
        if (selectedIds.size === 0) return;
        const reason = window.prompt("Enter rejection reason for " + selectedIds.size + " applications:");
        if (!reason) return;
        setBulkLoading(true);
        try {
            await Promise.all(Array.from(selectedIds).map(id => rejectApplication(id, reason)));
            fetchApplications();
        } catch (err) {
            console.error("Bulk reject failed", err);
            alert("Some rejections failed");
        } finally {
            setBulkLoading(false);
        }
    };

    const buildTimelineEvents = (item: any): TimelineEvent[] => {
        const events: TimelineEvent[] = [
            {
                id: 1,
                title: 'Application Submitted',
                description: "Submitted by " + (item.entity_name || 'Unknown') + " (" + item.entity_type + ")",
                date: item.created_at,
                status: 'completed'
            }
        ];

        if (item.status !== 'pending') {
            events.push({
                id: 2,
                title: item.status === 'approved' ? 'Application Approved' : 'Application Rejected',
                description: item.rejection_reason || 'Processed by admin',
                date: item.updated_at,
                status: item.status === 'approved' ? 'completed' : 'failed'
            });
        } else {
            events.push({
                id: 2,
                title: 'Under Review',
                description: 'Awaiting admin action',
                date: new Date(),
                status: 'pending'
            });
        }

        return events;
    };

    const pendingRequests = applications.filter(app => app.status === 'pending');
    const history = applications.filter(app => app.status !== 'pending');

    return (
        <div className="admin-page">
            <motion.div className="header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1>Approval Workflows</h1>
                <div className="tabs">
                    <button
                        className={"btn " + (activeTab === 'pending' ? 'btn-primary' : 'btn-secondary')}
                        onClick={() => setActiveTab('pending')}
                    >
                        <MdPendingActions /> Pending ({pendingRequests.length})
                    </button>
                    <button
                        className={"btn " + (activeTab === 'history' ? 'btn-primary' : 'btn-secondary')}
                        style={{ marginLeft: '10px' }}
                        onClick={() => setActiveTab('history')}
                    >
                        <MdHistory /> History
                    </button>
                </div>
            </motion.div>

            {loading ? <p>Loading workflows...</p> : error ? <p className="text-danger">{error}</p> : (
                <AnimatePresence mode="wait">
                    {activeTab === 'pending' ? (
                        <motion.div
                            key="pending"
                            className="card"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <h2>Pending Applications</h2>

                            {selectedIds.size > 0 && (
                                <div className="bulk-actions" style={{
                                    display: 'flex',
                                    gap: '10px',
                                    marginBottom: '1rem',
                                    padding: '10px',
                                    background: 'var(--bg-secondary, #f1f5f9)',
                                    borderRadius: '8px'
                                }}>
                                    <span style={{ alignSelf: 'center' }}>
                                        {selectedIds.size} selected
                                    </span>
                                    <button
                                        className="btn btn-success"
                                        onClick={handleBulkApprove}
                                        disabled={bulkLoading}
                                    >
                                        <MdCheckCircle /> Approve Selected
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={handleBulkReject}
                                        disabled={bulkLoading}
                                    >
                                        <MdCancel /> Reject Selected
                                    </button>
                                </div>
                            )}

                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.size === pendingRequests.length && pendingRequests.length > 0}
                                                    onChange={selectAll}
                                                />
                                            </th>
                                            <th>ID</th>
                                            <th>Entity</th>
                                            <th>Type</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingRequests.length === 0 ? (
                                            <tr><td colSpan={7} style={{ textAlign: 'center' }}>No pending applications</td></tr>
                                        ) : pendingRequests.map(req => (
                                            <tr key={req.id} className={selectedIds.has(req.id) ? 'selected-row' : ''}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(req.id)}
                                                        onChange={() => toggleSelection(req.id)}
                                                    />
                                                </td>
                                                <td><strong>{req.id}</strong></td>
                                                <td>{req.entity_name || 'Unknown'}</td>
                                                <td>{req.entity_type}</td>
                                                <td>{new Date(req.created_at).toLocaleDateString()}</td>
                                                <td><span className="badge badge-warning">{req.status}</span></td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            title="View Timeline"
                                                            onClick={() => setTimelineItem(req)}
                                                        >
                                                            <MdVisibility />
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            title="Approve"
                                                            onClick={() => handleApprove(req.id)}
                                                            disabled={actionLoading === String(req.id)}
                                                        >
                                                            <MdCheckCircle />
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            title="Reject"
                                                            onClick={() => handleReject(req.id)}
                                                            disabled={actionLoading === String(req.id)}
                                                        >
                                                            <MdCancel />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="history"
                            className="card"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h2>Approval History</h2>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Entity</th>
                                            <th>Type</th>
                                            <th>Decision Date</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.length === 0 ? (
                                            <tr><td colSpan={6} style={{ textAlign: 'center' }}>No history found</td></tr>
                                        ) : history.map(req => (
                                            <tr key={req.id}>
                                                <td><strong>{req.id}</strong></td>
                                                <td>{req.entity_name || 'Unknown'}</td>
                                                <td>{req.entity_type}</td>
                                                <td>{new Date(req.updated_at).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={"badge badge-" + (req.status === 'approved' ? 'success' : 'danger')}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => setTimelineItem(req)}
                                                    >
                                                        <MdHistory /> Trace
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            <AnimatePresence>
                {timelineItem && (
                    <motion.div
                        className="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setTimelineItem(null)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>Application Timeline #{timelineItem.id}</h2>
                                <button className="close-btn" onClick={() => setTimelineItem(null)}>
                                    <MdClose />
                                </button>
                            </div>
                            <div className="modal-body">
                                <Timeline events={buildTimelineEvents(timelineItem)} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ApprovalWorkflows;
