import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdTrendingUp, MdLocationOn, MdSwapHoriz, MdWarning } from 'react-icons/md';
import SupplyChainMap from './SupplyChainMap';
import { getSupplyChainStats } from '../services/api';

interface SupplyChainData {
    todays_transfers: number;
    active_locations: number;
    pending_transfers: number;
}

function SupplyChainMonitor() {
    const [stats, setStats] = useState<SupplyChainData>({
        todays_transfers: 0,
        active_locations: 0,
        pending_transfers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getSupplyChainStats();
                setStats(response.data);
            } catch (err) {
                console.error('Failed to fetch supply chain stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        // Refresh every 60 seconds
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="admin-page">
            <motion.div
                className="header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>Supply Chain Monitor</h1>
                <div className="actions">
                    <span className="text-muted">Real-time Overview</span>
                </div>
            </motion.div>

            <motion.div
                className="metrics-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <div className="metric-card">
                    <div className="metric-icon" style={{ color: '#6366f1' }}><MdSwapHoriz /></div>
                    <div className="metric-value">{loading ? '...' : stats.todays_transfers}</div>
                    <div className="metric-label">Today's Transfers</div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon" style={{ color: '#10b981' }}><MdLocationOn /></div>
                    <div className="metric-value">{loading ? '...' : stats.active_locations}</div>
                    <div className="metric-label">Active Locations</div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon" style={{ color: '#f59e0b' }}><MdWarning /></div>
                    <div className="metric-value">{loading ? '...' : stats.pending_transfers}</div>
                    <div className="metric-label">Pending Transfers</div>
                </div>
            </motion.div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr', marginTop: '2rem' }}>
                <motion.div
                    className="card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2>Live Supply Chain Map</h2>
                    <SupplyChainMap />
                </motion.div>

                <motion.div
                    className="card"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2>Pending Approvals</h2>
                    <div className="list-group">
                        {stats.pending_transfers > 0 ? (
                            <div className="list-item">
                                <div className="flex-between">
                                    <strong>{stats.pending_transfers} Pending</strong>
                                    <span className="badge badge-warning">Awaiting</span>
                                </div>
                                <p className="text-small text-muted">Transfer requests need approval</p>
                            </div>
                        ) : (
                            <div className="list-item">
                                <p className="text-muted">No pending transfer requests</p>
                            </div>
                        )}
                    </div>

                    <h2 className="mt-4">Today's Activity</h2>
                    <div className="list-group">
                        <div className="flex-between p-2 border-bottom">
                            <span>Transfers Completed</span>
                            <strong>{stats.todays_transfers}</strong>
                        </div>
                        <div className="flex-between p-2 border-bottom">
                            <span>Active Locations</span>
                            <strong>{stats.active_locations}</strong>
                        </div>
                        <div className="flex-between p-2">
                            <span>Pending Requests</span>
                            <strong>{stats.pending_transfers}</strong>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default SupplyChainMonitor;
