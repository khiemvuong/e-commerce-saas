'use client';

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { useRouter } from "next/navigation";
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
} from "@tanstack/react-table";
import React, { useMemo } from "react";
import { Package, Loader2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';


const OrderTable = () => {
    const router = useRouter();
    const {data: orders = [], isLoading} = useQuery({
        queryKey: ['user-orders'],
        queryFn: async () => {
            const res = await axiosInstance.get('/order/api/get-user-orders');
            return res.data.orders;
        },
        staleTime: 5 * 60 * 1000,
    });

    const columns = useMemo(
        () => [
            {
                header: 'Order ID',
                accessorKey: 'id',
                cell: ({ row }: any) => (
                    <span className='text-gray-700 font-mono text-sm font-medium'>
                        #{row.original.id.slice(-8).toUpperCase()}
                    </span>
                ),
            },
            {
                header: 'Shop',
                accessorKey: 'shop.name',
                cell: ({ row }: any) => (
                    <div className='text-gray-800 font-medium'>
                        {row.original.shop?.name || 'N/A'}
                    </div>
                ),
            },
            {
                header: 'Items',
                cell: ({ row }: any) => (
                    <span className='text-gray-600'>
                        {row.original.items?.length || 0} item(s)
                    </span>
                ),
            },
            {
                header: 'Total',
                accessorKey: 'total',
                cell: ({ row }: any) => (
                    <span className='text-gray-800 font-semibold'>
                        ${row.original.total.toFixed(2)}
                    </span>
                ),
            },
            {
                header: 'Status',
                accessorKey: 'status',
                cell: ({ row }: any) => {
                    const status = row.original.status || 'Pending';
                    const statusColors: any = {
                        'Paid': 'bg-green-100 text-green-700 border-green-200',
                        'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
                        'Failed': 'bg-red-100 text-red-700 border-red-200',
                    };
                    return (
                        <span className={`px-3 py-1 rounded-md text-xs font-semibold border ${statusColors[status] || statusColors['Pending']}`}>
                            {status}
                        </span>
                    );
                },
            },
            {
                header: 'Delivery',
                accessorKey: 'deliveryStatus',
                cell: ({ row }: any) => {
                    const status = row.original.deliveryStatus || 'Processing';
                    const statusColors: any = {
                        'Delivered': 'bg-green-100 text-green-700 border-green-200',
                        'Shipped': 'bg-blue-100 text-blue-700 border-blue-200',
                        'Processing': 'bg-orange-100 text-orange-700 border-orange-200',
                        'Ordered': 'bg-purple-100 text-purple-700 border-purple-200',
                    };
                    return (
                        <span className={`px-3 py-1 rounded-md text-xs font-semibold border ${statusColors[status] || statusColors['Processing']}`}>
                            {status}
                        </span>
                    );
                },
            },
            {
                header: 'Date',
                accessorKey: 'createdAt',
                cell: ({ row }: any) => (
                    <div className='text-gray-600 text-sm'>
                        {new Date(row.original.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                        })}
                    </div>
                ),
            },
            {
                header: 'Actions',
                cell: ({ row }: any) => (
                    <button
                        onClick={() => router.push(`/order/${row.original.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition text-sm font-medium"
                    >
                        <Eye size={16} />
                        View
                    </button>
                ),
            },
        ],
        [router]
    );

    const table = useReactTable({
        data: orders,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[400px] gap-3">
                <Loader2 size={40} className="animate-spin text-blue-600" />
                <p className="text-gray-600">Loading your orders...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className='px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'
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
                    <tbody className="divide-y divide-gray-200">
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center text-gray-500 py-12">
                                    <div className="flex flex-col items-center gap-2">
                                        <Package size={48} className="text-gray-400" />
                                        <p className="text-lg font-medium text-gray-700">No orders yet</p>
                                        <p className="text-sm text-gray-500">Start shopping to see your orders here</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="hover:bg-gray-50 transition-colors"
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
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        Showing <span className="font-medium text-gray-800">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{' '}
                        <span className="font-medium text-gray-800">
                            {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, orders.length)}
                        </span> of{' '}
                        <span className="font-medium text-gray-800">{orders.length}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm text-gray-600">
                            Page <span className="font-medium text-gray-800">{table.getState().pagination.pageIndex + 1}</span> of{' '}
                            <span className="font-medium text-gray-800">{table.getPageCount()}</span>
                        </span>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderTable;
