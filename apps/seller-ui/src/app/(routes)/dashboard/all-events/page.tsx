'use client';
import React, { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender } from '@tanstack/react-table';
import { Search, Pencil } from 'lucide-react';
import Link from 'next/link';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import BreadCrumbs from 'apps/seller-ui/src/shared/components/breadcrums';
import ComponentLoader from 'apps/seller-ui/src/shared/components/loading/component-loader';
import EditEventModal from 'apps/seller-ui/src/shared/components/modals/edit.event.modal';

const fetchEvents = async () => {
  const res = await axiosInstance.get('/product/api/get-shop-events');
  return res?.data?.events;
};

const EventList = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['shop-events'],
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000,
  });

  const openEditModal = (event: any) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const columns = useMemo(
    () => [
      {
        header: 'Images',
        accessorKey: 'image',
        cell: ({ row }: any) => (
          <Image
            src={row.original.images[0]?.file_url}
            alt="product"
            width={50}
            height={50}
            className="w-12 h-12 object-cover rounded-md"
          />
        ),
      },
      {
        header: 'Product Name',
        accessorKey: 'title',
        cell: ({ row }: any) => (
          <Link
            href={`${process.env.NEXT_PUBLIC_USER_UI_URL}/product/${row.original.slug}`}
            className="text-blue-400 hover:underline"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        header: 'Sale Price',
        accessorKey: 'sale_price',
        cell: ({ row }: any) => <span>${row.original.sale_price.toFixed(2)}</span>,
      },
      {
        header: 'Start Date',
        accessorKey: 'starting_date',
        cell: ({ row }: any) => <span>{new Date(row.original.starting_date).toLocaleDateString()}</span>,
      },
      {
        header: 'End Date',
        accessorKey: 'ending_date',
        cell: ({ row }: any) => <span>{new Date(row.original.ending_date).toLocaleDateString()}</span>,
      },
      {
        header: 'Actions',
        accessorKey: 'actions',
        cell: ({ row }: any) => (
          <div className="flex gap-3">
            <button
              onClick={() => openEditModal(row.original)}
              className="text-yellow-400 hover:text-yellow-300 transition"
            >
              <Pencil size={18} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: events,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="w-full min-h-screen p-8">
      <div className="flex justify-between items-center mb-1">
        <BreadCrumbs title="All Events" />
      </div>
      <div className="mb-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search events..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full bg-transparent outline-none text-white"
        />
      </div>
      <div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
        {isLoading ? (
          <ComponentLoader text='Loading events'/>
        ) : (
          <table className="w-full text-white">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-800">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-3 text-left">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-800 hover:bg-gray-900 transition">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {showEditModal && (
          <EditEventModal
            event={selectedEvent}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default EventList;