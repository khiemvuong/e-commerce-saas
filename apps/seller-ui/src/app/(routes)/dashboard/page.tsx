'use client';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import BreadCrumbs from 'apps/seller-ui/src/shared/components/breadcrums';
import PageLoader from 'apps/seller-ui/src/shared/components/loading/page-loader';
import AlertBanner from 'apps/seller-ui/src/shared/components/alerts/AlertBanner';
import KPICard from 'apps/seller-ui/src/shared/components/cards/KPICard';
import AuthGuard from 'apps/seller-ui/src/shared/components/guards/auth-guard';

interface DashboardData {
    summary: {
        totalRevenue: number;
        revenueGrowth: number;
        thisMonthRevenue: number;
        totalOrders: number;
        ordersGrowth: number;
        thisWeekOrders: number;
        totalProducts: number;
        lowStockCount: number;
        pendingOrders: number;
    };
    alerts: Array<{
        type: 'warning' | 'info' | 'error' | 'success';
        icon: string;
        text: string;
        count: number;
        link?: string;
    }>;
    revenueData: Array<{ name: string; total: number }>;
    topProducts: Array<{
        id: string;
        title: string;
        sale_price: number;
        regular_price: number;
        totalSales: number;
        stock: number;
        trend: number;
        images: Array<{ id: string; file_url: string }>;
    }>;
    recentOrders: Array<{
        id: string;
        total: number;
        status: string;
        deliveryStatus: string;
        createdAt: string;
        user: { name: string; email: string } | null;
    }>;
    lowStockProducts: Array<{ id: string; title: string; stock: number }>;
}

const SellerDashboard = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await axiosInstance.get(`/seller/api/get-analytics`, {
                    withCredentials: true
                });
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            Paid: 'bg-emerald-500/20 text-emerald-400',
            Pending: 'bg-amber-500/20 text-amber-400',
            Failed: 'bg-red-500/20 text-red-400',
            COD: 'bg-blue-500/20 text-blue-400',
            Delivered: 'bg-green-500/20 text-green-400',
            Ordered: 'bg-sky-500/20 text-sky-400',
            Shipped: 'bg-indigo-500/20 text-indigo-400',
        };
        return colors[status] || 'bg-gray-500/20 text-gray-400';
    };

    if (loading) return <PageLoader />;

    return (
        <AuthGuard>
            <div className="p-4 md:p-6 space-y-5 min-h-screen bg-[#0a0a0a]">
                <BreadCrumbs title="Dashboard" />

                {/* Alerts Section */}
                {data?.alerts && data.alerts.length > 0 && (
                    <AlertBanner alerts={data.alerts} />
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <KPICard
                        title="Monthly Revenue"
                        value={formatCurrency(data?.summary?.thisMonthRevenue || 0)}
                        growth={data?.summary?.revenueGrowth}
                        growthLabel="vs last month"
                        icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
                        iconBgColor="bg-emerald-500/20"
                    />
                    <KPICard
                        title="Weekly Orders"
                        value={data?.summary?.thisWeekOrders || 0}
                        growth={data?.summary?.ordersGrowth}
                        growthLabel="vs last week"
                        icon={<ShoppingCart className="w-5 h-5 text-blue-400" />}
                        iconBgColor="bg-blue-500/20"
                    />
                    <KPICard
                        title="Total Products"
                        value={data?.summary?.totalProducts || 0}
                        icon={<Package className="w-5 h-5 text-purple-400" />}
                        iconBgColor="bg-purple-500/20"
                    />
                    <KPICard
                        title="Low Stock"
                        value={data?.summary?.lowStockCount || 0}
                        icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
                        iconBgColor="bg-amber-500/20"
                    />
                </div>

                {/* Revenue Chart */}
                <div className="bg-[#111] p-5 md:p-6 rounded-xl border border-gray-800/60">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-base md:text-lg font-semibold text-white">Revenue Overview</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Last 12 months · Total: {formatCurrency(data?.summary?.totalRevenue || 0)}
                            </p>
                        </div>
                    </div>
                    <div className="h-[280px] md:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.revenueData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f1f" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#6b7280', fontSize: 11 }} 
                                    dy={10} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#6b7280', fontSize: 11 }} 
                                    tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`} 
                                    width={50}
                                />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: '#1a1a1a', 
                                        borderRadius: '8px', 
                                        border: '1px solid #333', 
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)' 
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#9ca3af', marginBottom: 4 }}
                                    formatter={(value: number | undefined) => [value ? `$${value.toLocaleString()}` : '$0', 'Revenue']}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="total" 
                                    stroke="#3b82f6" 
                                    strokeWidth={2} 
                                    fillOpacity={1} 
                                    fill="url(#colorTotal)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bottom Grid: Top Products + Recent Orders */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Top Products */}
                    <div className="bg-[#111] p-5 md:p-6 rounded-xl border border-gray-800/60">
                        <h2 className="text-base md:text-lg font-semibold text-white mb-4">Best Sellers</h2>
                        <div className="space-y-2">
                            {data?.topProducts?.map((product, index) => (
                                <div 
                                    key={product.id} 
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                >
                                    <span className="text-xs text-gray-600 w-4">{index + 1}</span>
                                    <div className="h-10 w-10 rounded-lg bg-gray-900 overflow-hidden flex-shrink-0 border border-gray-800">
                                        {product.images?.[0]?.file_url ? (
                                            <img 
                                                src={product.images[0].file_url} 
                                                alt={product.title} 
                                                className="h-full w-full object-cover" 
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <Package className="w-4 h-4 text-gray-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                                            {product.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-gray-500">{product.totalSales} sold</span>
                                            {product.trend !== 0 && (
                                                <span className={`flex items-center gap-0.5 text-xs ${product.trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {product.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    {product.trend > 0 ? '+' : ''}{product.trend}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-white">${product.sale_price || product.regular_price}</p>
                                        {product.stock < 10 && (
                                            <p className="text-xs text-amber-400">{product.stock} left</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(!data?.topProducts || data.topProducts.length === 0) && (
                                <div className="text-center py-8">
                                    <Package className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No sales data yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-[#111] p-5 md:p-6 rounded-xl border border-gray-800/60">
                        <h2 className="text-base md:text-lg font-semibold text-white mb-4">Recent Orders</h2>
                        <div className="overflow-x-auto -mx-5 md:-mx-6 px-5 md:px-6">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-800/60">
                                        <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                        <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/40">
                                    {data?.recentOrders?.map((order) => (
                                        <tr key={order.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer">
                                            <td className="py-3 px-3 font-mono text-xs text-gray-400">#{order.id.slice(-6)}</td>
                                            <td className="py-3 px-3 text-gray-300">{order.user?.name || 'Guest'}</td>
                                            <td className="py-3 px-3 font-medium text-white">${order.total.toFixed(2)}</td>
                                            <td className="py-3 px-3">
                                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(order.deliveryStatus || order.status)}`}>
                                                    {order.deliveryStatus || order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!data?.recentOrders || data.recentOrders.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8">
                                                <ShoppingCart className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">No orders yet</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
};

export default SellerDashboard;