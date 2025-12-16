"use client";
import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";
import BreadCrumbs from "apps/seller-ui/src/shared/components/breadcrums";
import Input from "packages/components/input";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
import PageLoader from "apps/seller-ui/src/shared/components/loading/page-loader";

const Page = () => {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: products = [], isLoading } = useQuery({
        queryKey: ["shop-products"],
        queryFn: async () => {
            const res = await axiosInstance.get("/product/api/get-shop-products");
            return res?.data?.products || [];
        },
    });

    const filteredProducts = products.filter(
        (p: any) =>
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !p.starting_date &&
            !p.ending_date
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await axiosInstance.post("/product/api/create-events", {
                productId: data.productId,
                starting_date: data.starting_date,
                ending_date: data.ending_date,
                sale_price: data.sale_price,
            });
            toast.success("Event created successfully");
            router.push("/dashboard/all-events");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to create event");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full mx-auto p-8 shadow-md rounded-lg text-white">
            {isSubmitting && <PageLoader />}
            <BreadCrumbs title="Create Event" />
            <div className="py-4 w-full max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Product Selection */}
                    <div className="relative" ref={dropdownRef}>
                        <label className="block font-semibold text-gray-300 mb-1">
                            Select Product *
                        </label>
                        <input
                            type="hidden"
                            {...register("productId", {
                                required: "Please select a product",
                            })}
                        />

                        <div
                            className={`w-full px-4 py-2 bg-[#1e1e1e] border ${errors.productId ? "border-red-500" : "border-gray-600"
                                } rounded-lg flex items-center justify-between cursor-pointer hover:border-gray-500 transition-colors`}
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {selectedProduct ? (
                                <div className="flex items-center gap-3">
                                    {selectedProduct.images?.[0]?.file_url && (
                                        <img
                                            src={selectedProduct.images[0].file_url}
                                            alt={selectedProduct.title}
                                            className="w-10 h-10 rounded object-cover"
                                        />
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            {selectedProduct.title}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Current Price: ${selectedProduct.sale_price}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-gray-400">
                                    Select a product to promote
                                </span>
                            )}
                            <ChevronDown
                                size={20}
                                className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""
                                    }`}
                            />
                        </div>

                        {isOpen && (
                            <div className="absolute z-20 w-full mt-2 bg-[#1e1e1e] border border-gray-600 rounded-lg shadow-xl max-h-[300px] overflow-hidden flex flex-col">
                                <div className="p-2 border-b border-gray-700 sticky top-0 bg-[#1e1e1e]">
                                    <div className="flex items-center bg-gray-800 rounded-md px-3 py-1.5">
                                        <Search size={16} className="text-gray-400 mr-2" />
                                        <input
                                            type="text"
                                            placeholder="Search by name..."
                                            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-500"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="overflow-y-auto flex-1">
                                    {isLoading ? (
                                        <div className="p-4 text-center text-gray-400 text-sm">
                                            Loading products...
                                        </div>
                                    ) : filteredProducts.length > 0 ? (
                                        filteredProducts.map((product: any) => (
                                            <div
                                                key={product.id}
                                                className={`flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-800 last:border-0 ${selectedProduct?.id === product.id
                                                        ? "bg-gray-800"
                                                        : ""
                                                    }`}
                                                onClick={() => {
                                                    setSelectedProduct(product);
                                                    setValue("productId", product.id, {
                                                        shouldValidate: true,
                                                    });
                                                    setIsOpen(false);
                                                    setSearchTerm("");
                                                }}
                                            >
                                                <div className="w-10 h-10 rounded bg-gray-700 flex-shrink-0 overflow-hidden">
                                                    {product.images?.[0]?.file_url ? (
                                                        <img
                                                            src={product.images[0].file_url}
                                                            alt={product.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                                                            No Img
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {product.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                                        <span>${product.sale_price}</span>
                                                        <span>•</span>
                                                        <span>Stock: {product.stock}</span>
                                                    </div>
                                                </div>
                                                {selectedProduct?.id === product.id && (
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-400 text-sm">
                                            No products found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {errors.productId && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.productId.message as string}
                            </p>
                        )}
                    </div>

                    {/* Sale Price */}
                    <div>
                        <Input
                            label="Event Sale Price *"
                            type="number"
                            placeholder="Enter discounted price"
                            {...register("sale_price", {
                                required: "Sale price is required",
                                min: { value: 1, message: "Price must be positive" },
                            })}
                        />
                        {errors.sale_price && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.sale_price.message as string}
                            </p>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-gray-300 mb-1">
                                Starting Date *
                            </label>
                            <input
                                type="datetime-local"
                                {...register("starting_date", {
                                    required: "Start date is required",
                                })}
                                className="w-full px-4 py-2 bg-[#1e1e1e] border border-gray-600 rounded-lg text-gray-200"
                            />
                            {errors.starting_date && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.starting_date.message as string}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block font-semibold text-gray-300 mb-1">
                                Ending Date *
                            </label>
                            <input
                                type="datetime-local"
                                {...register("ending_date", {
                                    required: "End date is required",
                                })}
                                className="w-full px-4 py-2 bg-[#1e1e1e] border border-gray-600 rounded-lg text-gray-200"
                            />
                            {errors.ending_date && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.ending_date.message as string}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                    >
                        Create Event
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Page;
