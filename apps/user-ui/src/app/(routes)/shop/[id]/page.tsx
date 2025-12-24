"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
    MapPin,
    Clock,
    Globe,
    Store,
    Facebook,
    Instagram,
    Twitter,
    Youtube,
    Link as LinkIcon,
    Mail,
} from "lucide-react";
import ProductCard from "apps/user-ui/src/shared/components/cards/product-card";
import PageLoader from "apps/user-ui/src/shared/components/loading/page-loader";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";

const ShopDetails = () => {
    const params = useParams();
    const id = params?.id;
    const [activeTab, setActiveTab] = useState("products");

    const {
        data: shop,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["shop-details", id],
        queryFn: async () => {
            const res = await axiosInstance.get(`/seller/api/get-shop-details/${id}`);
            return res.data.shop;
        },
        enabled: !!id,
    });

    const getAvatar = () =>
        shop?.images?.find((img: any) => img.type === "avatar");
    const getCover = () => shop?.images?.find((img: any) => img.type === "cover");

    const getSocialIcon = (platform: string) => {
        switch (platform?.toLowerCase()) {
            case "facebook":
                return <Facebook size={20} />;
            case "instagram":
                return <Instagram size={20} />;
            case "twitter":
                return <Twitter size={20} />;
            case "youtube":
                return <Youtube size={20} />;
            default:
                return <LinkIcon size={20} />;
        }
    };

    if (isLoading) return <PageLoader />;

    if (error || !shop) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Shop not found</h2>
                    <p className="text-gray-600">
                        The shop you are looking for does not exist.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-gray-800 font-sans pb-20">
            {/* Cover Image Section */}
            <div className="relative h-[250px] w-full overflow-hidden">
                {getCover() ? (
                    <>
                        <img
                            src={getCover().file_url}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-600">
                        <Store className="text-white/50 w-20 h-20" />
                    </div>
                )}
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section with Avatar and Info */}
                <div className="relative mb-8 flex flex-col md:flex-row items-start gap-6">
                    {/* Avatar */}
                    <div className="relative -mt-16 shrink-0 z-10">
                        <div className="w-40 h-40 rounded-full border-4 border-white bg-white overflow-hidden shadow-2xl">
                            {getAvatar() ? (
                                <img
                                    src={getAvatar().file_url}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-purple-400 bg-gray-100">
                                    <Store size={48} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Shop Info */}
                    <div className="flex-1 w-full pt-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 drop-shadow-sm">
                                    {shop.name}
                                </h1>
                                {shop.bio && (
                                    <p className="text-gray-700 text-lg max-w-2xl">{shop.bio}</p>
                                )}

                                {/* Address & Opening Hours */}
                                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                                    {shop.address && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm">
                                            <MapPin size={16} className="text-purple-600" />
                                            <span>{shop.address}</span>
                                        </div>
                                    )}
                                    {shop.opening_hours && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm">
                                            <Clock size={16} className="text-purple-600" />
                                            <span>{shop.opening_hours}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                {/* Website & Socials */}
                                <div className="flex flex-col gap-3 mt-3">
                                    {shop.website && (
                                        <a
                                            href={shop.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline w-fit"
                                        >
                                            <Globe size={16} />
                                            {shop.website}
                                        </a>
                                    )}

                                    {/* Social Media Icons */}
                                    {shop.socialLinks && shop.socialLinks.length > 0 && (
                                        <div className="flex items-center gap-3">
                                            {shop.socialLinks.map((link: any, idx: number) => (
                                                <a
                                                    key={idx}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-white text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full shadow-sm transition-all hover:scale-110"
                                                    title={link.platform}
                                                >
                                                    {getSocialIcon(link.platform)}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="border-b border-gray-200 mb-8 sticky top-0 bg-white/80 backdrop-blur-md z-10 rounded-t-xl">
                    <div className="flex gap-8 px-4">
                        <button
                            onClick={() => setActiveTab("products")}
                            className={`py-4 font-medium text-sm border-b-2 transition-colors ${activeTab === "products"
                                    ? "border-purple-600 text-purple-600"
                                    : "border-transparent text-gray-500 hover:text-purple-500"
                                }`}
                        >
                            Products
                        </button>
                        <button
                            onClick={() => setActiveTab("about")}
                            className={`py-4 font-medium text-sm border-b-2 transition-colors ${activeTab === "about"
                                    ? "border-purple-600 text-purple-600"
                                    : "border-transparent text-gray-500 hover:text-purple-500"
                                }`}
                        >
                            About
                        </button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === "products" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12">
                        {shop.products && shop.products.length > 0 ? (
                            shop.products.map((product: any) => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No products found in this shop.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "about" && (
                    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold mb-4 text-gray-900">
                            About Shop
                        </h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {shop.description || shop.bio || "No description available."}
                        </p>

                        <div className="mt-8 pt-8 border-t border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-4">
                                Contact Information
                            </h4>
                            <div className="space-y-3">
                                {shop.address && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <MapPin size={18} className="text-purple-500" />
                                        <span>{shop.address}</span>
                                    </div>
                                )}
                                {shop.opening_hours && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Clock size={18} className="text-purple-500" />
                                        <span>{shop.opening_hours}</span>
                                    </div>
                                )}
                                {shop.email && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Mail size={18} className="text-purple-500" />
                                        <a
                                            href={`mailto:${shop.email}`}
                                            className="hover:text-purple-600"
                                        >
                                            {shop.email}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopDetails;
