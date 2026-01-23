"use client";

import React from "react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
} from "@tanstack/react-table";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";
import SalesChart from "../../shared/components/charts/sale-chart";
import GeographicalMap from "../../shared/components/charts/geographicalMap";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "apps/admin-ui/src/utils/axiosInstance";
import { Users, ShoppingBag, Store, DollarSign, TrendingUp } from "lucide-react";

const fetchRecentOrders = async () => {
    const res = await axiosInstance.get('/order/api/get-admin-orders');
    return res.data.orders;
};

const fetchDashboardStats = async () => {
    const res = await axiosInstance.get('/admin/api/get-dashboard-stats');
    return res.data.data;
};

const Dashboard = () => {
    const { data: orders = [] } = useQuery({
        queryKey: ['recent-orders'],
        queryFn: fetchRecentOrders,
    });

    const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: fetchDashboardStats,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const recentOrders = React.useMemo(() => orders.slice(0, 8), [orders]);

    // Use API data or fallback to defaults
    const deviceData = dashboardStats?.deviceStats || [
        { name: "Mobile", value: 0, color: "#4ade80" },
        { name: "Desktop", value: 0, color: "#60a5fa" },
        { name: "Tablet", value: 0, color: "#f59e0b" },
    ];

    const revenueData = dashboardStats?.revenueData || [];
    const geographicalData = dashboardStats?.geographicalData || [];
    const summary = dashboardStats?.summary || {
        totalUsers: 0,
        totalSellers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
    };

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "id",
            header: "Order ID",
            cell: ({ row }) => (
                <span className="font-mono text-gray-300">
                    #{row.original.id.slice(-8).toUpperCase()}
                </span>
            ),
        },
        {
            accessorKey: "user.name",
            header: "Customer",
            cell: ({ row }) => <span className="text-gray-300">{row.original.user?.name || 'Guest'}</span>,
        },
        {
            accessorKey: "total",
            header: "Amount",
            cell: ({ row }) => <span className="text-gray-300">${row.original.total.toFixed(2)}</span>,
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status || 'Pending';
                const statusColors: Record<string, string> = {
                    Paid: "bg-green-500/20 text-green-400",
                    Pending: "bg-yellow-500/20 text-yellow-400",
                    Failed: "bg-red-500/20 text-red-400",
                    Refunded: "bg-purple-500/20 text-purple-400",
                    COD: "bg-blue-500/20 text-blue-400",
                    Delivered: "bg-emerald-500/20 text-emerald-400",
                };
                return (
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-500/20 text-gray-400"
                            }`}
                    >
                        {status}
                    </span>
                );
            },
        },
    ];

    const table = useReactTable({
        data: recentOrders,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-6">
            <div className="max-w-[1400px] mx-auto space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Users className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Total Users</p>
                                <p className="text-2xl font-bold text-white">
                                    {isLoadingStats ? '...' : summary.totalUsers.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Store className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Total Sellers</p>
                                <p className="text-2xl font-bold text-white">
                                    {isLoadingStats ? '...' : summary.totalSellers.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/20 rounded-lg">
                                <ShoppingBag className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Products</p>
                                <p className="text-2xl font-bold text-white">
                                    {isLoadingStats ? '...' : summary.totalProducts.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Total Orders</p>
                                <p className="text-2xl font-bold text-white">
                                    {isLoadingStats ? '...' : summary.totalOrders.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Revenue</p>
                                <p className="text-2xl font-bold text-white">
                                    {isLoadingStats ? '...' : `$${summary.totalRevenue.toLocaleString()}`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Row: Revenue Chart and Device Usage */}
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-4 bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-white">Revenue Overview</h2>
                            <p className="text-gray-400 text-sm mt-1">
                                Monthly revenue trends
                            </p>
                        </div>
                        <SalesChart revenueData={revenueData} />
                    </div>
                    {/* Device Usage */}
                    <div className="lg:col-span-3 bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-white">Device Usage</h2>
                            <p className="text-gray-400 text-sm mt-1">
                                Traffic by device type
                            </p>
                        </div>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={deviceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {deviceData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1a1a1a",
                                        border: "1px solid #374151",
                                        borderRadius: "8px",
                                        color: "#fff",
                                    }}
                                    labelStyle={{ color: "#fff" }}
                                    itemStyle={{ color: "#fff" }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => (
                                        <span className="text-gray-300">{value}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                {/* Bottom Row: Map and Country Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Geographical Map */}
                    <div className="lg:col-span-3 bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-white">
                                User & Seller Distribution
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">
                                Geographic distribution of users and sellers
                            </p>
                        </div>
                        <GeographicalMap geographicalData={geographicalData} />
                    </div>

                    {/* Country Statistics Table */}
                    <div className="lg:col-span-2 bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 flex flex-col h-[500px]">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-white">By Country</h2>
                            <p className="text-gray-400 text-sm mt-1">
                                Detailed breakdown (Sorted by User count)
                            </p>
                        </div>
                        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-[#1a1a1a] z-10">
                                    <tr className="border-b border-gray-800 text-left">
                                        <th className="py-2 text-sm font-semibold text-gray-400">Country</th>
                                        <th className="py-2 text-sm font-semibold text-gray-400 text-right">Users</th>
                                        <th className="py-2 text-sm font-semibold text-gray-400 text-right">Sellers</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {geographicalData
                                        .sort((a: any, b: any) => b.users - a.users)
                                        .map((item: any) => (
                                            <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors">
                                                <td className="py-3 text-sm text-gray-300 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 text-center text-xs bg-gray-800 rounded px-1 text-gray-500">{item.id}</span>
                                                        {item.name}
                                                    </div>
                                                </td>
                                                <td className="py-3 text-sm text-blue-400 text-right font-mono">{item.users}</td>
                                                <td className="py-3 text-sm text-purple-400 text-right font-mono">{item.sellers}</td>
                                            </tr>
                                        ))}
                                    {geographicalData.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-8 text-center text-gray-500">
                                                No country data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-white">Recent Orders</h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Latest transactions from your store
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    {table.getHeaderGroups().map((headerGroup) =>
                                        headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                className="text-left py-3 px-4 text-sm font-semibold text-gray-400"
                                            >
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            </th>
                                        ))
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className="py-4 px-4 text-sm text-gray-300"
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
