'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DeleteDiscountCodeModal from 'apps/seller-ui/src/shared/components/modals/delete.discount-code';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import { AxiosError } from 'axios';
import { ChevronRight,  Plus, PlusCircle, Trash, X } from 'lucide-react'
import Link from 'next/link';
import Input from 'packages/components/input';
import React, {  useState } from 'react'
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const Page = () => {
    const [showModal,setShowModal] =useState(false);
    const queryClient=useQueryClient();
    const [showDeleteModal,setShowDeleteModal]=useState(false);
    const [selectedDiscount,setSelectedDiscount]=useState<any>();
    const{data:discountCodes=[],isLoading}=useQuery({
        queryKey:['shop-discounts'],
        queryFn: async ()=>{
            const res=await axiosInstance.get('/product/api/get-discount-codes');
            return res?.data?.discount_codes || [];
        },
    });

    const{
        register,
        handleSubmit,
        control,
        reset,
        formState:{errors}
    }=useForm({
        defaultValues:{
            public_name:'',
            discountType:'percentage',
            discountValue:'',
            discountCode:'',
        }
    });
    const createDiscountCodeMutation= useMutation({
        mutationFn: async (data)=>{
            const res=await axiosInstance.post('/product/api/create-discount-code',data);
            return res?.data;
        },
        onSuccess:()=>{
            queryClient.invalidateQueries({queryKey:['shop-discounts']});
            reset();
            setShowModal(false);
        }
    });

    const deleteDiscountCodeMutation= useMutation({
        mutationFn: async (discountId)=>{
            await axiosInstance.delete(`/product/api/delete-discount-code/${discountId}`);
        },
        onSuccess:()=>{
            queryClient.invalidateQueries({queryKey:['shop-discounts']});
            setShowDeleteModal(false);
            toast.success("Discount code deleted successfully");
        }
    })
    const handleDeleteClick=async(discount:any)=>{
        setSelectedDiscount(discount);
        setShowDeleteModal(true);
    };
    const onSubmit=(data:any)=>{
        if(discountCodes.length >= 8){
            toast.error("You have reached the maximum limit of 8 discount codes.");
            return;
        }
        createDiscountCodeMutation.mutate(data);
    }

  return (
    <div className="w-full p-8 min-h-screen">
        <div className="flex justify-between items-center mb-1">
            <h2 className='text-2xl text-white font-semibold'>Discount Codes</h2>
            <button
            onClick={()=> setShowModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus size={18} />
                Create Discount Code
            </button>
        </div>
        {/* Breadcrumb */}
        <div className="flex items-center text-white text-sm mb-6">
            <Link href={"/dashboard"} className="text-[#80Deea] cursor-pointer">
            Dashboard
            </Link>
            <ChevronRight className="opacity-[.8]" size={16} />
            <span>Discount Codes</span>
        </div>
        {/* Discount Codes List */}
        <div className="mt-8 bg-gray-900 p-6 rounded-lg shadow-lg">
            <h3 className="text-white text-lg font-medium">
                Active Discount Codes
            </h3>
            {isLoading ? (
                <p className="text-white mt-4">Loading...</p>
            ) :              
            (
                <table className='w-full text-white'>
                <thead>
                    <tr className='border-b border-gray-800'>
                        <th className='p-3 text-left'>Title</th>
                        <th className='p-3 text-left'>Type</th>
                        <th className='p-3 text-left'>Value</th>
                        <th className='p-3 text-left'>Code</th>
                        <th className='p-3 text-left'>Actions</th>
                    </tr>
                   
                    </thead>
                     <tbody>
                        {discountCodes?.map((discount:any) => (
                            <tr key={discount?.id} className='border-b border-gray-800 hover:bg-gray-800 transition-colors'>
                                <td className='p-3'>{discount.public_name}</td>
                                <td className='p-3 capitalize'>
                                    {discount.discountType === 'percentage' ? `Percentage (%)` : `Flat($)`}
                                </td>
                                <td className='p-3'>
                                    {discount.discountType === 'percentage' ? `${discount.discountValue}%` : `$${discount.discountValue}$`}</td>
                                <td className='p-3'>{discount.discountCode}</td>
                                <td className='p-3'>
                                    <button
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md"
                                    onClick={() => {handleDeleteClick(discount)}}
                                    >
                                        <Trash size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!isLoading && discountCodes.length === 0 && (
                            <tr>
                                <td colSpan={5} className='p-3 text-center text-gray-50'>No discount codes found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
        {/* Create Discount Code Modal */}
        {showModal && (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[450px]">
                    <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
                        <h3 className="text-white text-xl font-medium">Create Discount Code</h3>
                        <button
                        onClick={() => setShowModal(false)}
                        className="text-gray-500 hover:text-white">
                            <X size={22} />
                        </button>
                    </div>
                    {/* Modal Content - Form fields for creating discount code */}
                    <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                        {/* Titles */}
                        <Input
                            label='Title(Public Name)'
                            {...register('public_name',{required:"Title is required"})}
                        />
                        {errors.public_name && (<p className="text-red-500 text-sm mt-1">{errors.public_name.message}</p>
                        )}
                        {/* Discount Type */}
                        <div className="mt-4">
                            <label className="block font-semibold text-gray-300 mb-1">Discount Type</label>
                            <Controller
                                control={control}
                                name="discountType"
                                render={({ field }) => (
                                    <select {...field} className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600">
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat ($)</option>
                                    </select>
                                )}
                            />
                        </div>

                        {/* Discount Value */}
                        <div className="mt-4">
                            <Input
                                label='Discount Value'
                                type='number'
                                min={1}
                                {...register('discountValue',{required:"Discount Value is required"})}
                            />
                            {errors.discountValue && (<p className="text-red-500 text-sm mt-1">{errors.discountValue.message}</p>
                        )}
                        </div>
                        {/* Discount Code */}
                        <div className="mt-4">
                            <Input
                                label='Discount Code'
                                {...register('discountCode',{required:"Discount Code is required"})}
                            />
                            {errors.discountCode && (<p className="text-red-500 text-sm mt-1">{errors.discountCode.message}</p>
                            )}
                        </div>
                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={createDiscountCodeMutation.isPending}
                            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                            <PlusCircle size={20}/>
                            {createDiscountCodeMutation.isPending ? 'Creating...' : 'Create Discount Code'}
                        </button>
                        {createDiscountCodeMutation.isError && (
                            <p className="text-red-500 text-sm mt-2">
                                {(createDiscountCodeMutation.error as AxiosError<{message:string}>)?.response?.data?.message || 'An error occurred. Please try again.'}
                            </p>
                        )}
                    </form>
                    
                </div>
            </div>
        )}
        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedDiscount && (
            <DeleteDiscountCodeModal
                discount={selectedDiscount}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={() => deleteDiscountCodeMutation.mutate(selectedDiscount.id)}
            />
        )}
    </div>
  )
}

export default Page