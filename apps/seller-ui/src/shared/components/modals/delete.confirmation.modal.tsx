import React from 'react'
import {X} from 'lucide-react';
const DeleteConfirmationModal = ({product,onClose,onConfirm,onRestore}:any) => {
  return (
    <div className='fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center'>
        <div className='bg-gray-800 p-6 rounded-lg md:w-[450px] shadow-lg'>
            {/* Modal Header */}
            <div className='flex justify-between items-center border-b border-gray-700 mb-3'>
                <h3 className='text-xl text-white '>
                    Delete Product
                </h3>
                <button className='text-gray-400 hover:text-white' onClick={onClose}>
                    <X size={22}/>
                </button>
            </div>
            {/* Modal Body */}
            <p className='text-gray-300 mt-4'>
                Are you sure you want to delete {" "}
                <span className='font-semibold text-white'>{product?.title}</span>?
                <br/>
                This product will be moved to the **deleted state** and permanently removed after **24 hours**. You can restore it within in this time.
            </p>
            {/* Modal Actions */}
            <div className='flex justify-end gap-3 mt-6'>
                <button onClick={onClose}
                    className='bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition'>
                    Cancel
                </button>
                <button onClick={!product?.isDeleted ?onConfirm: onRestore}
                    className={`${
                        !product?.isDeleted
                        ?"bg-red-600 hover:bg-red-700"
                        :"bg-green-600 hover:bg-green-700"
                    } text-white px-4 py-2 rounded-md transition font-semibold`}
                    >
                    {product?.isDeleted ? "Restore":"Delete"}

                </button>
            </div>
        </div>
    </div>
  )
}

export default DeleteConfirmationModal