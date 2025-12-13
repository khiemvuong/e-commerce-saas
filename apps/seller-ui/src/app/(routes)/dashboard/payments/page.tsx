"use client";
import React, { useMemo, useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Eye, Search, ChevronLeft, ChevronRight} from 'lucide-react';
import BreadCrumbs from 'apps/seller-ui/src/shared/components/breadcrums';
import ComponentLoader from 'apps/seller-ui/src/shared/components/loading/component-loader';

const fetchOrders = async () => {
    const res = await axiosInstance.get('/order/api/get-seller-orders');
    return res.data.orders;
}

const SellerPayments = () => {
    const [globalFilter, setGlobalFilter] = useState('');

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['seller-orders'],
        queryFn: fetchOrders,
        staleTime: 5 * 60 * 1000,
    });

    const columns = useMemo(
        () => [
            {
                header: 'Order ID',
                accessorKey: 'id',
                cell: ({ row }: any) => (
                    <span className='text-gray-200 font-mono text-sm'>
                        #{row.original.id.slice(-8).toUpperCase()}
                    </span>
                ),
            },
            {
                header: 'Customer',
                accessorKey: 'user.name',
                cell: ({ row }: any) => (
                    <div>
                        <div className='text-white font-medium'>{row.original.user.name}</div>
                        <div className='text-gray-400 text-xs'>{row.original.user.email}</div>
                    </div>
                ),
            },
            {
                header: 'Total Amount',
                accessorKey: 'total',
                cell: ({ row }: any) => (
                    <span className='text-white font-semibold'>
                        ${row.original.total.toFixed(2)}
                    </span>
                ),
            },
            {
                header: 'Your Earning',
                cell: ({ row }: any) => {
                    const sellerShare = row.original.total * 0.9; // 90% for seller
                    return (
                        <span className='text-green-400 font-semibold'>
                            ${sellerShare.toFixed(2)}
                        </span>
                    );
                }
            },
            {
                header: 'Platform Fee',
                cell: ({ row }: any) => {
                    const adminFee = row.original.total * 0.1; // 10% platform fee
                    return (
                        <span className='text-orange-400 font-medium'>
                            ${adminFee.toFixed(2)}
                        </span>
                    );
                }
            },
            {
                header: 'Payment Status',
                accessorKey: 'status',
                cell: ({ row }: any) => {
                    const status = row.original.status || 'Pending';
                    const statusColors: any = {
                        'Paid': 'bg-green-500/20 text-green-400 border-green-500/50',
                        'Pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
                        'Failed': 'bg-red-500/20 text-red-400 border-red-500/50',
                    };
                    return (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status] || statusColors['Pending']}`}>
                            {status}
                        </span>
                    );
                },
            },
            {
                header: 'Date',
                accessorKey: 'createdAt',
                cell: ({ row }: any) => (
                    <div className='text-gray-300 text-sm'>
                        <div>{new Date(row.original.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                        })}</div>
                        <div className='text-gray-500 text-xs'>
                            {new Date(row.original.createdAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </div>
                    </div>
                ),
            },
            {
                header: 'Actions',
                cell: ({ row }: any) => (
                    <Link
                        href={`/order/${row.original.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition text-sm font-medium"
                    >
                        <Eye size={16} />
                        View
                    </Link>
                ),
            }
        ],
        []
    );

    const table = useReactTable({
        data: orders,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        globalFilterFn: 'includesString',
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    // Calculate total earnings
    const totalEarnings = orders.reduce((sum: number, order: any) => sum + (order.total * 0.9), 0);
    const totalPlatformFees = orders.reduce((sum: number, order: any) => sum + (order.total * 0.1), 0);
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + order.total, 0);

    return (
        <div className="w-full min-h-screen bg-gray-950 p-6">
            <BreadCrumbs title="Payments & Earnings" />
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 shadow-lg">
                    <div className="text-green-100 text-sm font-medium mb-1">Total Earnings</div>
                    <div className="text-white text-3xl font-bold">${totalEarnings.toFixed(2)}</div>
                    <div className="text-green-200 text-xs mt-2">90% of total revenue</div>
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-lg">
                    <div className="text-blue-100 text-sm font-medium mb-1">Total Revenue</div>
                    <div className="text-white text-3xl font-bold">${totalRevenue.toFixed(2)}</div>
                    <div className="text-blue-200 text-xs mt-2">{orders.length} transactions</div>
                </div>
                <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 shadow-lg">
                    <div className="text-orange-100 text-sm font-medium mb-1">Platform Fees</div>
                    <div className="text-white text-3xl font-bold">${totalPlatformFees.toFixed(2)}</div>
                    <div className="text-orange-200 text-xs mt-2">10% commission</div>
                </div>
            </div>

            {/* Search Bar */}
            <div className='mb-6 flex items-center bg-gray-900 border border-gray-800 p-3 rounded-lg hover:border-gray-700 transition'>
                <Search size={20} className='text-gray-400 mr-3' />
                <input
                    type='text'
                    placeholder='Search by order ID, or customer name,...'
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className='w-full bg-transparent outline-none text-white placeholder-gray-500'
                />
            </div>

            {/* Table */}
            <div className="bg-gray-900 rounded-xl shadow-xl border border-gray-800 overflow-hidden">
                {isLoading ? (
                    <ComponentLoader text="Loading payments data..." />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-800 border-b border-gray-700">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <th
                                                    key={header.id}
                                                    className='px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider'
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {table.getRowModel().rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={columns.length} className="text-center text-gray-500 py-12">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Search size={48} className="text-gray-700" />
                                                    <p className="text-lg font-medium">No payment records found</p>
                                                    <p className="text-sm text-gray-600">Try adjusting your search</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        table.getRowModel().rows.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="hover:bg-gray-800/50 transition-colors"
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <td
                                                        key={cell.id}
                                                        className="px-6 py-4 whitespace-nowrap"
                                                    >
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {table.getRowModel().rows.length > 0 && (
                            <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-t border-gray-700">
                                <div className="text-sm text-gray-400">
                                    Showing <span className="font-medium text-white">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{' '}
                                    <span className="font-medium text-white">
                                        {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, orders.length)}
                                    </span> of{' '}
                                    <span className="font-medium text-white">{orders.length}</span> results
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                        className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="text-sm text-gray-300">
                                        Page <span className="font-medium text-white">{table.getState().pagination.pageIndex + 1}</span> of{' '}
                                        <span className="font-medium text-white">{table.getPageCount()}</span>
                                    </span>
                                    <button
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                        className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SellerPayments;