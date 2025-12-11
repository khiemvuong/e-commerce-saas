"use client";

import React from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
} from '@tanstack/react-table';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts';
import SalesChart from 'apps/admin-ui/src/shared/components/charts/sale-chart';
import GeographicalMap from 'apps/admin-ui/src/shared/components/charts/geographicalMap';

// Device data
const deviceData = [
    { name: 'Mobile', value: 45, color: '#4ade80' },
    { name: 'Desktop', value: 35, color: '#60a5fa' },
    { name: 'Tablet', value: 20, color: '#f59e0b' },
];

// Recent orders data
interface Order {
    id: string;
    customer: string;
    product: string;
    amount: string;
    status: string;
    date: string;
}

const recentOrders: Order[] = [
    { id: '#12345', customer: 'John Doe', product: 'Wireless Headphones', amount: '$89.99', status: 'Completed', date: '2025-12-08' },
    { id: '#12346', customer: 'Jane Smith', product: 'Smart Watch', amount: '$249.99', status: 'Processing', date: '2025-12-08' },
    { id: '#12347', customer: 'Mike Johnson', product: 'Laptop Stand', amount: '$45.50', status: 'Completed', date: '2025-12-07' },
    { id: '#12348', customer: 'Sarah Williams', product: 'USB-C Cable', amount: '$15.99', status: 'Shipped', date: '2025-12-07' },
    { id: '#12349', customer: 'David Brown', product: 'Phone Case', amount: '$24.99', status: 'Completed', date: '2025-12-06' },
];

const Dashboard = () => {
    const columns: ColumnDef<Order>[] = [
        {
            accessorKey: 'id',
            header: 'Order ID',
        },
        {
            accessorKey: 'customer',
            header: 'Customer',
        },
        {
            accessorKey: 'product',
            header: 'Product',
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const statusColors: Record<string, string> = {
                    'Completed': 'bg-green-500/20 text-green-400',
                    'Processing': 'bg-yellow-500/20 text-yellow-400',
                    'Shipped': 'bg-blue-500/20 text-blue-400',
                };
                return (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-500/20 text-gray-400'}`}>
                        {status}
                    </span>
                );
            },
        },
        {
            accessorKey: 'date',
            header: 'Date',
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
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-gray-400">Welcome back! Here's what's happening with your store.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">Total Revenue</p>
                                <h3 className="text-2xl font-bold text-white mt-2">$45,231</h3>
                                <p className="text-green-400 text-xs mt-2">+20.1% from last month</p>
                            </div>
                            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">Total Orders</p>
                                <h3 className="text-2xl font-bold text-white mt-2">2,350</h3>
                                <p className="text-green-400 text-xs mt-2">+15.3% from last month</p>
                            </div>
                            <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">Total Users</p>
                                <h3 className="text-2xl font-bold text-white mt-2">12,543</h3>
                                <p className="text-green-400 text-xs mt-2">+8.2% from last month</p>
                            </div>
                            <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">Active Sellers</p>
                                <h3 className="text-2xl font-bold text-white mt-2">486</h3>
                                <p className="text-green-400 text-xs mt-2">+12.5% from last month</p>
                            </div>
                            <div className="h-12 w-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-2 bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-white">Revenue Overview</h2>
                            <p className="text-gray-400 text-sm mt-1">Monthly revenue trends</p>
                        </div>
                        <SalesChart />
                    </div>

                    {/* Device Usage */}
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-white">Device Usage</h2>
                            <p className="text-gray-400 text-sm mt-1">Traffic by device type</p>
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
                                    {deviceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        color: '#fff',
                                    }}
                                    labelStyle={{ color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-gray-300">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Geographical Map */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-white">User & Seller Distribution</h2>
                        <p className="text-gray-400 text-sm mt-1">Geographic distribution of users and sellers</p>
                    </div>
                    <GeographicalMap />
                </div>

                {/* Recent Orders */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-white">Recent Orders</h2>
                        <p className="text-gray-400 text-sm mt-1">Latest transactions from your store</p>
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
                                            <td key={cell.id} className="py-4 px-4 text-sm text-gray-300">
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