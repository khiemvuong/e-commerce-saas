'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

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
                    formatter: (value) => `$${value / 1000}k`,
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