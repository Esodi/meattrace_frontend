import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdAssessment, MdFilterList, MdFileDownload, MdRefresh,
    MdDateRange, MdBusiness, MdStore, MdPerson, MdPets, MdInventory,
    MdReceipt, MdLocalShipping, MdWarehouse, MdBiotech, MdWarningAmber,
    MdCheckCircle, MdBuild, MdSearch, MdTableChart, MdClose,
    MdViewColumn, MdGridOn, MdOutlineTableChart,
} from 'react-icons/md';
import * as XLSX from 'xlsx';
import {
    getSalesReport, getProductionReport, getProductIssueReport,
    getAnimalsReport, getSlaughterPartsReport, getShopStockReport,
    getInTransitStockReport, getPUStockReport, getReceiptsList,
    getShops, getProcessingUnits, getAbbatoirs, getProductCategories,
} from '../services/api';
import type {
    Sale, ProductReport, AnimalReport,
    SlaughterPartReport, InventoryItem, Receipt,
} from '../types';
import ReportTable, { type ReportColumn } from './ReportTable';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './reports.css';

// ─── Utility functions ────────────────────────────────────────────────────────

const toKg = (w: number | string, unit = 'kg'): number => {
    const v = Number(w) || 0;
    if (unit === 'lbs') return v * 0.453592;
    if (unit === 'g')   return v / 1000;
    return v;
};
const fmtKg  = (w: number | string, unit = 'kg') => `${toKg(w, unit).toFixed(2)} kg`;
const fmtAmt = (a: number | string) => `TSh ${Number(a || 0).toLocaleString()}`;
/** dd/mm/yyyy */
const fmtDate = (d?: string | null): string => {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

/** dd/mm/yyyy HH:MM */
const fmtTs = (d?: string | null): string => {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};
const catName = (c: any): string => {
    if (!c) return '—';
    if (typeof c === 'object' && c.name) return c.name;
    if (typeof c === 'string') return c;
    return String(c);
};
const extractList = <T = any>(data: any): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (data?.results) return data.results as T[];
    return [];
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType =
    | 'sales_per_shop'
    | 'product_production'
    | 'product_issue'
    | 'animals'
    | 'slaughter_parts'
    | 'stock_shop'
    | 'stock_container'
    | 'stock_pu';

type ExportFormat = 'csv' | 'excel' | 'pdf';

interface ReportDef {
    id: ReportType;
    label: string;
    icon: React.ReactNode;
    description: string;
    filterKeys: string[];
}

interface MetricDef {
    label: string;
    icon: React.ReactNode;
    color: string;
    compute: (data: any[]) => string;
}

interface Filters {
    start_date: string;
    end_date: string;
    shop_id: string;
    processing_unit_id: string;
    abbatoir_id: string;
    species: string;
    product_type: string;
    category_id: string;
    part_type: string;
    payment_method: string;
    lifecycle_status: string;
}

const EMPTY_FILTERS: Filters = {
    start_date: '', end_date: '', shop_id: '', processing_unit_id: '',
    abbatoir_id: '', species: '', product_type: '', category_id: '',
    part_type: '', payment_method: '', lifecycle_status: '',
};

// ─── Report definitions ───────────────────────────────────────────────────────

const REPORT_DEFS: ReportDef[] = [
    {
        id: 'sales_per_shop',
        label: 'Sales / Shop',
        icon: <MdReceipt />,
        description: 'All sales transactions by shop — customer, payment method, line items, and revenue.',
        filterKeys: ['shop_id', 'date_range', 'payment_method'],
    },
    {
        id: 'product_production',
        label: 'Production',
        icon: <MdBuild />,
        description: 'Products created at a processing unit with batch number, weight, and source animal.',
        filterKeys: ['processing_unit_id', 'date_range', 'product_type', 'category_id'],
    },
    {
        id: 'product_issue',
        label: 'Product Issue',
        icon: <MdLocalShipping />,
        description: 'Products transferred from processing units to shops with receipt reconciliation.',
        filterKeys: ['processing_unit_id', 'shop_id', 'date_range'],
    },
    {
        id: 'animals',
        label: 'Animals',
        icon: <MdPets />,
        description: 'Animal register with species, weights, health status, and lifecycle tracking.',
        filterKeys: ['species', 'date_range', 'abbatoir_id', 'lifecycle_status'],
    },
    {
        id: 'slaughter_parts',
        label: 'Slaughter Parts',
        icon: <MdBiotech />,
        description: 'Carcass parts per animal with weight, utilization rate, and transfer status.',
        filterKeys: ['part_type', 'date_range', 'processing_unit_id'],
    },
    {
        id: 'stock_shop',
        label: 'Stock (Shop)',
        icon: <MdStore />,
        description: 'Live inventory levels at each shop — current weight, minimum levels, low-stock alerts.',
        filterKeys: ['shop_id'],
    },
    {
        id: 'stock_container',
        label: 'Stock (Container)',
        icon: <MdInventory />,
        description: 'Slaughter parts held in cold storage / containers at the abattoir — quantity in, quantity out, and current balance.',
        filterKeys: ['abbatoir_id', 'species', 'part_type', 'date_range'],
    },
    {
        id: 'stock_pu',
        label: 'Stock (PU)',
        icon: <MdWarehouse />,
        description: 'Products held at processing units — produced weight, remaining weight, and stock value.',
        filterKeys: ['processing_unit_id', 'date_range', 'product_type'],
    },
];

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: Record<ReportType, ReportColumn<any>[]> = {

    sales_per_shop: [
        {
            key: 'created_at', label: 'Timestamp',
            sortValue: r => r.created_at ? new Date(r.created_at).getTime() : 0,
            csvValue:  r => fmtTs(r.created_at),
            render:    r => <span style={{ whiteSpace: 'nowrap' }}>{fmtTs(r.created_at)}</span>,
        },
        {
            key: 'shop_name', label: 'Shop Name',
            csvValue: r => r.shop_name ?? String(r.shop ?? ''),
            render:   r => r.shop_name ?? (r.shop ? `Shop #${r.shop}` : '—'),
        },
        {
            key: 'product_name', label: 'Product Name',
            csvValue: r => r.product_name ?? '',
            render:   r => <strong>{r.product_name || '—'}</strong>,
        },
        {
            key: 'product_type', label: 'Product Type',
            csvValue: r => r.product_type ?? '',
            render:   r => {
                const cls: Record<string, string> = { meat: 'badge-danger', milk: 'badge-info', eggs: 'badge-warning', wool: 'badge-purple' };
                return <span className={`badge ${cls[r.product_type] ?? 'badge-muted'}`}>{r.product_type || '—'}</span>;
            },
        },
        {
            key: 'weight_unit', label: 'Unit',
            csvValue: r => r.weight_unit ?? '',
            render:   r => r.weight_unit || '—',
        },
        {
            key: 'quantity', label: 'Qty Sold', align: 'right',
            sortValue: r => Number(r.quantity || 0),
            csvValue:  r => String(r.quantity ?? 0),
            render:    r => <span className="cell-weight">{Number(r.quantity || 0).toFixed(2)}</span>,
        },
        {
            key: 'unit_price', label: 'Unit Price (TSh)', align: 'right',
            sortValue: r => Number(r.unit_price || 0),
            csvValue:  r => String(r.unit_price ?? 0),
            render:    r => <span className="cell-currency">{fmtAmt(r.unit_price)}</span>,
        },
        {
            key: 'subtotal', label: 'Total Amount (TSh)', align: 'right',
            sortValue: r => Number(r.subtotal || 0),
            csvValue:  r => String(r.subtotal ?? 0),
            render:    r => <span className="cell-currency">{fmtAmt(r.subtotal)}</span>,
        },
    ],

    product_production: [
        {
            key: 'created_at', label: 'Timestamp',
            sortValue: r => r.created_at ? new Date(r.created_at).getTime() : 0,
            csvValue:  r => fmtTs(r.created_at),
            render:    r => <span style={{ whiteSpace: 'nowrap' }}>{fmtTs(r.created_at)}</span>,
        },
        {
            key: 'batch_number', label: 'Batch',
            csvValue: r => r.batch_number ?? '',
            render:   r => <span className="cell-mono">{r.batch_number || '—'}</span>,
        },
        {
            key: 'name', label: 'Product',
            csvValue: r => r.name ?? '',
            render:   r => <strong>{r.name}</strong>,
        },
        {
            key: 'product_type', label: 'Type',
            csvValue: r => r.product_type ?? '',
            render:   r => {
                const cls: Record<string, string> = { meat: 'badge-danger', milk: 'badge-info', eggs: 'badge-warning', wool: 'badge-purple' };
                return <span className={`badge ${cls[r.product_type] ?? 'badge-muted'}`}>{r.product_type || '—'}</span>;
            },
        },
        {
            key: 'category', label: 'Category',
            csvValue: r => catName(r.category_name ?? r.category),
            render:   r => catName(r.category_name ?? r.category),
        },
        {
            key: 'weight_unit', label: 'Unit',
            csvValue: r => r.weight_unit ?? '',
            render:   r => r.weight_unit || '—',
        },
        {
            key: 'weight', label: 'Weight', align: 'right',
            sortValue: r => toKg(r.weight, r.weight_unit),
            csvValue:  r => fmtKg(r.weight, r.weight_unit),
            render:    r => <span className="cell-weight">{fmtKg(r.weight, r.weight_unit)}</span>,
        },
        {
            key: 'processing_unit_name', label: 'Processing Unit',
            csvValue: r => r.processing_unit_name ?? String(r.processing_unit ?? ''),
            render:   r => r.processing_unit_name ?? (r.processing_unit ? `PU #${r.processing_unit}` : '—'),
        },
        {
            key: 'animal_id', label: 'Animal ID',
            csvValue: r => r.animal_id ?? '',
            render:   r => r.animal_id
                ? <span className="cell-mono">{r.animal_id}</span>
                : <span className="badge badge-orange">External</span>,
        },
        {
            key: 'animal_species', label: 'Animal Type',
            csvValue: r => r.animal_species ?? '',
            render:   r => {
                if (!r.animal_species) return <span style={{ color: '#9ca3af' }}>—</span>;
                const cls: Record<string, string> = { cow: 'badge-warning', pig: 'badge-danger', chicken: 'badge-orange', sheep: 'badge-info', goat: 'badge-purple' };
                return <span className={`badge ${cls[r.animal_species] ?? 'badge-muted'}`}>{r.animal_species}</span>;
            },
        },
    ],

    product_issue: [
        {
            key: 'transferred_at', label: 'Issue Timestamp',
            sortValue: r => r.transferred_at ? new Date(r.transferred_at).getTime() : 0,
            csvValue:  r => fmtTs(r.transferred_at),
            render:    r => <span style={{ whiteSpace: 'nowrap' }}>{fmtTs(r.transferred_at)}</span>,
        },
        {
            key: 'batch_number', label: 'Batch Number',
            csvValue: r => r.batch_number ?? '',
            render:   r => <span className="cell-mono">{r.batch_number || '—'}</span>,
        },
        {
            key: 'animal_id', label: 'Animal Source',
            csvValue: r => r.animal_id ?? '',
            render:   r => r.animal_id
                ? <span className="cell-mono">{r.animal_id}</span>
                : <span style={{ color: '#9ca3af' }}>—</span>,
        },
        {
            key: 'name', label: 'Product Name',
            csvValue: r => r.name ?? '',
            render:   r => <strong>{r.name}</strong>,
        },
        {
            key: 'product_type', label: 'Product Type',
            csvValue: r => r.product_type ?? '',
            render:   r => {
                const cls: Record<string, string> = { meat: 'badge-danger', milk: 'badge-info', eggs: 'badge-warning', wool: 'badge-purple' };
                return <span className={`badge ${cls[r.product_type] ?? 'badge-muted'}`}>{r.product_type || '—'}</span>;
            },
        },
        {
            key: 'weight_unit', label: 'Unit',
            csvValue: r => r.weight_unit ?? '',
            render:   r => r.weight_unit || '—',
        },
        {
            key: 'transferred_to', label: 'Destination Shop',
            csvValue: r => r.transferred_to_name ?? String(r.transferred_to ?? ''),
            render:   r => r.transferred_to_name ?? (r.transferred_to ? `Shop #${r.transferred_to}` : '—'),
        },
        {
            key: 'weight', label: 'Issued (kg)', align: 'right',
            sortValue: r => toKg(r.weight, r.weight_unit),
            csvValue:  r => fmtKg(r.weight, r.weight_unit),
            render:    r => <span className="cell-weight">{fmtKg(r.weight, r.weight_unit)}</span>,
        },
        {
            key: '_total_received', label: 'Received (kg)', align: 'right',
            sortValue: r => r._total_received ?? toKg(r.weight_received ?? 0),
            csvValue:  r => fmtKg(r._total_received ?? r.weight_received ?? 0),
            render:    r => <span className="cell-weight">{fmtKg(r._total_received ?? r.weight_received ?? 0)}</span>,
        },
        {
            key: '_variance', label: 'Variance (kg)', align: 'right',
            sortValue: r => toKg(r.weight, r.weight_unit) - (r._total_received ?? toKg(r.weight_received ?? 0)),
            csvValue:  r => (toKg(r.weight, r.weight_unit) - (r._total_received ?? toKg(r.weight_received ?? 0))).toFixed(2),
            render:    r => {
                const v = toKg(r.weight, r.weight_unit) - (r._total_received ?? toKg(r.weight_received ?? 0));
                return <span className={v > 0.001 ? 'variance-neg' : 'variance-ok'}>{v.toFixed(2)}</span>;
            },
        },
        {
            key: 'status', label: 'Status', align: 'center',
            csvValue: r => r.rejection_status === 'rejected' ? 'Rejected' : !r.received_at ? 'Pending' : 'Received',
            render:   r => {
                if (r.rejection_status === 'rejected')
                    return <span className="badge badge-danger">Rejected</span>;
                if (!r.received_at)
                    return <span className="badge badge-warning">Pending</span>;
                return <span className="badge badge-success">Received</span>;
            },
        },
    ],

    animals: [
        {
            key: 'animal_id', label: 'Animal ID',
            csvValue: r => r.animal_id ?? '',
            render:   r => <span className="cell-mono">{r.animal_id}</span>,
        },
        {
            key: 'species', label: 'Species',
            csvValue: r => r.species ?? '',
            render:   r => {
                const cls: Record<string, string> = { cow: 'badge-warning', pig: 'badge-danger', chicken: 'badge-orange', sheep: 'badge-info', goat: 'badge-purple' };
                return <span className={`badge ${cls[r.species] ?? 'badge-muted'}`}>{r.species || '—'}</span>;
            },
        },
        {
            key: 'breed', label: 'Breed',
            csvValue: r => r.breed ?? '',
            render:   r => r.breed || <span style={{ color: '#9ca3af' }}>—</span>,
        },
        {
            key: 'gender', label: 'Gender', align: 'center',
            csvValue: r => r.gender ?? '',
            render:   r => r.gender || '—',
        },
        {
            key: 'age', label: 'Age (mo)', align: 'right',
            sortValue: r => Number(r.age || 0),
            csvValue:  r => String(r.age ?? ''),
            render:    r => r.age ?? '—',
        },
        {
            key: 'live_weight', label: 'Live Wt.', align: 'right',
            sortValue: r => Number(r.live_weight || 0),
            csvValue:  r => fmtKg(r.live_weight),
            render:    r => <span className="cell-weight">{fmtKg(r.live_weight)}</span>,
        },
        {
            key: 'remaining_weight', label: 'Remaining', align: 'right',
            sortValue: r => Number(r.remaining_weight || 0),
            csvValue:  r => fmtKg(r.remaining_weight),
            render:    r => <span className="cell-weight">{fmtKg(r.remaining_weight)}</span>,
        },
        {
            key: 'abbatoir_name', label: 'Abattoir Name',
            csvValue: r => r.abbatoir_name ?? String(r.abbatoir ?? ''),
            render:   r => r.abbatoir_name ?? (r.abbatoir ? `#${r.abbatoir}` : '—'),
        },
        {
            key: 'farmer_name', label: 'Supplier / Party Name',
            csvValue: r => r.farmer_name ?? '',
            render:   r => r.farmer_name || <span style={{ color: '#9ca3af' }}>—</span>,
        },
        {
            key: 'lifecycle_status', label: 'Status',
            csvValue: r => r.lifecycle_status ?? (r.slaughtered ? 'SLAUGHTERED' : 'HEALTHY'),
            render:   r => {
                const s = r.lifecycle_status ?? (r.slaughtered ? 'SLAUGHTERED' : 'HEALTHY');
                const cls: Record<string, string> = {
                    HEALTHY: 'badge-success', SLAUGHTERED: 'badge-muted',
                    TRANSFERRED: 'badge-info', 'SEMI-TRANSFERRED': 'badge-warning', REJECTED: 'badge-danger',
                };
                return <span className={`badge ${cls[s] ?? 'badge-muted'}`}>{s}</span>;
            },
        },
        {
            key: 'created_at', label: 'Timestamp',
            sortValue: r => r.created_at ? new Date(r.created_at).getTime() : 0,
            csvValue:  r => fmtTs(r.created_at),
            render:    r => <span style={{ whiteSpace: 'nowrap' }}>{fmtTs(r.created_at)}</span>,
        },
    ],

    slaughter_parts: [
        {
            key: 'created_at', label: 'Timestamp',
            sortValue: r => r.created_at ? new Date(r.created_at).getTime() : 0,
            csvValue:  r => fmtTs(r.created_at),
            render:    r => <span style={{ whiteSpace: 'nowrap' }}>{fmtTs(r.created_at)}</span>,
        },
        {
            key: 'abbatoir_name', label: 'Abattoir Name',
            csvValue: r => r.abbatoir_name ?? '',
            render:   r => r.abbatoir_name || <span style={{ color: '#9ca3af' }}>—</span>,
        },
        {
            key: 'animal_id_str', label: 'Animal ID',
            csvValue: r => r.animal_id_str ?? String(r.animal ?? ''),
            render:   r => <span className="cell-mono">{r.animal_id_str ?? (r.animal ? `#${r.animal}` : '—')}</span>,
        },
        {
            key: 'animal_species', label: 'Animal Type',
            csvValue: r => r.animal_species ?? '',
            render:   r => {
                if (!r.animal_species) return <span style={{ color: '#9ca3af' }}>—</span>;
                const cls: Record<string, string> = { cow: 'badge-warning', pig: 'badge-danger', chicken: 'badge-orange', sheep: 'badge-info', goat: 'badge-purple' };
                return <span className={`badge ${cls[r.animal_species] ?? 'badge-muted'}`}>{r.animal_species}</span>;
            },
        },
        {
            key: 'part_type', label: 'Part Name',
            csvValue: r => r.part_type ?? '',
            render:   r => {
                const label = (r.part_type ?? '').replace(/_/g, ' ');
                return <span className="badge badge-info">{label || '—'}</span>;
            },
        },
        {
            key: 'weight_unit', label: 'Unit',
            csvValue: r => r.weight_unit ?? '',
            render:   r => r.weight_unit || '—',
        },
        {
            key: 'weight', label: 'Qty Produced', align: 'right',
            sortValue: r => toKg(r.weight, r.weight_unit),
            csvValue:  r => fmtKg(r.weight, r.weight_unit),
            render:    r => <span className="cell-weight">{fmtKg(r.weight, r.weight_unit)}</span>,
        },
        {
            key: 'remaining_weight', label: 'Remaining', align: 'right',
            sortValue: r => toKg(r.remaining_weight, r.weight_unit),
            csvValue:  r => fmtKg(r.remaining_weight, r.weight_unit),
            render:    r => <span className="cell-weight">{fmtKg(r.remaining_weight, r.weight_unit)}</span>,
        },
        {
            key: 'part_id', label: 'Part ID',
            csvValue: r => r.part_id ?? '',
            render:   r => <span className="cell-mono">{r.part_id}</span>,
        },
    ],

    stock_shop: [
        {
            key: 'report_date', label: 'Report Date',
            sortValue: r => r.report_date ? new Date(r.report_date).getTime() : 0,
            csvValue:  r => fmtDate(r.report_date),
            render:    r => <span style={{ whiteSpace: 'nowrap' }}>{fmtDate(r.report_date)}</span>,
        },
        {
            key: 'shop_name', label: 'Shop Name',
            csvValue: r => r.shop_name ?? String(r.shop ?? ''),
            render:   r => r.shop_name ?? (r.shop ? `Shop #${r.shop}` : '—'),
        },
        {
            key: 'product_name', label: 'Product Name',
            csvValue: r => r.product_name ?? String(r.product ?? ''),
            render:   r => <strong>{r.product_name ?? `Product #${r.product}`}</strong>,
        },
        {
            key: 'weight_unit', label: 'Unit',
            csvValue: r => r.weight_unit ?? '',
            render:   r => r.weight_unit || '—',
        },
        {
            key: 'opening_stock', label: 'Opening Stock', align: 'right',
            sortValue: r => Number(r.opening_stock || 0),
            csvValue:  r => Number(r.opening_stock || 0).toFixed(2),
            render:    r => <span className="cell-weight">{Number(r.opening_stock || 0).toFixed(2)} kg</span>,
        },
        {
            key: 'qty_received', label: 'Qty Received', align: 'right',
            sortValue: r => Number(r.qty_received || 0),
            csvValue:  r => Number(r.qty_received || 0).toFixed(2),
            render:    r => <span className="cell-weight" style={{ color: '#15803d' }}>{Number(r.qty_received || 0).toFixed(2)} kg</span>,
        },
        {
            key: 'qty_sold', label: 'Qty Sold', align: 'right',
            sortValue: r => Number(r.qty_sold || 0),
            csvValue:  r => Number(r.qty_sold || 0).toFixed(2),
            render:    r => <span className="cell-weight" style={{ color: '#b91c1c' }}>{Number(r.qty_sold || 0).toFixed(2)} kg</span>,
        },
        {
            key: 'closing_stock', label: 'Closing Stock', align: 'right',
            sortValue: r => Number(r.closing_stock || 0),
            csvValue:  r => Number(r.closing_stock || 0).toFixed(2),
            render:    r => <span className="cell-weight" style={{ fontWeight: 700 }}>{Number(r.closing_stock || 0).toFixed(2)} kg</span>,
        },
    ],

    stock_container: [
        {
            key: 'created_at', label: 'Timestamp',
            sortValue: r => r.created_at ? new Date(r.created_at).getTime() : 0,
            csvValue:  r => fmtTs(r.created_at),
            render:    r => <span style={{ whiteSpace: 'nowrap' }}>{fmtTs(r.created_at)}</span>,
        },
        {
            key: 'abbatoir_name', label: 'Abattoir Name',
            csvValue: r => r.abbatoir_name ?? '',
            render:   r => r.abbatoir_name || <span style={{ color: '#9ca3af' }}>—</span>,
        },
        {
            key: 'animal_id_str', label: 'Animal ID',
            csvValue: r => r.animal_id_str ?? String(r.animal ?? ''),
            render:   r => <span className="cell-mono">{r.animal_id_str ?? (r.animal ? `#${r.animal}` : '—')}</span>,
        },
        {
            key: 'animal_species', label: 'Animal Type',
            csvValue: r => r.animal_species ?? '',
            render:   r => {
                if (!r.animal_species) return <span style={{ color: '#9ca3af' }}>—</span>;
                const cls: Record<string, string> = { cow: 'badge-warning', pig: 'badge-danger', chicken: 'badge-orange', sheep: 'badge-info', goat: 'badge-purple' };
                return <span className={`badge ${cls[r.animal_species] ?? 'badge-muted'}`}>{r.animal_species}</span>;
            },
        },
        {
            key: 'party_name', label: 'Party Name',
            csvValue: r => r.party_name ?? '',
            render:   r => r.party_name || <span style={{ color: '#9ca3af' }}>—</span>,
        },
        {
            key: 'part_type', label: 'Product Name',
            csvValue: r => (r.part_type ?? '').replace(/_/g, ' '),
            render:   r => {
                const label = (r.part_type ?? '').replace(/_/g, ' ');
                return <span className="badge badge-info">{label || '—'}</span>;
            },
        },
        {
            key: 'weight_unit', label: 'Unit',
            csvValue: r => r.weight_unit ?? '',
            render:   r => r.weight_unit || '—',
        },
        {
            key: 'weight', label: 'Qty In', align: 'right',
            sortValue: r => toKg(r.weight, r.weight_unit),
            csvValue:  r => fmtKg(r.weight, r.weight_unit),
            render:    r => <span className="cell-weight" style={{ color: '#15803d' }}>{fmtKg(r.weight, r.weight_unit)}</span>,
        },
        {
            key: 'qty_out', label: 'Qty Out', align: 'right',
            sortValue: r => toKg(r.weight, r.weight_unit) - toKg(r.remaining_weight, r.weight_unit),
            csvValue:  r => fmtKg(toKg(r.weight, r.weight_unit) - toKg(r.remaining_weight, r.weight_unit)),
            render:    r => {
                const out = toKg(r.weight, r.weight_unit) - toKg(r.remaining_weight, r.weight_unit);
                return <span className="cell-weight" style={{ color: '#b91c1c' }}>{fmtKg(out)}</span>;
            },
        },
        {
            key: 'remaining_weight', label: 'Current Stock', align: 'right',
            sortValue: r => toKg(r.remaining_weight, r.weight_unit),
            csvValue:  r => fmtKg(r.remaining_weight, r.weight_unit),
            render:    r => <span className="cell-weight" style={{ fontWeight: 700 }}>{fmtKg(r.remaining_weight, r.weight_unit)}</span>,
        },
    ],

    stock_pu: [
        {
            key: 'created_at', label: 'Timestamp',
            sortValue: r => r.created_at ? new Date(r.created_at).getTime() : 0,
            csvValue:  r => fmtTs(r.created_at),
            render:    r => <span style={{ whiteSpace: 'nowrap' }}>{fmtTs(r.created_at)}</span>,
        },
        {
            key: 'animal_id', label: 'Animal ID',
            csvValue: r => r.animal_id ?? '',
            render:   r => r.animal_id
                ? <span className="cell-mono">{r.animal_id}</span>
                : <span style={{ color: '#9ca3af' }}>—</span>,
        },
        {
            key: 'slaughter_part_type', label: 'Part Name',
            csvValue: r => r.slaughter_part_type ?? '',
            render:   r => r.slaughter_part_type
                ? <span className="badge badge-info">{(r.slaughter_part_type ?? '').replace(/_/g, ' ')}</span>
                : <span style={{ color: '#9ca3af' }}>—</span>,
        },
        {
            key: 'name', label: 'Product Name',
            csvValue: r => r.name ?? '',
            render:   r => <strong>{r.name}</strong>,
        },
        {
            key: 'weight_unit', label: 'Unit',
            csvValue: r => r.weight_unit ?? '',
            render:   r => r.weight_unit || '—',
        },
        {
            key: 'weight', label: 'Qty Produced', align: 'right',
            sortValue: r => toKg(r.weight, r.weight_unit),
            csvValue:  r => fmtKg(r.weight, r.weight_unit),
            render:    r => <span className="cell-weight">{fmtKg(r.weight, r.weight_unit)}</span>,
        },
        {
            key: 'qty_issued', label: 'Qty Issued', align: 'right',
            sortValue: r => toKg(r.weight, r.weight_unit) - toKg(r.remaining_weight, r.weight_unit),
            csvValue:  r => fmtKg(toKg(r.weight, r.weight_unit) - toKg(r.remaining_weight, r.weight_unit)),
            render:    r => {
                const issued = toKg(r.weight, r.weight_unit) - toKg(r.remaining_weight, r.weight_unit);
                return <span className="cell-weight" style={{ color: '#b91c1c' }}>{fmtKg(issued)}</span>;
            },
        },
        {
            key: 'remaining_weight', label: 'Current Stock', align: 'right',
            sortValue: r => toKg(r.remaining_weight, r.weight_unit),
            csvValue:  r => fmtKg(r.remaining_weight, r.weight_unit),
            render:    r => <span className="cell-weight" style={{ fontWeight: 700 }}>{fmtKg(r.remaining_weight, r.weight_unit)}</span>,
        },
        {
            key: 'processing_unit_name', label: 'Processing Unit',
            csvValue: r => r.processing_unit_name ?? String(r.processing_unit ?? ''),
            render:   r => r.processing_unit_name ?? (r.processing_unit ? `PU #${r.processing_unit}` : '—'),
        },
    ],
};

// ─── Summary metric definitions ───────────────────────────────────────────────

const METRICS: Record<ReportType, MetricDef[]> = {
    sales_per_shop: [
        { label: 'Line Items',     icon: <MdReceipt />,     color: '#10b981', compute: d => d.length.toLocaleString() },
        { label: 'Total Revenue',  icon: <MdAssessment />,  color: '#b91c1c', compute: d => fmtAmt(d.reduce((s, r) => s + Number(r.subtotal || 0), 0)) },
        { label: 'Avg. Unit Price',icon: <MdTableChart />,  color: '#7c3aed', compute: d => d.length ? fmtAmt(d.reduce((s, r) => s + Number(r.unit_price || 0), 0) / d.length) : '—' },
        { label: 'Unique Products',icon: <MdInventory />,   color: '#0369a1', compute: d => new Set(d.map((r: any) => r.product).filter(Boolean)).size.toLocaleString() },
    ],
    product_production: [
        { label: 'Products',      icon: <MdBuild />,       color: '#10b981', compute: d => d.length.toLocaleString() },
        { label: 'Total Weight',  icon: <MdAssessment />,  color: '#b91c1c', compute: d => fmtKg(d.reduce((s, r) => s + toKg(r.weight, r.weight_unit), 0)) },
        { label: 'Batches',       icon: <MdTableChart />,  color: '#7c3aed', compute: d => new Set(d.map((r: any) => r.batch_number).filter(Boolean)).size.toLocaleString() },
        { label: 'External Src',  icon: <MdWarningAmber />,color: '#d97706', compute: d => d.filter((r: any) => r.is_external_source).length.toLocaleString() },
    ],
    product_issue: [
        { label: 'Transfers',     icon: <MdLocalShipping />,color: '#0369a1', compute: d => d.length.toLocaleString() },
        { label: 'Total Issued',  icon: <MdAssessment />,  color: '#b91c1c', compute: d => fmtKg(d.reduce((s, r) => s + toKg(r.weight, r.weight_unit), 0)) },
        { label: 'Pending',       icon: <MdInventory />,   color: '#d97706', compute: d => d.filter((r: any) => !r.received_at && r.rejection_status !== 'rejected').length.toLocaleString() },
        { label: 'Rejected',      icon: <MdWarningAmber />,color: '#dc2626', compute: d => d.filter((r: any) => r.rejection_status === 'rejected').length.toLocaleString() },
    ],
    animals: [
        { label: 'Total Animals', icon: <MdPets />,        color: '#10b981', compute: d => d.length.toLocaleString() },
        { label: 'Total Live Wt.',icon: <MdAssessment />,  color: '#b91c1c', compute: d => fmtKg(d.reduce((s, r) => s + Number(r.live_weight || 0), 0)) },
        { label: 'Slaughtered',   icon: <MdTableChart />,  color: '#6b7280', compute: d => d.filter((r: any) => r.slaughtered).length.toLocaleString() },
        { label: 'Rejected',      icon: <MdWarningAmber />,color: '#dc2626', compute: d => d.filter((r: any) => r.rejection_status === 'rejected').length.toLocaleString() },
    ],
    slaughter_parts: [
        { label: 'Parts',         icon: <MdBiotech />,     color: '#0369a1', compute: d => d.length.toLocaleString() },
        { label: 'Total Weight',  icon: <MdAssessment />,  color: '#b91c1c', compute: d => fmtKg(d.reduce((s, r) => s + toKg(r.weight, r.weight_unit), 0)) },
        { label: 'Remaining Wt.', icon: <MdInventory />,   color: '#d97706', compute: d => fmtKg(d.reduce((s, r) => s + toKg(r.remaining_weight, r.weight_unit), 0)) },
        { label: 'In Products',   icon: <MdCheckCircle />, color: '#10b981', compute: d => d.filter((r: any) => r.used_in_product).length.toLocaleString() },
    ],
    stock_shop: [
        { label: 'Products',       icon: <MdStore />,        color: '#0369a1', compute: d => d.length.toLocaleString() },
        { label: 'Total Received', icon: <MdAssessment />,   color: '#10b981', compute: d => fmtKg(d.reduce((s, r) => s + Number(r.qty_received || 0), 0)) },
        { label: 'Total Sold',     icon: <MdReceipt />,      color: '#b91c1c', compute: d => fmtKg(d.reduce((s, r) => s + Number(r.qty_sold || 0), 0)) },
        { label: 'Closing Stock',  icon: <MdInventory />,    color: '#7c3aed', compute: d => fmtKg(d.reduce((s, r) => s + Number(r.closing_stock || 0), 0)) },
    ],
    stock_container: [
        { label: 'Parts in Storage', icon: <MdInventory />,    color: '#0369a1', compute: d => d.length.toLocaleString() },
        { label: 'Total Qty In',     icon: <MdAssessment />,   color: '#10b981', compute: d => fmtKg(d.reduce((s, r) => s + toKg(r.weight, r.weight_unit), 0)) },
        { label: 'Total Qty Out',    icon: <MdLocalShipping />,color: '#b91c1c', compute: d => fmtKg(d.reduce((s, r) => s + (toKg(r.weight, r.weight_unit) - toKg(r.remaining_weight, r.weight_unit)), 0)) },
        { label: 'Current Stock',    icon: <MdWarehouse />,    color: '#7c3aed', compute: d => fmtKg(d.reduce((s, r) => s + toKg(r.remaining_weight, r.weight_unit), 0)) },
    ],
    stock_pu: [
        { label: 'Products',       icon: <MdWarehouse />,    color: '#0369a1', compute: d => d.length.toLocaleString() },
        { label: 'Total Produced', icon: <MdAssessment />,   color: '#b91c1c', compute: d => fmtKg(d.reduce((s, r) => s + toKg(r.weight, r.weight_unit), 0)) },
        { label: 'Total Issued',   icon: <MdLocalShipping />,color: '#d97706', compute: d => fmtKg(d.reduce((s, r) => s + (toKg(r.weight, r.weight_unit) - toKg(r.remaining_weight, r.weight_unit)), 0)) },
        { label: 'Current Stock',  icon: <MdInventory />,    color: '#10b981', compute: d => fmtKg(d.reduce((s, r) => s + toKg(r.remaining_weight, r.weight_unit), 0)) },
    ],
};

// ─── Date preset helper ───────────────────────────────────────────────────────

const toStr = (d: Date) => d.toISOString().split('T')[0];

const DATE_PRESETS = [
    { id: '7d',  label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
    { id: 'ytd', label: 'YTD' },
];

// ─── Export Preview Modal ─────────────────────────────────────────────────────

interface ExportPreviewProps {
    reportType: ReportType;
    reportLabel: string;
    data: any[];
    visibleColumns: ReportColumn<any>[];
    onConfirm: (fmt: ExportFormat) => void;
    onClose: () => void;
}

const ExportPreviewModal: React.FC<ExportPreviewProps> = ({
    reportType, reportLabel, data, visibleColumns, onConfirm, onClose,
}) => {
    const [fmt, setFmt] = useState<ExportFormat>('csv');
    const preview = data.slice(0, 5);

    return (
        <div className="export-modal-backdrop" onClick={onClose}>
            <motion.div
                className="export-modal"
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ duration: 0.18 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="export-modal-header">
                    <div className="export-modal-title">
                        <MdFileDownload />
                        Export Preview
                    </div>
                    <button className="export-modal-close" onClick={onClose} aria-label="Close">
                        <MdClose />
                    </button>
                </div>

                {/* Meta */}
                <div className="export-modal-meta">
                    <span className="export-meta-pill"><MdOutlineTableChart /> {reportLabel}</span>
                    <span className="export-meta-pill"><MdGridOn /> {data.length.toLocaleString()} records</span>
                    <span className="export-meta-pill"><MdViewColumn /> {visibleColumns.length} columns</span>
                </div>

                {/* Format picker */}
                <div className="export-format-row">
                    {(['csv', 'excel', 'pdf'] as ExportFormat[]).map(f => (
                        <button
                            key={f}
                            className={`export-format-btn${fmt === f ? ' ef-active' : ''}`}
                            onClick={() => setFmt(f)}
                        >
                            {f === 'csv'   && '📄 CSV'}
                            {f === 'excel' && '📊 Excel'}
                            {f === 'pdf'   && '📑 PDF'}
                        </button>
                    ))}
                </div>

                {/* Column list */}
                <div className="export-modal-section-label">Columns to export</div>
                <div className="export-col-chips">
                    {visibleColumns.map(c => (
                        <span key={c.key} className="export-col-chip">{c.label}</span>
                    ))}
                </div>

                {/* Data preview table */}
                {preview.length > 0 && (
                    <>
                        <div className="export-modal-section-label">
                            Preview — first {Math.min(5, data.length)} of {data.length} rows
                        </div>
                        <div className="export-preview-table-wrap">
                            <table className="export-preview-table">
                                <thead>
                                    <tr>
                                        {visibleColumns.map(c => <th key={c.key}>{c.label}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.map((row, i) => (
                                        <tr key={i}>
                                            {visibleColumns.map(c => (
                                                <td key={c.key}>
                                                    {c.csvValue ? c.csvValue(row) : String((row as any)[c.key] ?? '—')}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Actions */}
                <div className="export-modal-actions">
                    <button className="btn-reset" onClick={onClose}>Cancel</button>
                    <motion.button
                        className="btn btn-primary"
                        onClick={() => { onConfirm(fmt); onClose(); }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <MdFileDownload /> Export {fmt.toUpperCase()}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Column Configurator Panel ────────────────────────────────────────────────

interface ColConfigProps {
    reportType: ReportType;
    allColumns: ReportColumn<any>[];
    visible: Set<string>;
    onChange: (key: string, checked: boolean) => void;
    onReset: () => void;
    onClose: () => void;
}

const ColumnConfigurator: React.FC<ColConfigProps> = ({
    allColumns, visible, onChange, onReset, onClose,
}) => (
    <motion.div
        className="col-config-panel"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.18 }}
    >
        <div className="col-config-header">
            <span><MdViewColumn /> Columns</span>
            <button className="col-config-close" onClick={onClose} aria-label="Close column configurator">
                <MdClose />
            </button>
        </div>
        <div className="col-config-list">
            {allColumns.map(col => (
                <label key={col.key} className="col-config-item">
                    <input
                        type="checkbox"
                        checked={visible.has(col.key)}
                        onChange={e => onChange(col.key, e.target.checked)}
                    />
                    <span>{col.label}</span>
                </label>
            ))}
        </div>
        <button className="btn-reset col-config-reset" onClick={onReset}>
            <MdRefresh style={{ fontSize: '0.9rem' }} /> Reset
        </button>
    </motion.div>
);

// ─── Client-side filter (backend ignores most query params) ──────────────────
//
// The backend only honours:  species, slaughtered (animals)  •  part_type (slaughter parts)
// Everything else — shop_id, processing_unit_id, abbatoir_id, start/end date,
// payment_method, product_type, category_id — must be applied client-side.
//
const applyClientFilters = (list: any[], reportType: ReportType, filters: Filters): any[] => {
    const startTs = filters.start_date ? new Date(filters.start_date + 'T00:00:00').getTime() : null;
    const endTs   = filters.end_date   ? new Date(filters.end_date   + 'T23:59:59').getTime() : null;
    const shopId  = filters.shop_id            ? Number(filters.shop_id)            : null;
    const puId    = filters.processing_unit_id ? Number(filters.processing_unit_id) : null;
    const abbId   = filters.abbatoir_id        ? Number(filters.abbatoir_id)        : null;

    const inRange = (dateStr?: string | null) => {
        if (!startTs && !endTs) return true;
        const t = dateStr ? new Date(dateStr).getTime() : 0;
        return (!startTs || t >= startTs) && (!endTs || t <= endTs);
    };

    let r = list;

    switch (reportType) {
        case 'sales_per_shop':
            if (shopId)                    r = r.filter(x => x.shop === shopId);
            if (filters.payment_method)    r = r.filter(x => x.payment_method === filters.payment_method);
            if (startTs || endTs)          r = r.filter(x => inRange(x.created_at));
            break;

        case 'product_production':
            if (puId)                      r = r.filter(x => x.processing_unit === puId);
            if (filters.product_type)      r = r.filter(x => x.product_type === filters.product_type);
            if (filters.category_id) {
                r = r.filter(x => {
                    const cat = x.category;
                    const catId = typeof cat === 'object' && cat !== null ? cat.id : cat;
                    return String(catId) === filters.category_id;
                });
            }
            if (startTs || endTs)          r = r.filter(x => inRange(x.created_at));
            break;

        case 'product_issue':
            if (puId)                      r = r.filter(x => x.processing_unit === puId);
            if (startTs || endTs)          r = r.filter(x => inRange(x.transferred_at));
            break;

        case 'animals':
            if (abbId)                     r = r.filter(x => x.abbatoir === abbId);
            if (filters.species)           r = r.filter(x => x.species === filters.species);
            if (startTs || endTs)          r = r.filter(x => inRange(x.created_at));
            break;

        case 'slaughter_parts':
            if (puId)                      r = r.filter(x => x.transferred_to === puId);
            if (filters.part_type)         r = r.filter(x => x.part_type === filters.part_type);
            if (startTs || endTs)          r = r.filter(x => inRange(x.created_at));
            break;

        case 'stock_container':
            // Cold room: slaughter parts — filter by abattoir and date created
            if (abbId)                     r = r.filter(x => x.abbatoir === abbId || x.animal?.abbatoir === abbId);
            if (filters.species)           r = r.filter(x => x.animal_species === filters.species);
            if (filters.part_type)         r = r.filter(x => x.part_type === filters.part_type);
            if (startTs || endTs)          r = r.filter(x => inRange(x.created_at));
            break;

        case 'stock_pu':
            if (puId)                      r = r.filter(x => x.processing_unit === puId);
            if (filters.product_type)      r = r.filter(x => x.product_type === filters.product_type);
            if (startTs || endTs)          r = r.filter(x => inRange(x.created_at));
            break;
    }

    return r;
};

// ─── localStorage helper ──────────────────────────────────────────────────────

const loadVisibleCols = (reportType: ReportType, allCols: ReportColumn<any>[]): Set<string> => {
    try {
        const stored = localStorage.getItem(`reportColumns_${reportType}`);
        if (stored) {
            const parsed: string[] = JSON.parse(stored);
            const validKeys = new Set(allCols.map(c => c.key));
            return new Set(parsed.filter(k => validKeys.has(k)));
        }
    } catch { /* ignore */ }
    return new Set(allCols.map(c => c.key));
};

const saveVisibleCols = (reportType: ReportType, keys: Set<string>) => {
    try {
        localStorage.setItem(`reportColumns_${reportType}`, JSON.stringify([...keys]));
    } catch { /* ignore */ }
};

// ─── Component ────────────────────────────────────────────────────────────────

const CustomReports: React.FC = () => {
    const [activeReport, setActiveReport]   = useState<ReportType>('sales_per_shop');
    const [filters, setFilters]             = useState<Filters>(EMPTY_FILTERS);
    const [datePreset, setDatePreset]       = useState('');
    const [reportData, setReportData]       = useState<any[]>([]);
    const [totalCount, setTotalCount]       = useState<number | null>(null);
    const [hasGenerated, setHasGenerated]   = useState(false);
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState<string | null>(null);
    const [exporting, setExporting]         = useState(false);
    const [showExportPreview, setShowExportPreview] = useState(false);
    const [showColConfig, setShowColConfig] = useState(false);
    const [visibleCols, setVisibleCols]     = useState<Set<string>>(
        () => loadVisibleCols('sales_per_shop', COLUMNS['sales_per_shop'])
    );
    const [entities, setEntities] = useState({
        shops: [] as any[], units: [] as any[],
        abbatoirs: [] as any[], categories: [] as any[],
    });

    const reportRef  = useRef<HTMLDivElement>(null);
    const abortRef   = useRef<AbortController | null>(null);

    // ── Load dropdown entities ───────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const [s, u, a, c] = await Promise.all([
                    getShops(), getProcessingUnits(), getAbbatoirs(), getProductCategories(),
                ]);
                setEntities({
                    shops:      extractList(s.data),
                    units:      extractList(u.data),
                    abbatoirs:  extractList(a.data),
                    categories: extractList(c.data),
                });
            } catch { /* non-fatal */ }
        })();
    }, []);

    // ── Reset results on report type change ──────────────────────────────────
    useEffect(() => {
        abortRef.current?.abort();
        setReportData([]);
        setTotalCount(null);
        setError(null);
        setHasGenerated(false);
        setShowColConfig(false);
        // Load saved column visibility for the new report type
        setVisibleCols(loadVisibleCols(activeReport, COLUMNS[activeReport]));
    }, [activeReport]);

    // ── Apply date preset ────────────────────────────────────────────────────
    const applyPreset = (id: string) => {
        const today = new Date();
        const map: Record<string, Date> = {
            '7d':  new Date(Date.now() - 7  * 86_400_000),
            '30d': new Date(Date.now() - 30 * 86_400_000),
            '90d': new Date(Date.now() - 90 * 86_400_000),
            'ytd': new Date(today.getFullYear(), 0, 1),
        };
        setDatePreset(id);
        setFilters(f => ({ ...f, start_date: toStr(map[id]), end_date: toStr(today) }));
    };

    const setFilter = (key: keyof Filters, value: string) => {
        if (key === 'start_date' || key === 'end_date') setDatePreset('custom');
        setFilters(f => ({ ...f, [key]: value }));
    };

    const resetFilters = () => {
        setFilters(EMPTY_FILTERS);
        setDatePreset('');
    };

    // ── Column visibility ────────────────────────────────────────────────────
    const toggleCol = useCallback((key: string, checked: boolean) => {
        setVisibleCols(prev => {
            const next = new Set(prev);
            if (checked) next.add(key); else next.delete(key);
            saveVisibleCols(activeReport, next);
            return next;
        });
    }, [activeReport]);

    const resetCols = useCallback(() => {
        const all = new Set(COLUMNS[activeReport].map(c => c.key));
        setVisibleCols(all);
        saveVisibleCols(activeReport, all);
    }, [activeReport]);

    // ── Generate report ──────────────────────────────────────────────────────
    const handleGenerate = async () => {
        // Cancel any in-flight request
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        const { signal } = ctrl;

        setLoading(true);
        setError(null);
        setReportData([]);
        setTotalCount(null);
        setHasGenerated(true);

        try {
            switch (activeReport) {

                case 'sales_per_shop': {
                    const res   = await getSalesReport({}, signal);
                    const sales = extractList<Sale>(res.data);
                    // Flatten each receipt into individual line-item rows so every
                    // product sold appears as its own row with Shop, Product, Unit, Qty, Price.
                    const lineItems = sales.flatMap(sale =>
                        (sale.items ?? []).map(item => ({
                            ...item,
                            shop:           sale.shop,
                            shop_name:      sale.shop_name,
                            receipt_uuid:   sale.receipt_uuid,
                            customer_name:  sale.customer_name,
                            payment_method: sale.payment_method,
                            created_at:     sale.created_at,
                        }))
                    );
                    const list = applyClientFilters(lineItems, 'sales_per_shop', filters);
                    setReportData(list); setTotalCount(list.length);
                    break;
                }

                case 'product_production': {
                    const res  = await getProductionReport({}, signal);
                    const list = applyClientFilters(extractList<ProductReport>(res.data), 'product_production', filters);
                    setReportData(list); setTotalCount(list.length);
                    break;
                }

                case 'product_issue': {
                    const [pRes, rRes] = await Promise.all([
                        getProductIssueReport({}, signal),
                        getReceiptsList({}, signal),
                    ]);
                    const allProducts = extractList<ProductReport>(pRes.data).filter(p => p.transferred_to != null);
                    const receipts    = extractList<Receipt>(rRes.data);
                    const rMap: Record<number, Receipt[]> = {};
                    receipts.forEach(r => { (rMap[r.product] ??= []).push(r); });
                    const merged = allProducts.map(p => ({
                        ...p,
                        _receipts:       rMap[p.id] ?? [],
                        _total_received: (rMap[p.id] ?? []).reduce((s, r) => s + toKg(r.received_weight, r.weight_unit), 0),
                    }));
                    const list = applyClientFilters(merged, 'product_issue', filters);
                    // Apply shop filter separately (transferred_to is a Shop FK)
                    const finalList = filters.shop_id
                        ? list.filter(p => String(p.transferred_to) === filters.shop_id)
                        : list;
                    setReportData(finalList); setTotalCount(finalList.length);
                    break;
                }

                case 'animals': {
                    const res  = await getAnimalsReport({ species: filters.species }, signal);
                    let   list = applyClientFilters(extractList<AnimalReport>(res.data), 'animals', filters);
                    if (filters.lifecycle_status)
                        list = list.filter(a => (a.lifecycle_status ?? '').toUpperCase() === filters.lifecycle_status.toUpperCase());
                    setReportData(list); setTotalCount(list.length);
                    break;
                }

                case 'slaughter_parts': {
                    const [partsRes, animalsRes] = await Promise.all([
                        getSlaughterPartsReport({ part_type: filters.part_type }, signal),
                        getAnimalsReport({}, signal),
                    ]);
                    const parts   = extractList<SlaughterPartReport>(partsRes.data);
                    const animals = extractList<AnimalReport>(animalsRes.data);
                    // Build a map: animal PK → { abbatoir_name, species } for enrichment
                    const animalMap: Record<number, { abbatoir_name?: string; species?: string }> = {};
                    animals.forEach(a => { animalMap[a.id] = { abbatoir_name: a.abbatoir_name, species: a.species }; });
                    const enriched = parts.map(p => ({
                        ...p,
                        abbatoir_name:  p.abbatoir_name  ?? animalMap[p.animal]?.abbatoir_name,
                        animal_species: p.animal_species ?? animalMap[p.animal]?.species,
                    }));
                    const list = applyClientFilters(enriched, 'slaughter_parts', filters);
                    setReportData(list); setTotalCount(list.length);
                    break;
                }

                case 'stock_shop': {
                    // Fetch sales and receipts in parallel; also attempt inventory snapshot.
                    const [salesRes, receiptsRes] = await Promise.all([
                        getSalesReport({}, signal),
                        getReceiptsList({}, signal),
                    ]);
                    const sales    = extractList<Sale>(salesRes.data);
                    const receipts = extractList<Receipt>(receiptsRes.data);

                    // Helper to check if a date falls in the chosen filter range.
                    const startTs = filters.start_date ? new Date(filters.start_date + 'T00:00:00').getTime() : null;
                    const endTs   = filters.end_date   ? new Date(filters.end_date   + 'T23:59:59').getTime() : null;
                    const inRange = (d?: string | null) => {
                        const t = d ? new Date(d).getTime() : 0;
                        return (!startTs || t >= startTs) && (!endTs || t <= endTs);
                    };

                    // Aggregate sold qty per `${shop}-${product}` key.
                    const soldMap: Record<string, number>         = {};
                    const productNameMap: Record<string, string>  = {};
                    const weightUnitMap: Record<string, string>   = {};
                    const shopNameMap: Record<string, string>     = {};
                    sales.forEach(sale => {
                        if (!inRange(sale.created_at)) return;
                        if (filters.shop_id && String(sale.shop) !== filters.shop_id) return;
                        shopNameMap[String(sale.shop)] = sale.shop_name ?? `Shop #${sale.shop}`;
                        (sale.items ?? []).forEach(item => {
                            const key = `${sale.shop}-${item.product}`;
                            soldMap[key] = (soldMap[key] ?? 0) + toKg(item.weight, item.weight_unit);
                            if (item.product_name) productNameMap[String(item.product)] = item.product_name;
                            if (item.weight_unit)  weightUnitMap[String(item.product)]  = item.weight_unit;
                        });
                    });

                    // Aggregate received qty per `${shop}-${product}` key.
                    const receivedMap: Record<string, number> = {};
                    receipts.forEach(r => {
                        if (!inRange(r.received_at)) return;
                        if (filters.shop_id && String(r.shop) !== filters.shop_id) return;
                        const key = `${r.shop}-${r.product}`;
                        receivedMap[key] = (receivedMap[key] ?? 0) + toKg(r.received_weight, r.weight_unit);
                        if (r.product_name) productNameMap[String(r.product)] = r.product_name;
                    });

                    // Try inventory snapshot for closing stock; fall back to receipts−sold.
                    let inventoryItems: InventoryItem[] = [];
                    try {
                        const invRes = await getShopStockReport({ shop_id: filters.shop_id }, signal);
                        inventoryItems = extractList<InventoryItem>(invRes.data);
                    } catch { /* endpoint may not be implemented — derive below */ }

                    const reportDate = filters.end_date || new Date().toISOString().split('T')[0];
                    let result: any[];

                    if (inventoryItems.length > 0) {
                        result = inventoryItems.map(inv => {
                            const key          = `${inv.shop}-${inv.product}`;
                            const qtySold      = soldMap[key]     ?? 0;
                            const qtyReceived  = receivedMap[key] ?? 0;
                            const closingStock = toKg(inv.weight, inv.weight_unit);
                            return {
                                ...inv,
                                qty_sold:      qtySold,
                                qty_received:  qtyReceived,
                                opening_stock: Math.max(0, closingStock + qtySold - qtyReceived),
                                closing_stock: closingStock,
                                report_date:   reportDate,
                            };
                        });
                    } else {
                        // Derive rows entirely from transaction data.
                        const allKeys = new Set([...Object.keys(soldMap), ...Object.keys(receivedMap)]);
                        result = Array.from(allKeys).map(key => {
                            const [shopId, productId] = key.split('-');
                            const qtySold     = soldMap[key]     ?? 0;
                            const qtyReceived = receivedMap[key] ?? 0;
                            const closing     = Math.max(0, qtyReceived - qtySold);
                            return {
                                shop:          Number(shopId),
                                shop_name:     shopNameMap[shopId] ?? `Shop #${shopId}`,
                                product:       Number(productId),
                                product_name:  productNameMap[productId] ?? `Product #${productId}`,
                                weight_unit:   weightUnitMap[productId] ?? 'kg',
                                qty_sold:      qtySold,
                                qty_received:  qtyReceived,
                                opening_stock: 0,
                                closing_stock: closing,
                                report_date:   reportDate,
                            };
                        });
                    }

                    const filteredList = filters.shop_id
                        ? result.filter((x: any) => String(x.shop) === filters.shop_id)
                        : result;
                    setReportData(filteredList); setTotalCount(filteredList.length);
                    break;
                }

                case 'stock_container': {
                    // Cold room / container stock: slaughter parts from the abattoir,
                    // enriched with animal and abattoir metadata.
                    const [partsRes, animalsRes] = await Promise.all([
                        getSlaughterPartsReport({}, signal),
                        getAnimalsReport({}, signal),
                    ]);
                    const parts   = extractList<SlaughterPartReport>(partsRes.data);
                    const animals = extractList<AnimalReport>(animalsRes.data);

                    // Build animal lookup: animal PK → full animal record.
                    const animalMap: Record<number, AnimalReport> = {};
                    animals.forEach(a => { animalMap[a.id] = a; });

                    const enriched = parts.map(p => {
                        const a = animalMap[p.animal];
                        return {
                            ...p,
                            abbatoir_name:  p.abbatoir_name  ?? a?.abbatoir_name,
                            animal_id_str:  p.animal_id_str  ?? a?.animal_id,
                            animal_species: p.animal_species ?? a?.species,
                            party_name:     a?.farmer_name,
                        };
                    });

                    const list = applyClientFilters(enriched, 'stock_container', filters);
                    setReportData(list); setTotalCount(list.length);
                    break;
                }

                case 'stock_pu': {
                    const res  = await getPUStockReport({}, signal);
                    const list = applyClientFilters(extractList<ProductReport>(res.data), 'stock_pu', filters);
                    setReportData(list); setTotalCount(list.length);
                    break;
                }
            }
        } catch (err: any) {
            if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
            setError(
                err?.response?.data?.detail
                || err?.response?.data?.message
                || err?.message
                || 'Failed to load report. Check your filters and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // ── Visible columns (filtered by toggle) ─────────────────────────────────
    const allCols     = COLUMNS[activeReport];
    const activeCols  = useMemo(
        () => allCols.filter(c => visibleCols.has(c.key)),
        [allCols, visibleCols]
    );

    // ── Export helpers ───────────────────────────────────────────────────────
    const doExportCSV = useCallback(() => {
        if (!reportData.length) return;
        const header = activeCols.map(c => `"${c.label}"`).join(',');
        const rows   = reportData.map(row =>
            activeCols.map(c => {
                const v = c.csvValue ? c.csvValue(row) : String((row as any)[c.key] ?? '');
                return `"${v.replace(/"/g, '""')}"`;
            }).join(',')
        );
        const csv  = [header, ...rows].join('\n');
        const url  = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const link = Object.assign(document.createElement('a'), {
            href: url,
            download: `meattrace_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`,
        });
        link.click();
        URL.revokeObjectURL(url);
    }, [reportData, activeCols, activeReport]);

    const doExportExcel = useCallback(() => {
        if (!reportData.length) return;
        const wsData = [
            activeCols.map(c => c.label),
            ...reportData.map(row =>
                activeCols.map(c => c.csvValue ? c.csvValue(row) : String((row as any)[c.key] ?? ''))
            ),
        ];
        const ws  = XLSX.utils.aoa_to_sheet(wsData);
        const wb  = XLSX.utils.book_new();
        const def = REPORT_DEFS.find(d => d.id === activeReport);
        // Excel sheet names may not contain: : \ / ? * [ ]  and max 31 chars
        const sheetName = (def?.label ?? 'Report')
            .replace(/[:/\\?*[\]]/g, '-')
            .slice(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `meattrace_${activeReport}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }, [reportData, activeCols, activeReport]);

    const doExportPDF = useCallback(async () => {
        if (!reportRef.current || exporting) return;
        setExporting(true);
        try {
            const canvas  = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf     = new jsPDF('l', 'mm', 'a4');
            const pdfW    = pdf.internal.pageSize.getWidth();
            const pdfH    = (canvas.height * pdfW) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
            pdf.save(`meattrace_${activeReport}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch { /* silent */ }
        finally { setExporting(false); }
    }, [reportRef, exporting, activeReport]);

    const handleExportConfirm = useCallback((fmt: ExportFormat) => {
        if (fmt === 'csv')   doExportCSV();
        if (fmt === 'excel') doExportExcel();
        if (fmt === 'pdf')   doExportPDF();
    }, [doExportCSV, doExportExcel, doExportPDF]);

    // ── Derived ──────────────────────────────────────────────────────────────
    const activeDef = REPORT_DEFS.find(d => d.id === activeReport)!;
    const metrics   = useMemo(() => METRICS[activeReport].map(m => ({ ...m, value: m.compute(reportData) })), [activeReport, reportData]);
    const hasData   = reportData.length > 0;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="admin-page">

            {/* ── Page header ──────────────────────────────────────────── */}
            <motion.div className="header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1>
                    <MdAssessment style={{ verticalAlign: 'middle', marginRight: 8 }} />
                    Reports
                </h1>
                <div className="report-export-bar">
                    <motion.button
                        className="btn btn-secondary"
                        onClick={() => { if (hasData) setShowExportPreview(true); }}
                        disabled={!hasData || exporting}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        title="Export report"
                    >
                        <MdFileDownload /> Export
                    </motion.button>
                </div>
            </motion.div>

            {/* ── Report type selector ─────────────────────────────────── */}
            <motion.div
                className="card report-selector-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
            >
                <div className="filter-section-label">
                    <MdTableChart /> Select Report
                </div>

                <div className="report-selector-grid">
                    {REPORT_DEFS.map(def => (
                        <motion.button
                            key={def.id}
                            className={`report-type-card${activeReport === def.id ? ' rtc-active' : ''}`}
                            onClick={() => setActiveReport(def.id)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            aria-pressed={activeReport === def.id}
                        >
                            <span className="rtc-icon">{def.icon}</span>
                            <span className="rtc-label">{def.label}</span>
                        </motion.button>
                    ))}
                </div>

                <div className="report-desc-bar">{activeDef.description}</div>
            </motion.div>

            {/* ── Filter panel ─────────────────────────────────────────── */}
            <motion.div
                key={activeReport + '_filters'}
                className="card report-filter-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="filter-section-label">
                    <MdFilterList /> Filters
                </div>

                {/* Date presets */}
                {activeDef.filterKeys.includes('date_range') && (
                    <div className="date-presets">
                        {DATE_PRESETS.map(p => (
                            <button
                                key={p.id}
                                className={`date-preset-btn${datePreset === p.id ? ' preset-active' : ''}`}
                                onClick={() => applyPreset(p.id)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="filter-grid">
                    {/* Date range inputs */}
                    {activeDef.filterKeys.includes('date_range') && <>
                        <div className="form-group">
                            <label><MdDateRange style={{ verticalAlign: 'middle' }} /> Start Date</label>
                            <input type="date" className="form-control"
                                value={filters.start_date}
                                onChange={e => setFilter('start_date', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label><MdDateRange style={{ verticalAlign: 'middle' }} /> End Date</label>
                            <input type="date" className="form-control"
                                value={filters.end_date}
                                onChange={e => setFilter('end_date', e.target.value)} />
                        </div>
                    </>}

                    {activeDef.filterKeys.includes('shop_id') && (
                        <div className="form-group">
                            <label><MdStore style={{ verticalAlign: 'middle' }} /> Shop</label>
                            <select className="form-control" value={filters.shop_id}
                                onChange={e => setFilter('shop_id', e.target.value)}>
                                <option value="">All Shops</option>
                                {entities.shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}

                    {activeDef.filterKeys.includes('processing_unit_id') && (
                        <div className="form-group">
                            <label><MdBusiness style={{ verticalAlign: 'middle' }} /> Processing Unit</label>
                            <select className="form-control" value={filters.processing_unit_id}
                                onChange={e => setFilter('processing_unit_id', e.target.value)}>
                                <option value="">All Units</option>
                                {entities.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                    )}

                    {activeDef.filterKeys.includes('abbatoir_id') && (
                        <div className="form-group">
                            <label><MdPerson style={{ verticalAlign: 'middle' }} /> Abattoir</label>
                            <select className="form-control" value={filters.abbatoir_id}
                                onChange={e => setFilter('abbatoir_id', e.target.value)}>
                                <option value="">All Abattoirs</option>
                                {entities.abbatoirs.map(a => (
                                    <option key={a.id} value={a.id}>{a.username ?? a.name ?? `#${a.id}`}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {activeDef.filterKeys.includes('species') && (
                        <div className="form-group">
                            <label><MdPets style={{ verticalAlign: 'middle' }} /> Species</label>
                            <select className="form-control" value={filters.species}
                                onChange={e => setFilter('species', e.target.value)}>
                                <option value="">All Species</option>
                                {['cow', 'pig', 'chicken', 'sheep', 'goat'].map(s => (
                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {activeDef.filterKeys.includes('lifecycle_status') && (
                        <div className="form-group">
                            <label>Lifecycle Status</label>
                            <select className="form-control" value={filters.lifecycle_status}
                                onChange={e => setFilter('lifecycle_status', e.target.value)}>
                                <option value="">All Statuses</option>
                                {['HEALTHY', 'SLAUGHTERED', 'TRANSFERRED', 'SEMI-TRANSFERRED', 'REJECTED'].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {activeDef.filterKeys.includes('product_type') && (
                        <div className="form-group">
                            <label>Product Type</label>
                            <select className="form-control" value={filters.product_type}
                                onChange={e => setFilter('product_type', e.target.value)}>
                                <option value="">All Types</option>
                                {['meat', 'milk', 'eggs', 'wool'].map(t => (
                                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {activeDef.filterKeys.includes('category_id') && (
                        <div className="form-group">
                            <label>Category</label>
                            <select className="form-control" value={filters.category_id}
                                onChange={e => setFilter('category_id', e.target.value)}>
                                <option value="">All Categories</option>
                                {entities.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}

                    {activeDef.filterKeys.includes('part_type') && (
                        <div className="form-group">
                            <label>Part Type</label>
                            <select className="form-control" value={filters.part_type}
                                onChange={e => setFilter('part_type', e.target.value)}>
                                <option value="">All Part Types</option>
                                {['whole_carcass','left_side','right_side','left_carcass','right_carcass',
                                  'head','feet','internal_organs','torso','front_legs','hind_legs'].map(p => (
                                    <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {activeDef.filterKeys.includes('payment_method') && (
                        <div className="form-group">
                            <label>Payment Method</label>
                            <select className="form-control" value={filters.payment_method}
                                onChange={e => setFilter('payment_method', e.target.value)}>
                                <option value="">All Methods</option>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="mobile_money">Mobile Money</option>
                            </select>
                        </div>
                    )}

                    {/* Actions at the end of the grid */}
                    <div className="form-group filter-actions">
                        <button className="btn-reset" onClick={resetFilters} title="Clear all filters">
                            <MdRefresh style={{ fontSize: '1rem' }} /> Reset
                        </button>
                        <motion.button
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            onClick={handleGenerate}
                            disabled={loading}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {loading
                                ? <><MdRefresh className="spin" style={{ fontSize: '1rem' }} /> Generating…</>
                                : <><MdSearch style={{ fontSize: '1rem' }} /> Generate</>}
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* ── Error state ───────────────────────────────────────────── */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        key="error"
                        className="report-error-box"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <MdWarningAmber />
                        <span>{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Results ───────────────────────────────────────────────── */}
            <AnimatePresence>
                {hasData && (
                    <motion.div
                        key={activeReport + '_results'}
                        ref={reportRef}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Metric cards */}
                        <div className="report-metrics-grid">
                            {metrics.map((m, i) => (
                                <motion.div
                                    key={i}
                                    className="rmetric"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="rmetric-stripe" style={{ background: m.color }} />
                                    <span className="rmetric-icon" style={{ color: m.color }}>{m.icon}</span>
                                    <div className="rmetric-value" style={{ color: m.color }}>{m.value}</div>
                                    <div className="rmetric-label">{m.label}</div>
                                </motion.div>
                            ))}
                            {totalCount !== null && totalCount > reportData.length && (
                                <div className="rmetric">
                                    <div className="rmetric-stripe" style={{ background: '#9ca3af' }} />
                                    <span className="rmetric-icon" style={{ color: '#9ca3af' }}><MdTableChart /></span>
                                    <div className="rmetric-value" style={{ color: '#9ca3af', fontSize: '1.1rem' }}>
                                        {reportData.length} / {totalCount.toLocaleString()}
                                    </div>
                                    <div className="rmetric-label">Showing / Total</div>
                                </div>
                            )}
                        </div>

                        {/* Data table */}
                        <div className="card report-table-card" style={{ position: 'relative' }}>
                            {/* Table toolbar */}
                            <div className="report-table-toolbar">
                                <div className="report-table-toolbar-info">
                                    <MdTableChart style={{ color: 'var(--text-light)' }} />
                                    <span>{activeDef.label}</span>
                                    <span className="table-row-count">{reportData.length} rows</span>
                                </div>
                                <div className="report-table-toolbar-actions">
                                    <button
                                        className={`btn-icon-sm${showColConfig ? ' btn-icon-active' : ''}`}
                                        onClick={() => setShowColConfig(v => !v)}
                                        title="Configure columns"
                                        aria-pressed={showColConfig}
                                    >
                                        <MdViewColumn />
                                        <span>Columns</span>
                                    </button>
                                    <button
                                        className="btn-icon-sm"
                                        onClick={() => setShowExportPreview(true)}
                                        title="Export"
                                    >
                                        <MdFileDownload />
                                        <span>Export</span>
                                    </button>
                                </div>
                            </div>

                            {/* Column configurator (slide-in panel) */}
                            <AnimatePresence>
                                {showColConfig && (
                                    <ColumnConfigurator
                                        reportType={activeReport}
                                        allColumns={allCols}
                                        visible={visibleCols}
                                        onChange={toggleCol}
                                        onReset={resetCols}
                                        onClose={() => setShowColConfig(false)}
                                    />
                                )}
                            </AnimatePresence>

                            <ReportTable
                                columns={activeCols}
                                data={reportData}
                                totalCount={totalCount ?? undefined}
                                loading={false}
                                rowKey={(row) => row?.id ?? Math.random()}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Loading state ─────────────────────────────────────────── */}
            {loading && (
                <div className="report-loading">
                    <MdRefresh className="report-loading-icon spin" />
                    <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                        Loading report data…
                    </p>
                </div>
            )}

            {/* ── Initial / empty state ─────────────────────────────────── */}
            {!loading && !error && !hasData && hasGenerated && (
                <div className="report-empty-state">
                    <MdSearch />
                    <p>No records found for the selected filters.<br />Try widening the date range or clearing some filters.</p>
                </div>
            )}

            {!loading && !hasGenerated && (
                <div className="report-empty-state">
                    <MdAssessment />
                    <p>
                        Choose a <strong>report type</strong> above, apply your filters,
                        then click <strong>Generate</strong>.
                    </p>
                </div>
            )}

            {/* ── Export Preview Modal ──────────────────────────────────── */}
            <AnimatePresence>
                {showExportPreview && hasData && (
                    <ExportPreviewModal
                        reportType={activeReport}
                        reportLabel={activeDef.label}
                        data={reportData}
                        visibleColumns={activeCols}
                        onConfirm={handleExportConfirm}
                        onClose={() => setShowExportPreview(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomReports;
