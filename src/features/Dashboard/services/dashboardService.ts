import type { DashboardStats, RecentOrder, ChartData } from "../types";

class DashboardService {
    // Mock dashboard stats
    getDashboardStats(): DashboardStats {
        return {
            totalRevenue: 45231.89,
            subscriptions: 2350,
            sales: 12234,
            activeNow: 573,
        };
    }

    // Mock recent orders
    getRecentOrders(): RecentOrder[] {
        return [
            {
                id: "ORD001",
                customer: "Olivia Martin",
                email: "olivia.martin@email.com",
                amount: 1999.00,
                status: "completed",
            },
            {
                id: "ORD002",
                customer: "Jackson Lee",
                email: "jackson.lee@email.com",
                amount: 39.00,
                status: "processing",
            },
            {
                id: "ORD003",
                customer: "Isabella Nguyen",
                email: "isabella.nguyen@email.com",
                amount: 299.00,
                status: "completed",
            },
            {
                id: "ORD004",
                customer: "William Kim",
                email: "will@email.com",
                amount: 99.00,
                status: "pending",
            },
            {
                id: "ORD005",
                customer: "Sofia Davis",
                email: "sofia.davis@email.com",
                amount: 39.00,
                status: "completed",
            },
        ];
    }

    // Mock chart data
    getChartData(): ChartData[] {
        return [
            { month: "Jan", revenue: 4000 },
            { month: "Feb", revenue: 3000 },
            { month: "Mar", revenue: 5000 },
            { month: "Apr", revenue: 4500 },
            { month: "May", revenue: 6000 },
            { month: "Jun", revenue: 5500 },
        ];
    }
}

export const dashboardService = new DashboardService();
