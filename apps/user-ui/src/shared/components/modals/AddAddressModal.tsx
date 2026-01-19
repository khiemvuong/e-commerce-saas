"use client";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import { useSiteConfig } from 'apps/user-ui/src/hooks/useSiteConfig';
import { X } from 'lucide-react';
import React from 'react'
import { useForm } from 'react-hook-form';

const formInput = "w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

interface AddAddressModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddAddressModal = ({ isOpen, onClose }: AddAddressModalProps) => {
    const { data: siteConfig } = useSiteConfig();
    const countries = siteConfig?.countries || [];
    const queryClient = useQueryClient();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            label: "Home",
            name: "",
            street: '',
            city: '',
            zip: "",
            country: "Viet Nam",
            isDefault: false,
        },
    });

    const handleCloseModal = () => {
        onClose();
        reset();
    };

    const { mutate: addAddress, isPending: isAddingAddress } = useMutation({
        mutationFn: async (payload: any) => {
            const res = await axiosInstance.post('/api/add-address', payload);
            return res.data.address;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
            handleCloseModal();
        }
    });

    const onSubmit = async (data: any) => {
        addAddress({
            ...data,
            isDefault: data.isDefault === "Set as Default" ? true : false,
        });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleCloseModal}
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/*Close Button*/}
                <button
                    onClick={handleCloseModal}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={24} />
                </button>

                <h3 className="text-xl font-semibold mb-6 text-gray-800">Add New Address</h3>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Label */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address Label
                        </label>
                        <select
                            {...register("label")}
                            className={`${formInput}`}
                        >
                            <option value="Home">Home</option>
                            <option value="Work">Work</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Recipient Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter recipient name"
                            {...register("name", {
                                required: "Recipient name is required",
                                minLength: {
                                    value: 2,
                                    message: "Name must be at least 2 characters"
                                }
                            })}
                            className={`${formInput}`}
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                    </div>

                    {/* Street */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter street address"
                            {...register("street", { required: "Street address is required" })}
                            className={`${formInput}`}
                        />
                        {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street.message}</p>}
                    </div>

                    {/* City & ZIP in grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* City */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                City <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="City"
                                {...register("city", { required: "City is required" })}
                                className={`${formInput}`}
                            />
                            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
                        </div>

                        {/* ZIP */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ZIP Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="ZIP"
                                {...register("zip", {
                                    required: "ZIP code is required",
                                    pattern: {
                                        value: /^[0-9]{5,10}$/,
                                        message: "Invalid ZIP code"
                                    }
                                })}
                                className={`${formInput}`}
                            />
                            {errors.zip && <p className="text-red-500 text-sm mt-1">{errors.zip.message}</p>}
                        </div>
                    </div>

                    {/* Country */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...register("country", { required: "Country is required" })}
                            className={`${formInput}`}
                        >
                            {countries.map((country) => (
                                <option key={country.code} value={country.name}>{country.name}
                                </option>
                            ))}
                        </select>
                        {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>}
                        <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">Default Address</label>
                        <select {...register("isDefault")} className={`${formInput}`}>
                            <option>Set as Default</option>
                            <option>Not Default</option>
                        </select>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            disabled={isAddingAddress}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isAddingAddress}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAddingAddress ? 'Saving...' : 'Save Address'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAddressModal;
