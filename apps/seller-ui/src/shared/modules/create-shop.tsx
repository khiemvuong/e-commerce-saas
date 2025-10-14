import React from 'react'
import {useForm} from "react-hook-form"
import  {useMutation} from "@tanstack/react-query"
import axios from 'axios';
import { shopCategories } from '../../utils/categories';
const CreateShop = ({
    sellerId,
    setActiveStep
}:{
    sellerId: string;
    setActiveStep: (step: number) => void;
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const shopCreateMutation = useMutation({
        mutationFn: async (data: FormData) => {
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_SERVER_URL}/api/create-shop`,
            data
        );
        return response.data;
        },
        onSuccess: (data) => {
            console.log("Shop created successfully:", data);
            setActiveStep(3); // Move to the next step
        }
    });

    const OnSubmit = (data: any) => {
        const shopData = {...data, sellerId};

        shopCreateMutation.mutate(shopData);
    };

    const countWords = (text: string) =>  text.trim().split(/\s+/).length;

    ;

    return (<div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">Create Your Shop</h2>
        <form onSubmit={handleSubmit(OnSubmit)}>
            <input type="hidden" value={sellerId} {...register("sellerId")} />
            <div className="mb-4">
                <label className="block text-gray-700 mb-1" htmlFor="name">Shop Name *</label>
                <input
                    type="text"
                    placeholder='Shop name'
                    {...register("name", { required: "Shop name is required" })}
                    className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-[4px] outline-0 mb-1 `}
                />
                {errors.name &&
                <p className="text-red-500 text-sm mt-1">{String(errors.name.message)}
                </p>}
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="bio">Shop Bio (Max 100 words) *</label>
                <input
                    type="text"
                    placeholder="Enter shop bio"
                    {...register("bio", {
                        required: "Shop bio is required",
                        validate: (value) => countWords(value) <= 100 || "Bio must not exceed 100 words"
                    })}
                    className={`w-full p-2 border ${errors.bio ? 'border-red-500' : 'border-gray-300'} rounded-[4px] outline-0 mb-1`}
                ></input>
                {errors.bio && <p className="text-red-500 text-sm mt-1">{String(errors.bio.message)}</p>}
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="address">Address *</label>
                <input
                    type="text"
                    placeholder='Enter your address'
                    {...register("address", { required: "Address is required" })}
                    className={`w-full p-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-[4px] outline-0 mb-1`}
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{String(errors.address.message)}</p>}
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="opening_hours">Opening Hours *</label>
                <input
                    type="text"
                    placeholder='e.g., Mon-Fri 9AM-6PM'
                    {...register("opening_hours", { required: "Opening hours are required" })}
                    className={`w-full p-2 border ${errors.opening_hours ? 'border-red-500' : 'border-gray-300'} rounded-[4px] outline-0 mb-1`}
                />
                {errors.opening_hours && <p className="text-red-500 text-sm mt-1">{String(errors.opening_hours.message)}</p>}
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="website">Website</label>
                <input
                    type="text"
                    placeholder='https://example.com'
                    {...register("website", { pattern: {
                        value: /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-]*)*\/?$/,
                        message: "Invalid URL format"
                    }})}
                    className={`w-full p-2 border ${errors.website ? 'border-red-500' : 'border-gray-300'} rounded-[4px] outline-0 mb-1`}
                />
                {errors.website && <p className="text-red-500 text-sm mt-1">{String(errors.website.message)}</p>}
            </div>
            {/* Category field */}
            <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="category">Category *</label>
                <select
                    {...register("category", { required: "Category is required" })}
                    className={`w-full p-2 border ${errors.category ? 'border-red-500' : 'border-gray-300'} rounded-[4px] outline-0 mb-1`}
                >
                    <option value="">Select a category</option>
                    {shopCategories.map((category) => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{String(errors.category.message)}</p>}
                <button
                    type="submit"
                    className="w-full bg-black text-white p-2 rounded-[4px] hover:bg-gray-700 transition-colors mt-4"
                    disabled={shopCreateMutation.isPending}
                >
                    {shopCreateMutation.isPending ? 'Creating Shop...' : 'Create Shop'}
                </button>

            </div>
        </form>
    </div>
)}

export default CreateShop