'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import Input from 'packages/components/input';
import { useQueryClient } from '@tanstack/react-query';
import PageLoader from '../loading/page-loader';

interface EditEventModalProps {
    event: any;
    onClose: () => void;
}

const EditEventModal = ({ event, onClose }: EditEventModalProps) => {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    
    // Helper to format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    };

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            sale_price: event?.sale_price || 0,
            starting_date: formatDate(event?.starting_date),
            ending_date: formatDate(event?.ending_date),
        }
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            await axiosInstance.put(`/product/api/edit-event/${event.id}`, {
                ...data,
                sale_price: parseFloat(data.sale_price)
            });
            toast.success('Event updated successfully');
            queryClient.invalidateQueries({ queryKey: ['shop-events'] });
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to update event');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            {isLoading && <PageLoader />}
            <div className="bg-gray-900 w-full max-w-md rounded-lg shadow-xl relative p-6">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X size={24} />
                </button>
                <h2 className="text-xl font-bold text-white mb-6">Edit Event</h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Input
                            label="Sale Price"
                            type="number"
                            {...register('sale_price', { required: "Sale price is required", min: 1 })}
                        />
                        {errors.sale_price && <p className="text-red-500 text-sm mt-1">{errors.sale_price.message as string}</p>}
                    </div>

                    <div>
                        <label className="block font-semibold text-gray-300 mb-1">Starting Date</label>
                        <input
                            type="datetime-local"
                            {...register('starting_date', { required: "Start date is required" })}
                            className="w-full px-4 py-2 bg-[#1e1e1e] border border-gray-600 rounded-lg text-gray-200"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-gray-300 mb-1">Ending Date</label>
                        <input
                            type="datetime-local"
                            {...register('ending_date', { required: "End date is required" })}
                            className="w-full px-4 py-2 bg-[#1e1e1e] border border-gray-600 rounded-lg text-gray-200"
                        />
                    </div>

                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 mt-4">Update Event</button>
                </form>
            </div>
        </div>
    );
};

export default EditEventModal;