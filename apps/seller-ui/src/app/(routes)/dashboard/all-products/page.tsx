'use client';
import React, { useMemo, useState } from 'react'
import{
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table';
import {
    Search,
    Pencil,
    Trash,
    Eye,
    BarChart,
    Star,
} from 'lucide-react';
import Link from 'next/link';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import Image from 'next/image';
import DeleteConfirmationModal from 'apps/seller-ui/src/shared/components/modals/delete.confirmation.modal';
import BreadCrumbs from 'apps/seller-ui/src/shared/components/breadcrums';
import EditProductModal from 'apps/seller-ui/src/shared/components/modals/edit.product.modal';
import ComponentLoader from 'apps/seller-ui/src/shared/components/loading/component-loader';
import { API_CONFIG, queryKeys } from 'apps/seller-ui/src/utils/apiConfig';


const fetchProducts = async () => {
    const res=await axiosInstance.get('/product/api/get-shop-products');
    return res?.data?.products;
}
const deleteProduct = async (productId:string) => {
    await axiosInstance.delete(`/product/api/delete-product/${productId}`);
}
const restoreProduct = async (productId:string) => {
    await axiosInstance.put(`/product/api/restore-product/${productId}`);
}
const ProductList = () => {
    const [globalFilter, setGlobalFilter]=useState('');
    const [showDeleteModal, setShowDeleteModal]=useState(false);
    const [showEditModal, setShowEditModal]=useState(false);
    const [selectedProduct, setSelectedProduct]=useState<any>();
    const queryClient=useQueryClient();

    const {data: products=[], isLoading}=useQuery({
        queryKey: queryKeys.products.all,
        queryFn:fetchProducts,
        staleTime: API_CONFIG.STALE_TIME.PRODUCTS,
        gcTime: API_CONFIG.GC_TIME.DEFAULT,
    });

    const deleteMutation=useMutation({
        mutationFn:deleteProduct,
        onSuccess:() => {
            queryClient.invalidateQueries({ queryKey:['shop-products'] });
            setShowDeleteModal(false);
        }
    });

    const restoreMutation=useMutation({
        mutationFn:restoreProduct,
        onSuccess:() => {
            queryClient.invalidateQueries({ queryKey:['shop-products'] });
            setShowDeleteModal(false);
        }
    });

    const columns=useMemo(
        () =>[
            {
                header:'Images',
                accessorKey:'image',
                cell:({row}:any) => {
                    return (
                        console.log(row.original),
                    <Image
                        src={row.original.images[0]?.file_url}
                        alt={row.original.images[0]?.file_url}
                        width={200}
                        height={200}
                        className="w-12 h-12 object-cover rounded-md"
                    />
                )}
            },
            {
                header:'Product Name',
                accessorKey:'name',
                cell:({row}:any) => {
                    const truncatedTitle = row.original.title.length > 25
                    ? row.original.title.substring(0, 25) + '...'
                    : row.original.title;

                    return(
                        <Link
                            href={`${process.env.NEXT_PUBLIC_USER_UI_URL}/product/${row.original.slug}`}
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
                accessorKey:'price',
                cell:({row}:any) => {
                    const salePrice = row.original.sale_price ?? row.original.price;
                    const regularPrice = row.original.regular_price ?? row.original.compareAtPrice;
                    const displayPrice = salePrice || regularPrice || 0;
                    return <span>{`$${displayPrice.toFixed(2)}`}</span>;
                }
            },
            {
                header:'Stock',
                accessorKey:'stock',
                cell:({row}:any) => (<span className={row.original.stock<10 ? 'text-red-500' : 'text-white'}>{row.original.stock} left</span>
                ),

            },
            {
                header:'Category',
                accessorKey:'category',
            },
            {
                header:"Rating",
                accessorKey:"rating",
                cell:({row}:any) => (
                <div className='flex items-center gap-1 text-yellow-400'>
                    <Star fill="#FFD700" size={18}/>{" "}
                    <span className="text-white">{row.original.rating ? row.original.rating.toFixed(1) : 'N/A'}</span>
                </div>
            ),
            },
            {
                header:'COD',
                accessorKey:'cod',
                cell:({row}:any) => (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        row.original.cash_on_delivery === 'yes' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-600 text-gray-300'
                    }`}>
                        {row.original.cash_on_delivery === 'yes' ? 'COD Available' : 'No COD'}
                    </span>
                ),
            },
            {
                header:'Actions',
                accessorKey:'actions',
                cell:({row}:any) => (
                    <div className='flex gap-3'>
                        <Link
                            href={`${process.env.NEXT_PUBLIC_USER_UI_URL}/product/${row.original.slug}`}
                            className='text-blue-400 hover:text-blue-300 transistion'
                        >
                            <Eye size={18}/>
                        </Link>
                        <button
                            onClick={() => openEditModal(row.original)}
                            className='text-yellow-400 hover:text-yellow-300 transistion'
                        >
                            <Pencil size={18}/>
                        </button>
                        <button
                            // onClick={() => openAnalyticsModal(row.original)}
                            className='text-green-400 hover:text-green-300 transistion'
                        >
                            <BarChart size={18}/>
                        </button>
                        <button
                            onClick={() => openDeleteModal(row.original)}
                            className='text-red-500 hover:text-red-400 transistion'
                        >
                            <Trash size={18}/>
                        </button>
                    </div>
                ),
            }
        ],[]
    );
    
    const table=useReactTable({
        data:products,
        columns,
        getCoreRowModel:getCoreRowModel(),
        getFilteredRowModel:getFilteredRowModel(),
        globalFilterFn:'includesString',
        state:{
            globalFilter,
        },
        onGlobalFilterChange:setGlobalFilter,
    });

    const openDeleteModal=(product:any) => {
        setSelectedProduct(product);
        setShowDeleteModal(true);
    }

    const openEditModal=(product:any) => {
        setSelectedProduct(product);
        setShowEditModal(true);
    }
    return (
        <div className='w-full min-h-screen p-8'>
            {/*Header*/}
            <div className='flex justify-between items-center mb-1'>
                <BreadCrumbs title="All Products"/>
            </div>
            {/*Search Bar*/}
            <div className='mb-4 flex items-center bg-gray-900 p-2 rounded-md flex-1'>
                <Search size={18} className='text-gray-400 mr-2'/>
                <input
                    type='text'
                    placeholder='Search products...'
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className='w-full bg-transparent outline-none text-white'
                />
            </div>
            {/*Table*/}
            <div className='overflow-x-auto bg-gray-900 rounded-lg p-4'>
                {isLoading ? (
                    <ComponentLoader text='Loading products...' />
                ) : (
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
                )}
                {showDeleteModal && (
                    <DeleteConfirmationModal
                        product={selectedProduct}
                        onClose={() => setShowDeleteModal(false)}
                        onConfirm={() => deleteMutation.mutate(selectedProduct?.id)}
                        onRestore={() => restoreMutation.mutate(selectedProduct?.id)}
                    />
                )}
                {showEditModal && (
                    <EditProductModal
                        product={selectedProduct}
                        onClose={() => setShowEditModal(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default ProductList;