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
