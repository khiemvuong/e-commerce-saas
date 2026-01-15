'use client';
import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Bell,
    Download,
    AlertCircle,
    CheckCircle,
    Info,
} from 'lucide-react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';

const SellerNotifications = () => {
    const [globalFilter, setGlobalFilter] = useState('');
    const deferredFilter = useDeferredValue(globalFilter);
    const [page, setPage] = useState(1);
    const limit = 10; // items per page

    const { data, isLoading }: UseQueryResult<any> = useQuery({
        queryKey: ['seller-notifications', page, deferredFilter],
        queryFn: async () => {
            const res = await axiosInstance.get(
                `/seller/api/seller-notifications?page=${page}&limit=${limit}&search=${deferredFilter}`
            );
            return res.data;
        },
        placeholderData: (prev) => prev,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    useEffect(() => {
        if (deferredFilter) {
            setPage(1);
        }
    }, [deferredFilter]);

    const allNotifications = data?.data || [];
    const totalNotifications = data?.meta.totalNotifications ?? 0;
    const totalPages = data?.meta.totalPages ?? 0;

    // Helper function to get notification icon and color based on type
    const getNotificationStyle = (type: string) => {
        switch (type) {
            case 'Order':
                return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10' };
            case 'Promotion':
                return { icon: AlertCircle, color: 'text-purple-500', bgColor: 'bg-purple-500/10' };
            case 'Review':
                return { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-500/10' };
            case 'Follower':
                return { icon: Bell, color: 'text-pink-500', bgColor: 'bg-pink-500/10' };
            case 'System':
            default:
                return { icon: Info, color: 'text-gray-500', bgColor: 'bg-gray-500/10' };
        }
    };

    const columns = useMemo(
        () => [
            {
                header: 'Type',
                accessorKey: 'type',
                cell: ({ row }: any) => {
                    const type = row.original.type || 'System';
                    const style = getNotificationStyle(type);
                    const IconComponent = style.icon;

                    return (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${style.bgColor} w-fit`}>
                            <IconComponent size={16} className={style.color} />
                            <span className={`text-xs font-medium ${style.color} uppercase`}>
                                {type}
                            </span>
                        </div>
                    );
                },
            },
            {
                header: 'Title',
                accessorKey: 'title',
                cell: ({ row }: any) => {
                    const title = row.original.title || 'No Title';
                    const truncatedTitle = title.length > 50
                        ? title.substring(0, 50) + '...'
                        : title;

                    return (
                        <span className="font-medium text-white" title={title}>
                            {truncatedTitle}
                        </span>
                    );
                },
            },
            {
                header: 'Message',
                accessorKey: 'message',
                cell: ({ row }: any) => {
                    const message = row.original.message || 'No message';
                    const truncatedMessage = message.length > 80
                        ? message.substring(0, 80) + '...'
                        : message;

                    return (
                        <span className="text-gray-400 text-sm" title={message}>
                            {truncatedMessage}
                        </span>
                    );
                },
            },
            {
                header: 'Date',
                accessorKey: 'createdAt',
                cell: ({ row }: any) => {
                    const date = new Date(row.original.createdAt);
                    const formattedDate = date.toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                    });
                    const formattedTime = date.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                    });

                    return (
                        <div className="flex flex-col">
                            <span className="text-white text-sm">{formattedDate}</span>
                            <span className="text-gray-500 text-xs">{formattedTime}</span>
                        </div>
                    );
                },
            },
        ],
        []
    );

    const table = useReactTable({
        data: allNotifications,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const exportCSV = () => {
        const headers = ['ID', 'Type', 'Title', 'Message', 'Date'];
        const csvData = allNotifications.map((notification: any) =>
            [
                `"${notification.id}"`,
                `"${String(notification.type || 'System').replace(/"/g, '""')}"`,
                `"${String(notification.title || '').replace(/"/g, '""')}"`,
                `"${String(notification.message || '').replace(/"/g, '""')}"`,
                `"${new Date(notification.createdAt).toLocaleString('vi-VN')}"`,
            ].join(',')
        );
        const blob = new Blob(['\uFEFF' + headers.join(',') + '\n' + csvData.join('\n')], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `seller-notifications-page-${page}-${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full min-h-screen p-6 bg-gray-900 text-white">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Notifications</h1>
                <button
                    onClick={exportCSV}
                    disabled={isLoading || allNotifications.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={20} />
                    <p className="text-xs">Export CSV</p>
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex items-center bg-gray-800 border border-gray-700 p-3 rounded-lg hover:border-gray-600 transition">
                <Search size={20} className="text-gray-400 mr-3" />
                <input
                    type="text"
                    placeholder="Search by title or message..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="w-full bg-transparent outline-none text-white placeholder-gray-500"
                />
            </div>

            {/* Table */}
            <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-700 border-b border-gray-600">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <th
                                                    key={header.id}
                                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider"
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
                                <tbody className="divide-y divide-gray-700">
                                    {table.getRowModel().rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={columns.length} className="text-center text-gray-500 py-12">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Bell size={48} className="text-gray-600" />
                                                    <p className="text-lg font-medium">No notifications found</p>
                                                    <p className="text-sm text-gray-500">Try adjusting your search</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        table.getRowModel().rows.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-700/50 transition">
                                                {row.getVisibleCells().map((cell) => (
                                                    <td key={cell.id} className="px-6 py-4">
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
                            <div className="flex items-center justify-between px-6 py-4 bg-gray-700 border-t border-gray-600">
                                <div className="text-sm text-gray-400">
                                    Showing <span className="font-medium text-white">{(page - 1) * limit + 1}</span> to{' '}
                                    <span className="font-medium text-white">
                                        {Math.min(page * limit, totalNotifications)}
                                    </span> of{' '}
                                    <span className="font-medium text-white">{totalNotifications}</span> results
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                        disabled={page === 1}
                                        className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="text-sm text-gray-300">
                                        Page <span className="font-medium text-white">{page}</span> of{' '}
                                        <span className="font-medium text-white">{totalPages}</span>
                                    </span>
                                    <button
                                        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                        disabled={page === totalPages}
                                        className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
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

export default SellerNotifications;
