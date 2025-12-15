'use client';
import React, { useMemo, useState, useDeferredValue, useEffect } from 'react'
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
    Filter,
} from 'lucide-react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import axiosInstance from 'apps/admin-ui/src/utils/axiosInstance';
import BreadCrumbs from 'apps/admin-ui/src/shared/components/breadcrums';
import ComponentLoader from 'apps/admin-ui/src/shared/components/loading/component-loader';

const UserList = () => {
    const [page, setPage]=useState(1);
    const [globalFilter, setGlobalFilter] = useState('');
    const deferredFilter = useDeferredValue(globalFilter);
    const [roleFilter, setRoleFilter] = useState('all');
    const limit = 10; //items per page

    useEffect(() => {
        setPage(1);
    }, [deferredFilter, roleFilter]);

    const {data, isLoading}: UseQueryResult<any> = useQuery({
        queryKey:['users-list', page, deferredFilter, roleFilter],
        queryFn:async () => {
            const res=await axiosInstance.get(`/admin/api/get-all-users?page=${page}&limit=${limit}&search=${deferredFilter}&role=${roleFilter}`);
            return res.data;
        },
        placeholderData: (prev) => prev,
        staleTime:5 * 60 * 1000, //5 minutes
    });

    const allUsers = data?.data || [];
    const totalUsers = data?.meta.totalUsers ?? 0;
    const totalPages = data?.meta.totalPages ?? 0;


    const columns=useMemo(
        () =>[
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
                header: 'Role',
                accessorKey: 'role',
                cell: ({ row }: any) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.original.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                        {row.original.role}
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
        data: allUsers,
        columns,
        getCoreRowModel:getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });


    const exportCSV = () => {
        const headers = ['ID', 'Name', 'Email', 'Role', 'Joined At'];
        const csvData = allUsers.map((user: any) =>
            [
                `"${user.id}"`,
                `"${String(user.name || '').replace(/"/g, '""')}"`,
                `"${String(user.email || '').replace(/"/g, '""')}"`,
                user.role,
                new Date(user.createdAt).toLocaleDateString(),
            ].join(',')
        );
        const blob = new Blob(['\uFEFF' + headers.join(',') + '\n' + csvData.join('\n')], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `users-page-${page}-${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    

    return (
        <div className='w-full min-h-screen p-6 bg-gray-950 text-white'>
            {/*Header*/}
            <div className='flex justify-between items-center mb-4'>
                <BreadCrumbs title="All Users"/>
                <button
                    onClick={exportCSV}
                    disabled={isLoading || allUsers.length === 0}
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
                        placeholder='Search by name or email...'
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className='w-full bg-gray-900 border border-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 transition'
                    />
                </div>
                <div className='flex items-center gap-2 w-full md:w-auto'>
                    <Filter size={20} className='text-gray-400'/>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className='bg-gray-900 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 transition cursor-pointer appearance-none'
                    >
                        <option value="all">All Roles</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>

            {/*Table*/}
            <div className='bg-gray-900 rounded-xl shadow-xl border border-gray-800 overflow-hidden'>
                {isLoading ? (
                    <ComponentLoader text="Loading users..." />
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
                                                    <p className="text-lg font-medium">No users found</p>
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
                                        {Math.min(page * limit, totalUsers)}
                                    </span> of{' '}
                                    <span className="font-medium text-white">{totalUsers}</span> results
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

export default UserList;