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
    UserX,
    Plus,
    X,
} from 'lucide-react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import axiosInstance from 'apps/admin-ui/src/utils/axiosInstance';
import BreadCrumbs from 'apps/admin-ui/src/shared/components/breadcrums';
import ComponentLoader from 'apps/admin-ui/src/shared/components/loading/component-loader';

const UserList = () => {
    const [page, setPage]=useState(1);
    const [globalFilter, setGlobalFilter] = useState('');
    const deferredFilter = useDeferredValue(globalFilter);
    const limit = 10; //items per page
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [emailToPromote, setEmailToPromote] = useState('');

    useEffect(() => {
        setPage(1);
    }, [deferredFilter]);

    const {data, isLoading, refetch}: UseQueryResult<any> = useQuery({
        queryKey:['admins-list', page, deferredFilter],
        queryFn:async () => {
            const res=await axiosInstance.get(`/admin/api/get-all-users?page=${page}&limit=${limit}&search=${deferredFilter}&role=admin`);
            return res.data;
        },
        placeholderData: (prev) => prev,
        staleTime:5 * 60 * 1000, //5 minutes
    });

    const allAdmins = data?.data || [];
    const totalAdmins = data?.meta.totalAdmins ?? 0;
    const totalPages = data?.meta.totalPages ?? 0;

    const handleRemoveAdmin = async (email: string) => {
        if (window.confirm(`Are you sure you want to remove admin rights from ${email}?`)) {
            try {
                await axiosInstance.put('/admin/api/remove-admin', { email });
                refetch();
            } catch (error) {
                console.error("Failed to remove admin role:", error);
                alert("Failed to remove admin role. Please try again.");
            }
        }
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailToPromote) return;
        try {
            await axiosInstance.put('/admin/api/add-new-admin', {
                email: emailToPromote,
                role: 'admin'
            });
            setIsModalOpen(false);
            setEmailToPromote('');
            refetch();
            alert("User promoted to admin successfully!");
        } catch (error: any) {
            console.error("Failed to add admin:", error);
            alert(error.response?.data?.message || "Failed to add admin.");
        }
    };

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
            {
                header: 'Actions',
                id: 'actions',
                cell: ({ row }: any) => {
                    if (row.original.role === 'admin') {
                        return (
                            <button
                                onClick={() => handleRemoveAdmin(row.original.email)}
                                className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition text-xs font-medium"
                                title="Remove Admin Role"
                            >
                                <UserX size={14} />
                                Demote
                            </button>
                        );
                    }
                    return null;
                }
            },
        ],[]
    );
    
    const table=useReactTable({
        data: allAdmins,
        columns,
        getCoreRowModel:getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });


    const exportCSV = () => {
        const headers = ['ID', 'Name', 'Email', 'Role', 'Joined At'];
        const csvData = allAdmins.map((admin: any) =>
            [
                `"${admin.id}"`,
                `"${String(admin.name || '').replace(/"/g, '""')}"`,
                `"${String(admin.email || '').replace(/"/g, '""')}"`,
                admin.role,
                new Date(admin.createdAt).toLocaleDateString(),
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
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
                    >
                        <Plus size={20} />
                        <p className='text-xs'>Add New Admin</p>
                    </button>
                    <button
                        onClick={exportCSV}
                        disabled={isLoading || allAdmins.length === 0}
                        className='flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        <Download size={20} />
                        <p className='text-xs'>Export CSV</p>
                    </button>
                </div>
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
            </div>

            {/*Table*/}
            <div className='bg-gray-900 rounded-xl shadow-xl border border-gray-800 overflow-hidden'>
                {isLoading ? (
                    <ComponentLoader text="Loading admins..." />
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
                                        {Math.min(page * limit, totalAdmins)}
                                    </span> of{' '}
                                    <span className="font-medium text-white">{totalAdmins}</span> results
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
            {/* Add Admin Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl w-full max-w-md shadow-2xl relative">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        
                        <h2 className="text-xl font-bold mb-4 text-white">Promote User to Admin</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Enter the email address of the user you want to promote to admin status.
                        </p>

                        <form onSubmit={handleAddAdmin}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    User Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={emailToPromote}
                                    onChange={(e) => setEmailToPromote(e.target.value)}
                                    placeholder="user@example.com"
                                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 transition"
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    Promote to Admin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserList;