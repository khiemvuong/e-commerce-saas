'use client'
import React, { useMemo, useState } from 'react'
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table';
import { Search, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import Link from 'next/link';
import BreadCrumbs from 'apps/seller-ui/src/shared/components/breadcrums';

const fetchOrders = async () => {
    const res = await axiosInstance.get('/order/api/get-seller-orders');
    return res.data.orders;
}

const OrdersTable = () => {
    const [globalFilter, setGlobalFilter] = useState('');

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['seller-orders'],
        queryFn: fetchOrders,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const columns = useMemo(
        () => [
            {
                accessorKey: 'id',
                header: 'Order ID',
                cell: ({ row }: any) => (
                    <span className='text-white truncate'>
                        {row.original.id.slice(-6).toUpperCase()}
                    </span>
                ),
            },
            {
                accessorKey: 'user.name',
                header: 'Buyer',
                cell: ({ row }: any) => (
                    <span className='text-white'>
                        {row.original.user?.name ?? 'Guest'}
                    </span>
                ),
            },
            {
                accessorKey: 'total',
                header: 'Total',
                cell: ({ row }: any) => (
                    <span className='text-white'>
                        ${row.original.total}
                    </span>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }: any) => (
                    <span
                        className={'px-2 py-1 rounded-full text-sm font-semibold ' +
                            `${row.original.status === 'Paid' ? 'bg-green-600 text-white' : 'bg-yellow-500 text-white'
                            }`
                        }>
                        {row.original.status}
                    </span>
                ),
            },
            {
                accessorKey: 'createdAt',
                header: 'Date',
                cell: ({ row }: any) => (
                    <span className='text-white'>
                        {new Date(row.original.createdAt).toLocaleDateString()}
                    </span>
                ),
            },
            {
                header: 'Actions',
                cell: ({ row }: any) => (
                    <div className='flex gap-3'>
                        <Link
                            href={`/order/${row.original.id}`}
                            className='text-blue-400 hover:text-blue-300 transistion'
                        >
                            <Eye size={18} />
                        </Link>
                    </div>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data: orders,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn: 'includesString',
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
    });

    return (
        <div className='w-full min-h-screen p-8'>
            {/*Header*/}
            <div className='flex justify-between items-center mb-1'>
                <BreadCrumbs title='All Orders' />
            </div>

            {/*Search Bar*/}
            <div className='mb-4 flex items-center bg-gray-900 p-2 rounded-md flex-1'>
                <Search size={18} className='text-gray-400 mr-2' />
                <input
                    type='text'
                    placeholder='Search orders...'
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className='w-full bg-transparent outline-none text-white'
                />
            </div>

            {/*Table*/}
            <div className='overflow-x-auto bg-gray-900 rounded-lg p-4'>
                {isLoading ? (
                    <p className='text-white text-center'>Loading orders...</p>
                ) : (
                    <>
                        <table className="w-full text-white">
                            <thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id} className='border-b border-gray-800'>
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                className='p-3 text-left'
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
                            <tbody>
                                {table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className='border-b border-gray-800 hover:bg-gray-900 transition'>
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className='p-3'>
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
                        {!isLoading && orders.length === 0 && (
                            <p className="text-center text-gray-400 py-4">
                                No orders found.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
export default OrdersTable;