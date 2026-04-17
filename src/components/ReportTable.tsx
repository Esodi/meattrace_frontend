/**
 * ReportTable — sortable, searchable, paginated table for all reports.
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MdSearch, MdFirstPage, MdLastPage, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import './reports.css';

// ─── Public column interface ──────────────────────────────────────────────────

export interface ReportColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string;
  render: (row: T) => React.ReactNode;
  csvValue?: (row: T) => string;
  sortValue?: (row: T) => number;
}

// ─── Component props ──────────────────────────────────────────────────────────

interface ReportTableProps<T = any> {
  columns: ReportColumn<T>[];
  data: T[];
  rowKey?: (row: T, index: number) => string | number;
  loading?: boolean;
  totalCount?: number;
  searchable?: boolean;
  emptyText?: string;
  /** Rows per page. Defaults to 25. */
  defaultPageSize?: number;
}

// ─── Sort arrows ─────────────────────────────────────────────────────────────

const SortArrows: React.FC<{ colKey: string; activeKey: string | null; dir: 'asc' | 'desc' }> = ({
  colKey, activeKey, dir,
}) => {
  const cls = activeKey === colKey ? (dir === 'asc' ? 'sa-asc' : 'sa-desc') : '';
  return (
    <span className={`sort-arrows ${cls}`} aria-hidden="true">
      <span className="sa-up">▲</span>
      <span className="sa-down">▼</span>
    </span>
  );
};

// ─── Skeleton row ─────────────────────────────────────────────────────────────

const SkeletonRow: React.FC<{ cols: number }> = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i}>
        <div className="skeleton-cell" style={{ width: `${50 + (i * 17) % 40}%` }} />
      </td>
    ))}
  </tr>
);

// ─── Pagination bar ───────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}

const PAGE_SIZES = [10, 25, 50, 100];

