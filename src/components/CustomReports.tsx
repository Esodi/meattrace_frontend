import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdAssessment, MdFilterList, MdFileDownload, MdRefresh,
    MdDateRange, MdBusiness, MdStore, MdPerson, MdPets, MdInventory
} from 'react-icons/md';
import {
    getCustomReport, exportReportExcel,
    getShops, getProcessingUnits, getAbbatoirs
} from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportSummary {
    total_animals: number;
    total_products: number;
    total_orders: number;
    total_sales: number;
    total_revenue: number;
}

interface ReportItem {
    id: number;
    [key: string]: any;
}

const CustomReports: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        shop_id: '',
        processing_unit_id: '',
        abbatoir_id: '',
    });

    const [reportData, setReportData] = useState<{
        summary: ReportSummary;
        animals: ReportItem[];
        products: ReportItem[];
    } | null>(null);

    const [entities, setEntities] = useState<{
        shops: any[];
        units: any[];
        abbatoirs: any[];
    }>({ shops: [], units: [], abbatoirs: [] });

    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchEntities();
    }, []);

    const fetchEntities = async () => {
        try {
            const [shopsRes, unitsRes, abbatoirsRes] = await Promise.all([
                getShops(),
                getProcessingUnits(),
                getAbbatoirs()
            ]);
            setEntities({
                shops: shopsRes.data?.results || shopsRes.data || [],
                units: unitsRes.data?.results || unitsRes.data || [],
                abbatoirs: abbatoirsRes.data?.results || abbatoirsRes.data || []
            });
        } catch (err) {
            console.error("Failed to fetch entities for filters", err);
        }
    };

    const handleFetchReport = async () => {
        try {
            setLoading(true);
            const res = await getCustomReport(filters);
            setReportData(res.data);
        } catch (err) {
            console.error("Failed to fetch custom report", err);
            alert("Failed to load report data.");
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            setExporting(true);
            const response = await exportReportExcel(filters);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `meattrace_report_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (err) {
            console.error("Excel export failed", err);
            alert("Failed to export Excel report.");
        } finally {
            setExporting(false);
        }
    };

    const handleExportPDF = async () => {
        if (!reportRef.current || exporting) return;

        try {
            setExporting(true);
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`meattrace_report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error("PDF export failed", err);
            alert("Failed to export PDF report.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="admin-page">
            <motion.div
                className="header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1><MdAssessment style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Customizable Reports</h1>
                <div className="actions">
                    <motion.button
                        className="btn btn-secondary"
                        onClick={handleExportExcel}
                        disabled={!reportData || exporting}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <MdFileDownload /> Excel
                    </motion.button>
                    <motion.button
                        className="btn btn-primary"
                        onClick={handleExportPDF}
                        disabled={!reportData || exporting}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <MdFileDownload /> PDF
                    </motion.button>
                </div>
            </motion.div>

            {/* Filters Section */}
            <motion.div
                className="card mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h3><MdFilterList /> Report Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="form-group">
                        <label><MdDateRange /> Start Date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.start_date}
                            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label><MdDateRange /> End Date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.end_date}
                            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label><MdStore /> Shop</label>
                        <select
                            className="form-control"
                            value={filters.shop_id}
                            onChange={(e) => setFilters({ ...filters, shop_id: e.target.value })}
                        >
                            <option value="">All Shops</option>
                            {entities.shops.map(shop => (
                                <option key={shop.id} value={shop.id}>{shop.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label><MdBusiness /> Processing Unit</label>
                        <select
                            className="form-control"
                            value={filters.processing_unit_id}
                            onChange={(e) => setFilters({ ...filters, processing_unit_id: e.target.value })}
                        >
                            <option value="">All Processing Units</option>
                            {entities.units.map(unit => (
                                <option key={unit.id} value={unit.id}>{unit.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label><MdPerson /> Abbatoir (Abattoir)</label>
                        <select
                            className="form-control"
                            value={filters.abbatoir_id}
                            onChange={(e) => setFilters({ ...filters, abbatoir_id: e.target.value })}
                        >
                            <option value="">All Abbatoirs</option>
                            {entities.abbatoirs.map(abbatoir => (
                                <option key={abbatoir.id} value={abbatoir.id}>{abbatoir.username}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group flex items-end">
                        <motion.button
                            className="btn btn-primary w-full"
                            onClick={handleFetchReport}
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {loading ? <MdRefresh className="animate-spin" /> : <MdRefresh />} Generate Report
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Report Content */}
            <AnimatePresence>
                {reportData && (
                    <motion.div
                        ref={reportRef}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="report-result"
                    >
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                            {[
                                { label: 'Animals', value: reportData.summary.total_animals, icon: <MdPets />, color: '#10b981' },
                                { label: 'Products', value: reportData.summary.total_products, icon: <MdInventory />, color: '#6366f1' },
                                { label: 'Orders', value: reportData.summary.total_orders, icon: <MdAssessment />, color: '#f59e0b' },
                                { label: 'Sales', value: reportData.summary.total_sales, icon: <MdAssessment />, color: '#3b82f6' },
                                { label: 'Revenue', value: `TSh ${reportData.summary.total_revenue.toLocaleString()}`, icon: <MdAssessment />, color: '#ec4899' },
                            ].map((stat, i) => (
                                <div key={i} className="card text-center p-4">
                                    <div style={{ fontSize: '2rem', color: stat.color }}>{stat.icon}</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '8px 0' }}>{stat.value}</div>
                                    <div className="text-muted text-sm">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Data Tables */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="card">
                                <h3>Recent Animals in Report</h3>
                                <div className="table-responsive mt-3">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Species</th>
                                                <th>Registered At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.animals.map(a => (
                                                <tr key={a.id}>
                                                    <td>{a.animal_id}</td>
                                                    <td>{a.species}</td>
                                                    <td>{new Date(a.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                            {reportData.animals.length === 0 && (
                                                <tr><td colSpan={3} className="text-center p-4">No animals found for these filters.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="card">
                                <h3>Recent Products in Report</h3>
                                <div className="table-responsive mt-3">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Batch</th>
                                                <th>Created At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.products.map(p => (
                                                <tr key={p.id}>
                                                    <td>{p.name}</td>
                                                    <td>{p.batch_number}</td>
                                                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                            {reportData.products.length === 0 && (
                                                <tr><td colSpan={3} className="text-center p-4">No products found for these filters.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!reportData && !loading && (
                <div className="text-center p-20 text-muted">
                    <MdAssessment style={{ fontSize: '4rem', opacity: 0.2 }} />
                    <p className="mt-4">Select filters and click "Generate Report" to view data.</p>
                </div>
            )}
        </div>
    );
};

export default CustomReports;
