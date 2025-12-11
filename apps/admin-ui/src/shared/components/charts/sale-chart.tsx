'use client';
import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

const salesData = [
    { month: 'Jan', revenue: 12500, orders: 145 },
    { month: 'Feb', revenue: 15800, orders: 178 },
    { month: 'Mar', revenue: 18200, orders: 210 },
    { month: 'Apr', revenue: 22100, orders: 245 },
    { month: 'May', revenue: 25600, orders: 298 },
    { month: 'Jun', revenue: 28900, orders: 325 },
    { month: 'Jul', revenue: 32400, orders: 368 },
    { month: 'Aug', revenue: 35700, orders: 412 },
    { month: 'Sep', revenue: 38200, orders: 445 },
    { month: 'Oct', revenue: 41500, orders: 478 },
    { month: 'Nov', revenue: 43800, orders: 502 },
    { month: 'Dec', revenue: 45231, orders: 524 },
];

const SalesChart = () => {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                    dataKey="month"
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                />
                <YAxis
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff',
                    }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
                />
                <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                    formatter={(value) => (
                        <span className="text-gray-300">
                            {value === 'revenue' ? 'Revenue' : 'Orders'}
                        </span>
                    )}
                />
                <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                />
                <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default SalesChart;