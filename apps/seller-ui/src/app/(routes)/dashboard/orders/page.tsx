'use client'
import React,{useMemo,useState} from 'react'
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table';

import { Search,Eye, Loader2} from 'lucide-react';
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

    const { data: orders = [],isLoading} = useQuery({
        queryKey: ['seller-orders'],
        queryFn: fetchOrders,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const columns = useMemo(
        () => [
            {
                accessorKey: 'id',
                header: 'Order ID',
                cell:({row}:any) => (
                    <span className ='text-white text-sm truncate'>
                        {row.original.id.slice(-6).toUpperCase()}
                    </span>
                ),
            },
            {
                accessorKey: 'user.name',
                header: 'Buyer',
                cell:({row}:any) => (
                    <span className ='text-gray-800 text-sm'>
                        {row.original.user?.name ?? 'Guest'}
                    </span>
                ),
            },
            {
                accessorKey: 'total',
                header: 'Total',
                cell:({row}:any) => (
                    <span className ='text-gray-800 text-sm'>
                        ${row.original.total}
                    </span>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell:({row}:any) => (
                    <span 
                        className ={'px-2 py-1 rounded-full text-xs ' +
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
                cell:({row}:any) => (
                    <span className ='text-gray-800 text-sm'>
                        {new Date(row.original.createdAt).toLocaleDateString()}
                    </span>
                ),
            },
            {
                header: 'Actions',
                cell:({row}:any) => (
                    <Link
                        href = {`/orders/${row.original.id}`}
                        className ='text-blue-600 hover:underline flex items-center gap-1'
                    >
                        <Eye size={18}/>
                    </Link>
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
        <div className="w-full min-h-screen p-8">
            <BreadCrumbs title = 'All Orders'/>
            {/*Search Bar*/}
            <div className="my-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
                <Search size={20} className="text-gray-400 mr-2"/>
                <input
                    type="text"
                    placeholder="Search orders..."
                    className="w-full bg-transparent outline-none text-white placeholder-gray-400"
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
            </div>
            {/*Orders Table*/}
            <div className="overflow-x-auto bg-gray-900 rounded-lg p-4 shadow-md">
                {isLoading ? (
                    <div className="flex justify-center items-center min-h-[200px]">
                        <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-3">
                            <Loader2 size={48} className="animate-spin text-blue-600"/>
                            <p className="text-gray-400 font-medium">Loading orders...</p>
                        </div>
                    </div>
                ) : (
                    <table className='w-full text-white' >
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className='border-b border-gray-800'>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className='text-left px-4 py-2 text-sm font-medium'
                                        >
                                            {flexRender(
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
                                <tr
                                    key={row.id}
                                    className='border-b border-gray-800 hover:bg-gray-800'
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id} className='px-4 py-3 text-sm'
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
                )}
                {!isLoading && orders.length === 0 && (
                    <p className="text-center text-gray-400 py-10">
                        No orders found.
                    </p>
                )}
            </div>
        </div>
    );
}
export default OrdersTable;