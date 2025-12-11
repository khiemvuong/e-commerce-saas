'use client';
import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';


const geographicalData = [
    { country: 'USA', users: 4500, sellers: 120 },
    { country: 'UK', users: 2800, sellers: 85 },
    { country: 'Germany', users: 2200, sellers: 68 },
    { country: 'France', users: 1900, sellers: 52 },
    { country: 'Canada', users: 1600, sellers: 45 },
    { country: 'Australia', users: 1400, sellers: 38 },
    { country: 'Japan', users: 1200, sellers: 32 },
    { country: 'Others', users: 1900, sellers: 46 },
];

const GeographicalMap = () => {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={geographicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                    dataKey="country"
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                />
                <YAxis
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
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
                    cursor={{ fill: '#374151' }}
                />
                <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="square"
                    formatter={(value) => (
                        <span className="text-gray-300">
                            {value === 'users' ? 'Users' : 'Sellers'}
                        </span>
                    )}
                />
                <Bar
                    dataKey="users"
                    fill="#6366f1"
                    radius={[8, 8, 0, 0]}
                />
                <Bar
                    dataKey="sellers"
                    fill="#f59e0b"
                    radius={[8, 8, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default GeographicalMap;