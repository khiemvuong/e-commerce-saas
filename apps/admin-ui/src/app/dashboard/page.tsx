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

// Device data
const deviceData = [
    { name: "Mobile", value: 45, color: "#4ade80" },
    { name: "Desktop", value: 35, color: "#60a5fa" },
    { name: "Tablet", value: 20, color: "#f59e0b" },
];

const fetchRecentOrders = async () => {
    const res = await axiosInstance.get('/order/api/get-admin-orders');
    return res.data.orders;
};

const Dashboard = () => {
    const { data: orders = [] } = useQuery({
        queryKey: ['recent-orders'],
        queryFn: fetchRecentOrders,
    });

    const recentOrders = React.useMemo(() => orders.slice(0, 8), [orders]);

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
                {/* Top Row: Revenue Chart and Recent Orders */}
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-4 bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-white">Revenue Overview</h2>
                            <p className="text-gray-400 text-sm mt-1">
                                Monthly revenue trends
                            </p>
                        </div>
                        <SalesChart />
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
                                    {deviceData.map((entry, index) => (
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
                {/* Bottom Row: Map and Device Usage */}
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
                        <GeographicalMap />
                    </div>
                    {/* Recent Orders */}
                    <div className="lg:col-span-2 bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
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
        </div>
    );
};

export default Dashboard;
