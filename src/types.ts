export interface User {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    [key: string]: any;
}

export interface ProcessingUnit {
    id: number;
    name: string;
    location?: string;
    [key: string]: any;
}

export interface Shop {
    id: number;
    name: string;
    location?: string;
    [key: string]: any;
}

export interface LoginResponse {
    tokens?: {
        access: string;
        refresh: string;
    };
    access?: string;
    refresh?: string;
    user?: User;
    user_data?: User;
    detail?: string;
}

export interface LoginProps {
    onLogin: (data: { tokens: { access: string; refresh: string }; user: User }) => void;
}

export interface NavigationProps {
    user: User | null;
    onLogout: () => void;
}

export interface ChartItem {
    label: string;
    value: number;
}

export interface SimpleBarChartProps {
    data: ChartItem[];
    maxHeight?: number;
}

export interface DashboardStats {
    total_users: number;
    total_processing_units: number;
    total_shops: number;
    total_animals: number;
    total_products: number;
    total_sales: number;
    total_orders: number;
    [key: string]: number; // Allow flexible access if needed
}

export interface AnalyticsData {
    new_users_count?: number;
    active_users_count?: number;
    new_animals_count?: number;
    new_products_count?: number;
    new_orders_count?: number;
    total_sales_value?: number;
    processing_efficiency?: number;
    transfer_success_rate?: number;
    average_order_value?: number;
    error_rate?: number;
    system_uptime?: number;
    [key: string]: any;
}

export interface DailyStat {
    date: string;
    users: number;
    animals: number;
    products: number;
    sales: number;
    orders: number;
    // backend response might have different keys needing mapping
    new_users?: number;
    new_animals?: number;
    new_products?: number;
    new_sales?: number;
    new_orders?: number;
}

// ─── Report filter parameters ────────────────────────────────────────────────

export interface ReportFilters {
    start_date?: string;
    end_date?: string;
    shop_id?: string;
    processing_unit_id?: string;
    abbatoir_id?: string;
    species?: string;
    product_type?: string;
    category_id?: string;
    part_type?: string;
    payment_method?: string;
    lifecycle_status?: string;
}

// ─── Sales Report (Report 1) ─────────────────────────────────────────────────

export interface SaleItem {
    id: number;
    product: number;
    product_name?: string;
    product_type?: string;
    quantity: number;
    weight: number;
    weight_unit: string;
    unit_price: number;
    subtotal: number;
    // fields merged from parent Sale for flattened report rows
    shop?: number;
    shop_name?: string;
    receipt_uuid?: string;
    customer_name?: string;
    payment_method?: string;
    created_at?: string;
}

export interface Sale {
    id: number;
    shop: number;
    shop_name?: string;
    sold_by: number;
    sold_by_name?: string;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    payment_method: string;        // cash | card | mobile_money
    receipt_uuid: string;
    created_at: string;
    items: SaleItem[];
}

// ─── Product Production / Issue / Stock reports (Reports 2, 3, 7, 8) ────────

export interface ProductReport {
    id: number;
    name: string;
    batch_number: string;
    product_type: string;          // meat | milk | eggs | wool
    weight: number;
    weight_unit: string;
    remaining_weight: number;
    price: number;
    // category — serializer may return an id, a name, or a nested object
    category?: number | string | { id: number; name: string };
    category_name?: string;
    processing_unit?: number;
    processing_unit_name?: string;
    // source traceability
    animal?: number;
    animal_id?: string;            // Animal.animal_id human-readable
    animal_species?: string;
    slaughter_part?: number;
    slaughter_part_type?: string;
    // transfer to shop
    transferred_to?: number;
    transferred_to_name?: string;
    transferred_at?: string;
    received_at?: string;
    weight_received?: number;
    weight_rejected?: number;
    rejection_status?: string;
    is_external_source: boolean;
    created_at: string;
    // merged field added client-side for product issue report
    _receipts?: Receipt[];
    _total_received?: number;
}

// ─── Animals Report (Report 4) ───────────────────────────────────────────────

export interface AnimalReport {
    id: number;
    animal_id: string;
    animal_name?: string;
    species: string;
    breed?: string;
    gender: string;
    age: number;                   // months
    live_weight: number;
    remaining_weight: number;
    health_status: string;
    slaughtered: boolean;
    slaughtered_at?: string;
    transferred_to?: number;
    transferred_to_name?: string;
    transferred_at?: string;
    rejection_status?: string;
    lifecycle_status?: string;     // computed on backend
    abbatoir: number;
    abbatoir_name?: string;
    farmer_name?: string;
    created_at: string;
}

// ─── Waste Tracking ─────────────────────────────────────────────────────────

export interface Waste {
    id: number;
    animal?: number;
    animal_id_tag?: string;
    slaughter_part?: number;
    slaughter_part_type?: string;
    product?: number;
    product_name?: string;
    waste_type: 'evisceration' | 'processing' | 'rejection' | 'trimming' | 'spoilage' | 'other';
    stage: 'abbatoir' | 'processing_unit' | 'shop';
    weight_kg: number;
    expected_weight_kg?: number;
    actual_weight_kg?: number;
    auto_generated: boolean;
    notes?: string;
    recorded_by?: number;
    recorded_by_name?: string;
    abbatoir?: number;
    abbatoir_name?: string;
    processing_unit?: number;
    processing_unit_name?: string;
    shop?: number;
    shop_name?: string;
    created_at: string;
}

// ─── Slaughter Parts Report (Report 5) ───────────────────────────────────────

export interface SlaughterPartReport {
    id: number;
    part_id: string;
    animal: number;
    animal_id_str?: string;        // Animal.animal_id human-readable
    animal_species?: string;
    abbatoir_name?: string;        // enriched client-side from animal record
    part_type: string;
    weight: number;
    remaining_weight: number;
    weight_unit: string;
    transferred_to?: number;
    transferred_to_name?: string;
    transferred_at?: string;
    received_at?: string;
    used_in_product: boolean;
    rejection_status?: string;
    created_at: string;
}

// ─── Shop Stock / Inventory (Report 6) ───────────────────────────────────────

export interface InventoryItem {
    id: number;
    shop: number;
    shop_name?: string;
    product: number;
    product_name?: string;
    product_type?: string;
    product_category?: string;
    weight: number;
    weight_unit: string;
    min_stock_level: number;
    is_low_stock?: boolean;        // computed: weight <= min_stock_level
    last_updated: string;
}

// ─── Receipt (used in Product Issue reconciliation) ──────────────────────────

export interface Receipt {
    id: number;
    shop: number;
    product: number;
    product_name?: string;
    receipt_number: string;
    received_weight: number;
    weight_unit: string;
    received_at: string;
    notes?: string;
}

// ─── Paginated API response wrapper ──────────────────────────────────────────

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
