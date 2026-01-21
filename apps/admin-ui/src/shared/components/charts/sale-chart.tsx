'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface SalesChartProps {
    revenueData?: Array<{
        month: string;
        revenue: number;
        orders: number;
    }>;
}

// Default mock data for fallback
const defaultSalesData = [
    { month: 'Jan', revenue: 0, orders: 0 },
    { month: 'Feb', revenue: 0, orders: 0 },
    { month: 'Mar', revenue: 0, orders: 0 },
    { month: 'Apr', revenue: 0, orders: 0 },
    { month: 'May', revenue: 0, orders: 0 },
    { month: 'Jun', revenue: 0, orders: 0 },
    { month: 'Jul', revenue: 0, orders: 0 },
    { month: 'Aug', revenue: 0, orders: 0 },
    { month: 'Sep', revenue: 0, orders: 0 },
    { month: 'Oct', revenue: 0, orders: 0 },
    { month: 'Nov', revenue: 0, orders: 0 },
    { month: 'Dec', revenue: 0, orders: 0 },
];

const SalesChart = ({ revenueData = defaultSalesData }: SalesChartProps) => {
    const salesData = revenueData.length > 0 ? revenueData : defaultSalesData;

    const series = [
        {
            name: 'Revenue',
            data: salesData.map((item) => item.revenue),
        },
        {
            name: 'Orders',
            data: salesData.map((item) => item.orders),
        },
    ];

    const options: ApexOptions = {
        chart: {
            type: 'line',
            toolbar: {
                show: false,
            },
            background: 'transparent',
        },
        colors: ['#3b82f6', '#10b981'],
        stroke: {
            curve: 'smooth',
            width: 3,
        },
        grid: {
            borderColor: '#374151',
            strokeDashArray: 3,
            xaxis: {
                lines: {
                    show: false,
                },
            },
        },
        xaxis: {
            categories: salesData.map((item) => item.month),
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
            labels: {
                style: {
                    colors: '#9ca3af',
                    fontSize: '12px',
                },
            },
        },
        yaxis: [
            {
                seriesName: 'Revenue',
                labels: {
                    style: {
                        colors: '#9ca3af',
                        fontSize: '12px',
                    },
                    formatter: (value) => `$${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`,
                },
            },
            {
                seriesName: 'Orders',
                opposite: true,
                labels: {
                    style: {
                        colors: '#9ca3af',
                        fontSize: '12px',
                    },
                },
            },
        ],
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            labels: {
                colors: '#d1d5db',
            },
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: (value, { seriesIndex }) => {
                    if (seriesIndex === 0) return `$${value.toLocaleString()}`;
                    return value.toString();
                },
            },
        },
    };

    return (
        <div className="w-full h-[300px]">
            <Chart options={options} series={series} type="line" height="100%" width="100%" />
        </div>
    );
};

export default SalesChart;