const Pagination: React.FC<PaginationProps> = ({ page, pageCount, pageSize, total, onPage, onPageSize }) => {
  // Build visible page numbers with ellipsis.
  const pages: (number | '…')[] = useMemo(() => {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
    const result: (number | '…')[] = [];
    const around = new Set([1, pageCount, page - 1, page, page + 1].filter(p => p >= 1 && p <= pageCount));
    let prev = 0;
    for (const p of [...around].sort((a, b) => a - b)) {
      if (p - prev > 1) result.push('…');
      result.push(p);
      prev = p;
    }
    return result;
  }, [page, pageCount]);

  const first = (page - 1) * pageSize + 1;
  const last  = Math.min(page * pageSize, total);

  return (
    <div className="rt-pagination">
      {/* Page size selector */}
      <div className="rt-page-size">
        <span className="rt-page-size-label">Rows per page</span>
        <select
          className="rt-page-size-select"
          value={pageSize}
          onChange={e => onPageSize(Number(e.target.value))}
          aria-label="Rows per page"
        >
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Record range info */}
      <span className="rt-page-info">
        {first}–{last} of {total.toLocaleString()}
      </span>

      {/* Navigation controls */}
      <div className="rt-page-nav">
        <button
          className="rt-page-btn"
          onClick={() => onPage(1)}
          disabled={page === 1}
          aria-label="First page"
          title="First page"
        >
          <MdFirstPage />
        </button>
        <button
          className="rt-page-btn"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          title="Previous page"
        >
          <MdChevronLeft />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="rt-page-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`rt-page-btn rt-page-num${p === page ? ' rt-page-active' : ''}`}
              onClick={() => onPage(p as number)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          className="rt-page-btn"
          onClick={() => onPage(page + 1)}
          disabled={page === pageCount}
          aria-label="Next page"
          title="Next page"
        >
          <MdChevronRight />
        </button>
        <button
          className="rt-page-btn"
          onClick={() => onPage(pageCount)}
          disabled={page === pageCount}
          aria-label="Last page"
          title="Last page"
        >
          <MdLastPage />
        </button>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

function ReportTable<T = any>({
  columns,
  data,
  rowKey,
  loading = false,
  totalCount,
  searchable = true,
  emptyText = 'No records match the selected filters.',
  defaultPageSize = 25,
}: ReportTableProps<T>) {
  const [query,    setQuery]    = useState('');
  const [sortKey,  setSortKey]  = useState<string | null>(null);
  const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('asc');
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Reset to page 1 whenever search or sort changes.
  useEffect(() => { setPage(1); }, [query, sortKey, sortDir]);
  // Reset to page 1 when data changes (new report generated).
  useEffect(() => { setPage(1); }, [data]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  /** All rows after search + sort (before pagination). */
  const processed = useMemo(() => {
    let rows = [...data];

    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(row =>
        columns.some(col => {
          const str = col.csvValue
            ? col.csvValue(row)
            : String((row as any)[col.key] ?? '');
          return str.toLowerCase().includes(q);
        })
      );
    }

    if (sortKey) {
      const col = columns.find(c => c.key === sortKey);
      rows.sort((a, b) => {
        if (col?.sortValue) {
          const diff = col.sortValue(a) - col.sortValue(b);
          return sortDir === 'asc' ? diff : -diff;
        }
        const av = col?.csvValue ? col.csvValue(a) : String((a as any)[sortKey] ?? '');
        const bv = col?.csvValue ? col.csvValue(b) : String((b as any)[sortKey] ?? '');
        const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return rows;
  }, [data, query, sortKey, sortDir, columns]);

  const pageCount   = Math.max(1, Math.ceil(processed.length / pageSize));
  const safePage    = Math.min(page, pageCount);
  const pageStart   = (safePage - 1) * pageSize;
  const pageRows    = processed.slice(pageStart, pageStart + pageSize);

  const isFiltered    = query.trim().length > 0;
  const baseCount     = data.length;
  const filteredCount = processed.length;

  // ── Mirrored top scrollbar ───────────────────────────────────────────────
  const topBarRef   = useRef<HTMLDivElement>(null);
  const topInnerRef = useRef<HTMLDivElement>(null);
  const tableRef    = useRef<HTMLDivElement>(null);
  const syncing     = useRef(false);   // prevents scroll-event loops

  // Keep the top-bar inner div width in sync with the actual table width.
  useEffect(() => {
    if (!tableRef.current || !topInnerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (tableRef.current && topInnerRef.current) {
        topInnerRef.current.style.width = `${tableRef.current.scrollWidth}px`;
      }
    });
    ro.observe(tableRef.current);
    return () => ro.disconnect();
  }, []);

  const onTopScroll = useCallback(() => {
    if (syncing.current) return;
    syncing.current = true;
    if (tableRef.current && topBarRef.current)
      tableRef.current.scrollLeft = topBarRef.current.scrollLeft;
    syncing.current = false;
  }, []);

  const onBottomScroll = useCallback(() => {
    if (syncing.current) return;
    syncing.current = true;
    if (topBarRef.current && tableRef.current)
      topBarRef.current.scrollLeft = tableRef.current.scrollLeft;
    syncing.current = false;
  }, []);

  return (
    <div className="rt-root">
      {/* ── Controls row ────────────────────────────────────── */}
      {searchable && (
        <div className="table-controls">
          <div className="table-search-wrap">
            <MdSearch className="table-search-icon" />
            <input
              type="text"
              className="table-search-input"
              placeholder="Search across all columns…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search table"
            />
          </div>
          <span className="table-row-count">
            {isFiltered
              ? `${filteredCount.toLocaleString()} of ${baseCount.toLocaleString()} rows`
              : `${baseCount.toLocaleString()} rows`}
            {totalCount && totalCount > baseCount
              ? ` (${totalCount.toLocaleString()} total)`
              : ''}
          </span>
        </div>
      )}

      {/* ── Top mirror scrollbar ─────────────────────────────── */}
      <div
        ref={topBarRef}
        className="table-overflow table-scroll-mirror"
        onScroll={onTopScroll}
        aria-hidden="true"
      >
        <div ref={topInnerRef} className="table-scroll-mirror-inner" />
      </div>

      {/* ── Scrollable table wrapper ─────────────────────────── */}
      <div ref={tableRef} className="table-overflow" onScroll={onBottomScroll}>
        <table className="table">
          <thead>
            <tr>
              {columns.map(col => {
                const isSortable = col.sortable !== false;
                return (
                  <th
                    key={col.key}
                    className={isSortable ? 'th-sortable' : ''}
                    style={{ textAlign: col.align ?? 'left', width: col.width }}
                    onClick={isSortable ? () => handleSort(col.key) : undefined}
                    aria-sort={
                      sortKey === col.key
                        ? sortDir === 'asc' ? 'ascending' : 'descending'
                        : undefined
                    }
                  >
                    <span className="th-inner">
                      {col.label}
                      {isSortable && (
                        <SortArrows colKey={col.key} activeKey={sortKey} dir={sortDir} />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: pageSize < 6 ? pageSize : 6 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}
                >
                  {query.trim() ? `No rows match "${query}".` : emptyText}
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr key={rowKey ? rowKey(row, pageStart + i) : ((row as any).id ?? pageStart + i)}>
                  {columns.map(col => (
                    <td key={col.key} style={{ textAlign: col.align ?? 'left' }}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination bar ───────────────────────────────────── */}
      {!loading && processed.length > 0 && (
        <Pagination
          page={safePage}
          pageCount={pageCount}
          pageSize={pageSize}
          total={processed.length}
          onPage={setPage}
          onPageSize={s => { setPageSize(s); setPage(1); }}
        />
      )}
    </div>
  );
}

export default ReportTable;
