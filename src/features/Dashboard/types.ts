export interface DashboardStats {
    totalRevenue: number;
    subscriptions: number;
    sales: number;
    activeNow: number;
}

export interface RecentOrder {
    id: string;
    customer: string;
    email: string;
    amount: number;
    status: "pending" | "processing" | "completed" | "failed";
}

export interface ChartData {
    month: string;
    revenue: number;
}
