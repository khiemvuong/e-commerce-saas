'use client';
import PageLoader from 'apps/seller-ui/src/shared/components/loading/page-loader';
import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import BreadCrumbs from 'apps/seller-ui/src/shared/components/breadcrums';

const page = () => {
    const [data, setData] = useState<any>(null);
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
      
    return (
        loading ? <PageLoader /> : (
            <div className="p-6 space-y-6 min-h-screen bg-black">
                <BreadCrumbs title="Dashboard" />
                
                {/* Revenue Chart */}
                <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
                    <h2 className="text-lg font-semibold mb-4 text-gray-200">Revenue Analytics (Last 12 Months)</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.revenueData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)'}}
                                    itemStyle={{color: '#e5e7eb'}}
                                    labelStyle={{color: '#9ca3af'}}
                                    formatter={(value: number | undefined) => [value ? `$${value.toLocaleString()}` : '$0', 'Revenue']}
                                />
                                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Products */}
                    <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
                        <h2 className="text-lg font-semibold mb-4 text-gray-200">Top Selling Products</h2>
                        <div className="space-y-4">
                            {data?.topProducts?.map((product: any) => (
                                <div key={product.id} className="flex items-center gap-4 p-3 hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-700">
                                    <div className="h-12 w-12 rounded-md bg-gray-800 overflow-hidden flex-shrink-0 border border-gray-700">
                                        {product.images?.[0]?.file_url && (
                                            <img src={product.images[0].file_url} alt={product.title} className="h-full w-full object-cover" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-200 truncate">{product.title}</p>
                                        <p className="text-xs text-gray-400">{product.totalSales} sales</p>
                                    </div>
                                    <div className="text-sm font-semibold text-white">
                                        ${product.sale_price || product.regular_price}
                                    </div>
                                </div>
                            ))}
                            {(!data?.topProducts || data.topProducts.length === 0) && (
                                <p className="text-sm text-gray-500 text-center py-4">No sales data yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
                        <h2 className="text-lg font-semibold mb-4 text-gray-200">Recent Orders</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Order ID</th>
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3 rounded-r-lg">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {data?.recentOrders?.map((order: any) => (
                                        <tr key={order.id} className="hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-300">#{order.id.slice(-6)}</td>
                                            <td className="px-4 py-3 text-gray-400">{order.user?.name || 'Guest'}</td>
                                            <td className="px-4 py-3 font-medium text-green-400">${order.total}</td>
                                            <td className="px-4 py-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {(!data?.recentOrders || data.recentOrders.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-4 text-gray-500">No orders found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )
    )
}

export default page