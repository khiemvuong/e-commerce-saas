"use client";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import { Loader2, MapPin, Plus, Trash } from 'lucide-react';
import React, { useState } from 'react'
import AddAddressModal from '../modals/AddAddressModal';

const ShippingAdressSection = () => {
    const [showModal, setShowModal] = useState(false);
    const queryClient = useQueryClient();

    //Get Addresses
    const {data: addresses,isLoading} = useQuery({
        queryKey: ['shipping-addresses'],
        queryFn: async () => {
            const res = await axiosInstance.get('/api/shipping-addresses');
            return res.data.addresses;
        }
    });

    const {mutate: deleteAddress, isPending: isDeletingAddress} = useMutation({
        mutationFn: async (id:string) => {
            await axiosInstance.delete(`/api/delete-address/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['shipping-addresses']});
        }

    });

    
  return (
    <div className=" relative">
        {/* Full screen loading overlay */}
        {(isLoading || isDeletingAddress) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
                    <Loader2 size={48} className="animate-spin text-blue-600"/>
                    <p className="text-gray-700 font-medium">
                        {isDeletingAddress ? 'Deleting address...' : 'Loading addresses...'}
                    </p>
                </div>
            </div>
        )}

        {/*Headers*/}
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Saved Address</h2>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 text-blue-600 px-4 py-2 hover:underline transition-colors"
            >
                <Plus size={16}/> Add New Address
            </button>
        </div>
        {/*Address List*/}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses && addresses.length > 0 ? (
                addresses.map((address: any) => (
                    <div key={address.id} className=" border border-gray-300 rounded-md p-2 relative">
                        {address.isDefault && (
                            <span className="absolute top-2 right-2 bg-blue-200 text-blue-700 text-xs px-2 py-1 font-semibold rounded-full">
                                Default
                            </span>
                        )}
                        <div className="flex items-center">
                            <MapPin size={20} className="text-gray-600 mr-2"/>
                            <div className="flex items-start flex-col">
                                <p className="text-md font-semibold text-gray-800      ">{address.label} - {address.name}</p>
                                <p className="text-sm text-gray-600">{address.street}, {address.city}, {address.zip}, {address.country}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => deleteAddress(address.id)}
                                className="flex items-center gap-1 cursor-pointer text-red-600 text-sm hover:underline"
                            >
                                <Trash size={16}/> Delete
                            </button>
                        </div>
                        
                    </div>
                ))
            ) : (
                !isLoading && <p>No addresses found.</p>
            )}
        </div>

        {/* Add Address Modal */}
        <AddAddressModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}

export default ShippingAdressSection