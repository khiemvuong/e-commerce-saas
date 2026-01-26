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
import { Users, ShoppingBag, Store, DollarSign, ShoppingCart } from "lucide-react";
import AlertSection from "../../shared/components/alerts/AlertSection";
import StatCardWithGrowth from "../../shared/components/cards/StatCardWithGrowth";
import TopPerformers from "../../shared/components/cards/TopPerformers";

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
        staleTime: 5 * 60 * 1000,
    });

    const recentOrders = React.useMemo(() => orders.slice(0, 6), [orders]);

    const deviceData = dashboardStats?.deviceStats || [
        { name: "Mobile", value: 0, color: "#22c55e" },
        { name: "Desktop", value: 0, color: "#3b82f6" },
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
    const growth = dashboardStats?.growth || {};
    const alerts = dashboardStats?.alerts || [];
    const topPerformers = dashboardStats?.topPerformers || {};

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "id",
            header: "Order",
            cell: ({ row }) => (
                <span className="font-mono text-xs text-gray-400">
                    #{row.original.id.slice(-6).toUpperCase()}
                </span>
            ),
        },
        {
            accessorKey: "user.name",
            header: "Customer",
            cell: ({ row }) => (
                <span className="text-gray-300 text-sm">{row.original.user?.name || 'Guest'}</span>
            ),
        },
        {
            accessorKey: "total",
            header: "Amount",
            cell: ({ row }) => (
                <span className="text-white font-medium text-sm">${row.original.total.toFixed(2)}</span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status || 'Pending';
                const statusColors: Record<string, string> = {
                    Paid: "bg-emerald-500/20 text-emerald-400",
                    Pending: "bg-amber-500/20 text-amber-400",
                    Failed: "bg-red-500/20 text-red-400",
                    Refunded: "bg-purple-500/20 text-purple-400",
                    COD: "bg-blue-500/20 text-blue-400",
                    Delivered: "bg-green-500/20 text-green-400",
                };
                return (
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[status] || "bg-gray-500/20 text-gray-400"}`}>
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
        <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
            <div className="max-w-[1400px] mx-auto space-y-5">
                
                {/* Row 1: Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                    <StatCardWithGrowth
                        title="Users"
                        value={summary.totalUsers}
                        growth={growth.users}
                        icon={<Users className="w-5 h-5 text-blue-400" />}
                        iconBgColor="bg-blue-500/20"
                        isLoading={isLoadingStats}
                    />
                    <StatCardWithGrowth
                        title="Sellers"
                        value={summary.totalSellers}
                        growth={growth.sellers}
                        icon={<Store className="w-5 h-5 text-purple-400" />}
                        iconBgColor="bg-purple-500/20"
                        isLoading={isLoadingStats}
                    />
                    <StatCardWithGrowth
                        title="Products"
                        value={summary.totalProducts}
                        icon={<ShoppingBag className="w-5 h-5 text-orange-400" />}
                        iconBgColor="bg-orange-500/20"
                        isLoading={isLoadingStats}
                    />
                    <StatCardWithGrowth
                        title="Orders"
                        value={summary.totalOrders}
                        growth={growth.orders}
                        icon={<ShoppingCart className="w-5 h-5 text-sky-400" />}
                        iconBgColor="bg-sky-500/20"
                        isLoading={isLoadingStats}
                    />
                    <StatCardWithGrowth
                        title="Revenue"
                        value={`$${summary.totalRevenue.toLocaleString()}`}
                        growth={growth.revenue}
                        icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
                        iconBgColor="bg-emerald-500/20"
                        isLoading={isLoadingStats}
                    />
                </div>

                {/* Row 2: Alerts + Top Performers (side by side) */}
                {(alerts.length > 0 || topPerformers.topRevenue) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {alerts.length > 0 && <AlertSection alerts={alerts} title="Action Required" />}
                        {topPerformers.topRevenue && (
                            <TopPerformers 
                                topRevenue={topPerformers.topRevenue}
                                fastestGrowth={topPerformers.fastestGrowth}
                                mostOrders={topPerformers.mostOrders}
                            />
                        )}
                    </div>
                )}

                {/* Row 3: Revenue Chart + Device Usage */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-[#111] border border-gray-800/60 rounded-xl p-5 md:p-6">
                        <div className="mb-4">
                            <h2 className="text-base md:text-lg font-semibold text-white">Revenue Overview</h2>
                            <p className="text-gray-500 text-sm mt-0.5">Monthly revenue trends</p>
                        </div>
                        <SalesChart revenueData={revenueData} />
                    </div>
                    <div className="bg-[#111] border border-gray-800/60 rounded-xl p-5 md:p-6">
                        <div className="mb-4">
                            <h2 className="text-base md:text-lg font-semibold text-white">Device Usage</h2>
                            <p className="text-gray-500 text-sm mt-0.5">Traffic by device type</p>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={deviceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {deviceData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1a1a1a",
                                        border: "1px solid #333",
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
                                    iconSize={8}
                                    formatter={(value) => (
                                        <span className="text-gray-400 text-xs">{value}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Row 4: Map + Country Stats + Recent Orders */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Map */}
                    <div className="lg:col-span-2 bg-[#111] border border-gray-800/60 rounded-xl p-5 md:p-6">
                        <div className="mb-4">
                            <h2 className="text-base md:text-lg font-semibold text-white">Geographic Distribution</h2>
                            <p className="text-gray-500 text-sm mt-0.5">Users and sellers by country</p>
                        </div>
                        <GeographicalMap geographicalData={geographicalData} />
                    </div>

                    {/* Country Stats */}
                    <div className="bg-[#111] border border-gray-800/60 rounded-xl p-5 md:p-6 flex flex-col max-h-[400px]">
                        <div className="mb-4">
                            <h2 className="text-base md:text-lg font-semibold text-white">By Country</h2>
                            <p className="text-gray-500 text-sm mt-0.5">Sorted by user count</p>
                        </div>
                        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-[#111]">
                                    <tr className="border-b border-gray-800/60">
                                        <th className="text-left py-2 text-xs font-medium text-gray-500">Country</th>
                                        <th className="text-right py-2 text-xs font-medium text-gray-500">Users</th>
                                        <th className="text-right py-2 text-xs font-medium text-gray-500">Sellers</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/40">
                                    {geographicalData
                                        .sort((a: any, b: any) => b.users - a.users)
                                        .slice(0, 10)
                                        .map((item: any) => (
                                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-2.5 text-gray-300">{item.name}</td>
                                                <td className="py-2.5 text-right font-mono text-xs text-blue-400">{item.users}</td>
                                                <td className="py-2.5 text-right font-mono text-xs text-purple-400">{item.sellers}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            {geographicalData.length === 0 && (
                                <div className="text-center py-8 text-gray-500 text-sm">No data available</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 5: Recent Orders */}
                <div className="bg-[#111] border border-gray-800/60 rounded-xl p-5 md:p-6">
                    <div className="mb-4">
                        <h2 className="text-base md:text-lg font-semibold text-white">Recent Orders</h2>
                        <p className="text-gray-500 text-sm mt-0.5">Latest transactions</p>
                    </div>
                    <div className="overflow-x-auto -mx-5 md:-mx-6 px-5 md:px-6">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800/60">
                                    {table.getHeaderGroups().map((headerGroup) =>
                                        headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        ))
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/40">
                                {table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="py-3 px-3">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {recentOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-gray-500 text-sm">No orders yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
