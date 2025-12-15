'use client';
import React, { useDeferredValue, useEffect, useMemo, useState } from 'react'
import{
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Download,
} from 'lucide-react';
import Link from 'next/link';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import Image from 'next/image';
import axiosInstance from 'apps/admin-ui/src/utils/axiosInstance';
import BreadCrumbs from 'apps/admin-ui/src/shared/components/breadcrums';
import ComponentLoader from 'apps/admin-ui/src/shared/components/loading/component-loader';

const EventList = () => {
    const [globalFilter, setGlobalFilter]=useState('');
    const deferredFilter = useDeferredValue(globalFilter);
    const [page, setPage]=useState(1);
    const limit = 10; //items per page

    const {data, isLoading} : UseQueryResult<any> = useQuery({
        queryKey:['event-list', page, deferredFilter],
        queryFn:async () => {
            const res=await axiosInstance.get(`/admin/api/get-all-events?page=${page}&limit=${limit}&search=${deferredFilter}`);
            return res.data;
        },
        placeholderData: (prev) => prev,
        staleTime:5 * 60 * 1000, //5 minutes
    });

    useEffect(() => {
        if (deferredFilter) {
            setPage(1);
        }
    }, [deferredFilter]);

    const allEvents = data?.data || [];
    const totalEvents = data?.meta.totalProducts ?? 0;
    const totalPages = data?.meta.totalPages ?? 0;

    const columns=useMemo(
        () =>[
            {
                header:'Image',
                accessorKey:'images',
                cell:({row}:any) => {
                    const imageUrl = row.original.images?.[0]?.file_url;
                    return (
                    <Image
                        src={imageUrl || '/default-product-image.png'}
                        alt={row.original.title}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-cover rounded-md"
                    />
                )}
            },
            {
                header:'Event Name',
                accessorKey:'title',
                cell:({row}:any) => {
                    const truncatedTitle = row.original.title.length > 30
                    ? row.original.title.substring(0, 30) + '...'
                    : row.original.title;

                    return(
                        <Link
                            href={`${process.env.NEXT_PUBLIC_USER_UI_URL}/product/${row.original.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                            title={row.original.title}
                        >
                            {truncatedTitle}
                        </Link>
                    );
                }
                
            },

            {
                header:'Price',
                accessorKey:'sale_price',
                cell:({row}:any) => (<span>{`$${row.original.sale_price.toFixed(2)}`}</span>
            ),
            },
            {
                header:'Stock',
                accessorKey:'stock',
                cell:({row}:any) => (<span className={row.original.stock<10 ? 'text-red-500 font-semibold' : 'text-white'}>{row.original.stock} left</span>
                ),

            },
            {
                header: 'Start Date',
                accessorKey: 'starting_date',
                cell: ({ row }: any) => (
                    <span className="text-gray-300">
                        {row.original.starting_date ? new Date(row.original.starting_date).toLocaleDateString() : '-'}
                    </span>
                ),
            },
            {
                header: 'End Date',
                accessorKey: 'ending_date',
                cell: ({ row }: any) => (
                    <span className="text-gray-300">
                        {row.original.ending_date ? new Date(row.original.ending_date).toLocaleDateString() : '-'}
                    </span>
                ),
            },
            {
                header: 'Shop',
                accessorKey: 'Shop.name',
                cell: ({ row }: any) => (
                    <span className="font-medium text-purple-400">{row.original.Shop?.name ?? 'N/A'}</span>
                ),
            },
        ],[]
    );
    
    const table=useReactTable({
        data: allEvents,
        columns,
        getCoreRowModel:getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });


    const exportCSV = () => {
        const headers = ['ID', 'Title', 'Shop', 'Price', 'Stock', 'Category', 'Start Date', 'End Date', 'Rating'];
        const csvData = allEvents.map((event: any) =>
            [
                `"${event.id}"`,
                `"${String(event.title || '').replace(/"/g, '""')}"`,
                `"${String(event.Shop?.name || 'N/A').replace(/"/g, '""')}"`,
                event.sale_price,
                event.stock,
                `"${String(event.category || '').replace(/"/g, '""')}"`,
                event.starting_date ? new Date(event.starting_date).toLocaleDateString() : 'N/A',
                event.ending_date ? new Date(event.ending_date).toLocaleDateString() : 'N/A',
                event.rating || 'N/A',
            ].join(',')
        );
        const blob = new Blob(['\uFEFF' + headers.join(',') + '\n' + csvData.join('\n')], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `events-page-${page}-${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    

    return (
        <div className='w-full min-h-screen p-6 bg-gray-950 text-white'>
            {/*Header*/}
            <div className='flex justify-between items-center mb-4'>
                <BreadCrumbs title="All Events"/>
                <button
                    onClick={exportCSV}
                    disabled={isLoading || allEvents.length === 0}
                    className='flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    <Download size={20} />
                    <p className='text-xs'>Export CSV</p>
                </button>
            </div>
            {/*Search Bar*/}
            <div className='mb-6 flex items-center bg-gray-900 border border-gray-800 p-3 rounded-lg hover:border-gray-700 transition'>
                <Search size={20} className='text-gray-400 mr-3'/>
                <input
                    type='text'
                    placeholder='Search by event name, category, or shop...'
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className='w-full bg-transparent outline-none text-white placeholder-gray-500'
                />
            </div>
            {/*Table*/}
            <div className='bg-gray-900 rounded-xl shadow-xl border border-gray-800 overflow-hidden'>
                {isLoading ? (
                    <ComponentLoader text="Loading events..." />
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
                                                    <p className="text-lg font-medium">No events found</p>
                                                    <p className="text-sm text-gray-600">Try adjusting your search</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        table.getRowModel().rows.map((row) => (
                                            <tr key={row.id} className='hover:bg-gray-800/50 transition'>
                                                {row.getVisibleCells().map((cell) => (
                                                    <td key={cell.id} className='px-6 py-4 whitespace-nowrap'>
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
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-t border-gray-700">
                                <div className="text-sm text-gray-400">
                                    Showing <span className="font-medium text-white">{(page - 1) * limit + 1}</span> to{' '}
                                    <span className="font-medium text-white">
                                        {Math.min(page * limit, totalEvents)}
                                    </span> of{' '}
                                    <span className="font-medium text-white">{totalEvents}</span> results
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                                        disabled={page === 1}
                                        className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="text-sm text-gray-300">
                                        Page <span className="font-medium text-white">{page}</span> of{' '}
                                        <span className="font-medium text-white">{totalPages}</span>
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                                        disabled={page === totalPages}
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

export default EventList;