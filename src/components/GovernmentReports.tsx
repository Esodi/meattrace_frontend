import React, { useState, useEffect, useRef } from 'react';
import { getComplianceAudits, getAnalytics, getDailyStats } from '../services/api';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { MdDownload, MdDateRange, MdPieChart, MdTrendingUp, MdRefresh, MdAssessment } from 'react-icons/md';
import api from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DailyStat {
    date: string;
    new_users: number;
    new_animals: number;
    new_products: number;
    new_orders: number;
    new_sales: number;
}

interface AnalyticsData {
    period: string;
    new_users_count: number;
    new_animals_count: number;
    new_products_count: number;
    new_orders_count: number;
    new_sales_count: number;
    processing_efficiency: number;
    transfer_success_rate: number;
    total_sales_value: number;
    average_order_value: number;
}

function GovernmentReports() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState('30d');
    const [complianceData, setComplianceData] = useState<any[]>([]);
    const [complianceStats, setComplianceStats] = useState({ total: 0, compliant: 0, warnings: 0, nonCompliant: 0 });
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
    const [productionByUnit, setProductionByUnit] = useState<any[]>([]);
    const [exporting, setExporting] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all data in parallel
            const [auditsRes, analyticsRes, dailyRes, unitsRes] = await Promise.all([
                getComplianceAudits().catch(() => ({ data: [] })),
                getAnalytics(period).catch(() => ({ data: {} })),
                getDailyStats(period === '7d' ? 7 : period === '90d' ? 90 : 30).catch(() => ({ data: { daily_stats: [] } })),
                api.get('/admin/processing-units/').catch(() => ({ data: [] }))
            ]);

            // Process compliance audits
            const audits = auditsRes.data?.results || auditsRes.data || [];
            let compliant = 0;
            let warnings = 0;
            let nonCompliant = 0;

            audits.forEach((audit: any) => {
                const outcome = audit.outcome?.toLowerCase();
                if (outcome === 'pass') compliant++;
                else if (outcome === 'pass_with_conditions') warnings++;
                else if (outcome === 'fail' || outcome === 'critical_fail') nonCompliant++;
            });

            setComplianceStats({ total: audits.length, compliant, warnings, nonCompliant });
            setComplianceData([
                { name: 'Fully Compliant', value: compliant || 0 },
                { name: 'Minor Issues', value: warnings || 0 },
                { name: 'Non-Compliant', value: nonCompliant || 0 },
            ]);

            // Set analytics data
            setAnalytics(analyticsRes.data || null);

            // Process daily stats for trend chart
            const stats = dailyRes.data?.daily_stats || [];
            const formattedStats = stats.map((s: any) => ({
                ...s,
                date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }));
            setDailyStats(formattedStats);

            // Process production by unit
            const units = unitsRes.data?.results || unitsRes.data || [];
            const productionData = units.slice(0, 6).map((unit: any) => ({
                name: unit.name?.length > 15 ? unit.name.substring(0, 15) + '...' : unit.name,
                fullName: unit.name,
                products: unit.product_count || 0,
                members: unit.member_count || 0
            }));
            setProductionByUnit(productionData);

        } catch (err) {
            console.error("Failed to load report data", err);
            setError('Failed to load report data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period]);

    const complianceRate = complianceStats.total > 0
        ? Math.round((complianceStats.compliant / complianceStats.total) * 100)
        : 0;

    const handleExportPDF = async () => {
        if (!reportRef.current || exporting) return;

        try {
            setExporting(true);

            // Wait for any animations to complete
            await new Promise(resolve => setTimeout(resolve, 500));

            const reportElement = reportRef.current;

            // Create canvas from the report content
            const canvas = await html2canvas(reportElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: reportElement.scrollWidth,
                windowHeight: reportElement.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const contentWidth = pageWidth - (margin * 2);

            // Calculate image dimensions
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Add header
            pdf.setFontSize(18);
            pdf.setTextColor(16, 185, 129); // Green color
            pdf.text('MeatTrace National Industry Report', margin, 15);

            pdf.setFontSize(10);
            pdf.setTextColor(107, 114, 128); // Gray color
            const periodLabel = period === '7d' ? 'Last 7 Days' : period === '90d' ? 'Last 90 Days' : 'Last 30 Days';
            pdf.text(`Period: ${periodLabel} | Generated: ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`, margin, 22);

            // Add a line separator
            pdf.setDrawColor(229, 231, 235);
            pdf.line(margin, 25, pageWidth - margin, 25);

            // Calculate how many pages we need
            const startY = 30;
            const availableHeight = pageHeight - startY - 15; // Leave space for footer
            let remainingHeight = imgHeight;
            let sourceY = 0;
            let currentPage = 1;

            while (remainingHeight > 0) {
                const sliceHeight = Math.min(remainingHeight, availableHeight);
                const sliceRatio = sliceHeight / imgHeight;
                const sourceHeight = canvas.height * sliceRatio;

                // Create a temporary canvas for this slice
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = sourceHeight;
                const ctx = sliceCanvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
                    const sliceData = sliceCanvas.toDataURL('image/png');
                    pdf.addImage(sliceData, 'PNG', margin, startY, imgWidth, sliceHeight);
                }

                // Add footer
                pdf.setFontSize(8);
                pdf.setTextColor(156, 163, 175);
                pdf.text(
                    `Page ${currentPage} | MeatTrace - National Meat Traceability System`,
                    pageWidth / 2,
                    pageHeight - 8,
                    { align: 'center' }
                );

                remainingHeight -= sliceHeight;
                sourceY += sourceHeight;

                if (remainingHeight > 0) {
                    pdf.addPage();
                    currentPage++;

                    // Add header on new pages
                    pdf.setFontSize(10);
                    pdf.setTextColor(107, 114, 128);
                    pdf.text('MeatTrace National Industry Report (continued)', margin, 10);
                    pdf.setDrawColor(229, 231, 235);
                    pdf.line(margin, 13, pageWidth - margin, 13);
                }
            }

            // Save the PDF
            const fileName = `meattrace-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

        } catch (err) {
            console.error('PDF export failed:', err);
            alert('Failed to export PDF. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', fontSize: '3rem' }}
                >
                    📊
                </motion.div>
                <p>Loading reports...</p>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <motion.div className="header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1><MdAssessment style={{ verticalAlign: 'middle', marginRight: '8px' }} />National Industry Reports</h1>
                <div className="actions" style={{ display: 'flex', gap: '8px' }}>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            background: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                    </select>
                    <motion.button
                        className="btn btn-secondary"
                        onClick={fetchData}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <MdRefresh /> Refresh
                    </motion.button>
                    <motion.button
                        className="btn btn-primary"
                        onClick={handleExportPDF}
                        disabled={exporting}
                        whileHover={{ scale: exporting ? 1 : 1.05 }}
                        whileTap={{ scale: exporting ? 1 : 0.95 }}
                        style={{ opacity: exporting ? 0.7 : 1, cursor: exporting ? 'wait' : 'pointer' }}
                    >
                        <MdDownload /> {exporting ? 'Exporting...' : 'Export PDF'}
                    </motion.button>
                </div>
            </motion.div>

            {error && (
                <motion.div
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

            {/* Report Content - wrapped for PDF export */}
            <div ref={reportRef} style={{ background: '#ffffff' }}>
                {/* Key Metrics Summary */}
                {analytics && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: '12px',
                            marginBottom: '20px'
                        }}
                    >
                        {[
                            { label: 'New Animals', value: analytics.new_animals_count, color: '#10b981', icon: '🐄' },
                            { label: 'New Products', value: analytics.new_products_count, color: '#6366f1', icon: '📦' },
                            { label: 'New Orders', value: analytics.new_orders_count, color: '#f59e0b', icon: '📋' },
                            { label: 'Processing Efficiency', value: `${analytics.processing_efficiency}%`, color: '#3b82f6', icon: '⚙️' },
                            { label: 'Transfer Success', value: `${analytics.transfer_success_rate}%`, color: '#8b5cf6', icon: '🔄' }
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
                                <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{stat.icon}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #6b7280)' }}>{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                )}

                <div className="dashboard-grid">
                    {/* Daily Activity Trends */}
                    <motion.div
                        className="card"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h3><MdTrendingUp /> Daily Activity Trends</h3>
                        <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>
                            Animals, products, and orders over the selected period
                        </p>
                        {dailyStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={dailyStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="new_animals" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Animals" />
                                    <Area type="monotone" dataKey="new_products" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} name="Products" />
                                    <Area type="monotone" dataKey="new_orders" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Orders" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                                No daily activity data available
                            </div>
                        )}
                    </motion.div>

                    {/* Compliance Status Pie Chart */}
                    <motion.div
                        className="card"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h3><MdPieChart /> National Compliance Status</h3>
                        <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>
                            Based on {complianceStats.total} audit{complianceStats.total !== 1 ? 's' : ''}
                        </p>
                        {complianceStats.total > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={complianceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                                    >
                                        {complianceData.map((entry, index) => (
                                            <Cell key={"cell-" + index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                                No compliance audits recorded yet
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Production by Processing Unit */}
                <motion.div
                    className="card mt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3>Production by Processing Unit</h3>
                    <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>
                        Products and active members per processing unit
                    </p>
                    {productionByUnit.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={productionByUnit}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip
                                    formatter={(value: any, name: string) => [value, name]}
                                    labelFormatter={(label: string) => {
                                        const item = productionByUnit.find(p => p.name === label);
                                        return item?.fullName || label;
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="products" fill="#6366f1" name="Products" />
                                <Bar dataKey="members" fill="#10b981" name="Members" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                            No processing unit data available
                        </div>
                    )}
                </motion.div>

                {/* Executive Summary */}
                <motion.div
                    className="card mt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h3>📋 Executive Summary</h3>
                    <div style={{ lineHeight: 1.8, color: 'var(--text-secondary, #4b5563)' }}>
                        <p>
                            <strong>Compliance Status:</strong> Current compliance rate is <strong style={{ color: complianceRate >= 80 ? '#10b981' : complianceRate >= 50 ? '#f59e0b' : '#ef4444' }}>{complianceRate}%</strong>.
                            {complianceStats.warnings > 0 && (
                                <> There are <strong style={{ color: '#f59e0b' }}>{complianceStats.warnings} active warning{complianceStats.warnings !== 1 ? 's' : ''}</strong> requiring attention.</>
                            )}
                            {complianceStats.nonCompliant > 0 && (
                                <> <strong style={{ color: '#ef4444' }}>{complianceStats.nonCompliant} critical failure{complianceStats.nonCompliant !== 1 ? 's' : ''}</strong> require{complianceStats.nonCompliant === 1 ? 's' : ''} immediate action.</>
                            )}
                        </p>
                        {analytics && (
                            <p style={{ marginTop: '12px' }}>
                                <strong>Period Activity ({period === '7d' ? 'Last 7 Days' : period === '90d' ? 'Last 90 Days' : 'Last 30 Days'}):</strong> {analytics.new_animals_count} new animals registered, {analytics.new_products_count} products created, and {analytics.new_orders_count} orders placed.
                                Processing efficiency stands at {analytics.processing_efficiency}% with a transfer success rate of {analytics.transfer_success_rate}%.
                            </p>
                        )}
                        <p style={{ marginTop: '12px' }}>
                            <strong>Data Source:</strong> This report is generated from real-time data in the MeatTrace platform.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default GovernmentReports;
