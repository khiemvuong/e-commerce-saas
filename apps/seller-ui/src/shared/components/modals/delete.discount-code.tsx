
import React from 'react'
import { X } from 'lucide-react';
const DeleteDiscountCodeModal = ({discount, onClose, onConfirm}:{discount:any;onClose:()=>void;onConfirm?:any}) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-96 text-gray-300 text-sm">
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                    <h2 className="text-xl font-semibold">Delete Discount Code</h2>
                    <button onClick={onClose} className="text-gray-300 hover:text-white">
                    <X />
                </button>
                </div>
                <span>Are you sure you want to delete <strong>{discount.public_name} </strong>?
                </span>
                <p>This action **cannot be undone**.</p>
                <div className="mt-6 flex justify-end space-x-4"> 
                {/* Action Button */}
                <div className="flex justify-end space-x-4">
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" onClick={onConfirm}>
                        Delete
                    </button>
                </div>
                </div>
            </div>
        </div>
    )
}

export default DeleteDiscountCodeModal