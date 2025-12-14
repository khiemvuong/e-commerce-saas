'use client';
import React, { useMemo, useState, useDeferredValue, useEffect } from 'react';
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
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import axiosInstance from 'apps/admin-ui/src/utils/axiosInstance';
import BreadCrumbs from 'apps/admin-ui/src/shared/components/breadcrums';
import ComponentLoader from 'apps/admin-ui/src/shared/components/loading/component-loader';
import Image from 'next/image';

const SellerList = () => {
    const [page, setPage]=useState(1);
    const [globalFilter, setGlobalFilter] = useState('');
    const deferredFilter = useDeferredValue(globalFilter);
    const limit = 10; //items per page

    useEffect(() => {
        if (deferredFilter) {
            setPage(1);
        }
    }, [deferredFilter]);

    const {data, isLoading}: UseQueryResult<any> = useQuery({
        queryKey:['sellers-list', page, deferredFilter],
        queryFn:async () => {
            const res=await axiosInstance.get(`/admin/api/get-all-sellers?page=${page}&limit=${limit}&search=${deferredFilter}`);
            return res.data;
        },
        placeholderData: (prev) => prev,
        staleTime:5 * 60 * 1000, //5 minutes
    });

    const allSellers = data?.data || [];
    const totalSellers = data?.meta.totalSellers ?? 0;
    const totalPages = data?.meta.totalPages ?? 0;


    const columns=useMemo(
        () =>[
            {
                header: 'Avatar',
                accessorKey: 'shop.avatar',
                cell: ({ row }: any) => (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-700">
                        <Image
                            src={row.original.shop?.avatar?.[0]?.file_url || 'https://img.favpng.com/8/20/24/computer-icons-online-shopping-png-favpng-QuiWDXbsc69EE92m3bZ2i0ybS.jpg'}
                            alt={row.original.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                )
            },
            {
                header: 'Name',
                accessorKey: 'name',
                cell: ({ row }: any) => (
                    <span className="font-medium text-white">{row.original.name}</span>
                )
            },
            {
                header: 'Email',
                accessorKey: 'email',
            },
            {
                header: 'Shop Name',
                accessorKey: 'shop.name',
                cell: ({ row }: any) => (
                    <span className="text-purple-400 font-medium">
                        {row.original.shop?.name || 'N/A'}
                    </span>
                )
            },
            {
                header: 'Address',
                accessorKey: 'shop.address',
                cell: ({ row }: any) => (
                    <span className="text-purple-400 font-medium">
                        {row.original.shop?.address || 'N/A'}
                    </span>
                )
            },
            {
                header: 'Joined At',
                accessorKey: 'createdAt',
                cell: ({ row }: any) => (
                    <span className="text-gray-300">
                        {new Date(row.original.createdAt).toLocaleDateString()}
                    </span>
                ),
            },
        ],[]
    );
    
    const table=useReactTable({
        data: allSellers,
        columns,
        getCoreRowModel:getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });


    const exportCSV = () => {
        const headers = ['ID', 'Name', 'Email', 'Shop Name', 'Address', 'Joined At'];
        const csvData = allSellers.map((seller: any) =>
            [
                `"${seller.id}"`,
                `"${String(seller.name || '').replace(/"/g, '""')}"`,
                `"${String(seller.email || '').replace(/"/g, '""')}"`,
                `"${String(seller.shop?.name || 'N/A').replace(/"/g, '""')}"`,
                `"${String(seller.address || 'N/A').replace(/"/g, '""')}"`,
                new Date(seller.createdAt).toLocaleDateString(),
            ].join(',')
        );
        const blob = new Blob(['\uFEFF' + headers.join(',') + '\n' + csvData.join('\n')], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sellers-page-${page}-${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    

    return (
        <div className='w-full min-h-screen p-6 bg-gray-950 text-white'>
            {/*Header*/}
            <div className='flex justify-between items-center mb-4'>
                <BreadCrumbs title="All Sellers"/>
                <button
                    onClick={exportCSV}
                    disabled={isLoading || allSellers.length === 0}
                    className='flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    <Download size={20} />
                    <p className='text-xs'>Export CSV</p>
                </button>
            </div>

            {/*Search and Filter*/}
            <div className='mb-6 flex flex-col md:flex-row gap-4 items-center justify-between'>
                <div className='relative flex-1 w-full'>
                    <Search size={20} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'/>
                    <input
                        type='text'
                        placeholder='Search by name, email, or shop name...'
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className='w-full bg-gray-900 border border-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 transition'
                    />
                </div>
            </div>

            {/*Table*/}
            <div className='bg-gray-900 rounded-xl shadow-xl border border-gray-800 overflow-hidden'>
                {isLoading ? (
                    <ComponentLoader text="Loading sellers..." />
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
                                                    <p className="text-lg font-medium">No sellers found</p>
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
                                        {Math.min(page * limit, totalSellers)}
                                    </span> of{' '}
                                    <span className="font-medium text-white">{totalSellers}</span> results
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

export default SellerList;