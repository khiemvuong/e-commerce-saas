"use client";
import React, { useEffect, useState, useRef } from "react";
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
    UserPlus,
    UserCheck,
    Package,
    Sparkles,
} from "lucide-react";
import ProductCard from "apps/user-ui/src/shared/components/cards/product-card";
import useUser from "apps/user-ui/src/hooks/useUser";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { Loader2 } from "lucide-react";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";
import { sendKafkaEvent } from "apps/user-ui/src/actions/track-user";

const ShopDetails = ({ shop }: { shop: any }) => {
    const { user, isLoading: isLoadingUser } = useUser();
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [isLoadingFollow, setIsLoadingFollow] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocationTracking();
    const deviceInfo = useDeviceTracking();
    const hasTrackedView = useRef(false);

    useEffect(() => {
        if (shop?.id && location && deviceInfo && !isLoadingUser && !hasTrackedView.current) {
            sendKafkaEvent({
                userId: user?.id,
                shopId: shop.id,
                action: "shop_view",
                device: deviceInfo || "Unknown Device",
                country: location.country || undefined,
                city: location.city || undefined,
            });
            hasTrackedView.current = true;
        }
    }, [shop?.id, location, deviceInfo, user?.id, isLoadingUser]);

    useEffect(() => {
        if (shop) {
            setFollowerCount(shop.followers?.length || 0);
            setIsLoading(false);
        }
    }, [shop]);

    useEffect(() => {
        if (user && shop && shop.followers) {
            setIsFollowing(shop.followers.includes(user.id));
        }
    }, [user, shop]);

    const handleFollow = async () => {
        if (!user) {
            alert("Please login to follow this shop");
            return;
        }
        if (isLoadingFollow) return;

        const prevIsFollowing = isFollowing;
        const prevCount = followerCount;

        // Optimistic update
        setIsFollowing(!prevIsFollowing);
        setFollowerCount((prev) => (!prevIsFollowing ? prev + 1 : prev - 1));
        setIsLoadingFollow(true);

        try {
            await axiosInstance.put("/seller/api/follow-shop", {
                shopId: shop.id,
            });
        } catch (error) {
            // Revert on error
            setIsFollowing(prevIsFollowing);
            setFollowerCount(prevCount);
            console.error("Failed to follow shop:", error);
        } finally {
            setIsLoadingFollow(false);
        }
    };

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

    if (!shop) {
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
                                <div className="flex items-center gap-4">
                                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 drop-shadow-sm">
                                        {shop.name}
                                    </h1>
                                    <button
                                        onClick={handleFollow}
                                        disabled={isLoadingFollow}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${
                                            isFollowing
                                                ? "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300"
                                                : "bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md"
                                        }`}
                                    >
                                        {isFollowing ? (
                                            <>
                                                <UserCheck size={18} />
                                                Following
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={18} />
                                                Follow
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-gray-600">
                                    <span className="font-semibold text-gray-900">
                                        {followerCount}
                                    </span>
                                    <span>Followers</span>
                                </div>
                                {shop.bio && (
                                    <p className="text-gray-700 text-lg max-w-2xl mt-2">
                                        {shop.bio}
                                    </p>
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

                {/* Events Section */}
                {shop.events && shop.events.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                                <Sparkles className="text-white" size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Events
                            </h2>
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                                {shop.events.length} events
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {shop.events.map((event: any) => (
                                <div key={event.id} className="relative">
                                    {/* Event Date Badge */}
                                    {event.starting_date && event.ending_date && (
                                        <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                            {new Date(event.starting_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - {new Date(event.ending_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                        </div>
                                    )}
                                    <ProductCard product={event} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Products Section */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <Package className="text-white" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Products
                        </h2>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                            {shop.products?.length || 0} products
                        </span>
                    </div>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-purple-600" size={40} />
                        </div>
                    ) : shop.products && shop.products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {shop.products.map((product: any) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 bg-white/50 rounded-2xl">
                            <Package className="mx-auto mb-4 text-gray-400" size={48} />
                            <p>No products found in this shop.</p>
                        </div>
                    )}
                </section>

                {/* About Section */}
                <section className="mb-12">
                    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold mb-4 text-gray-900">
                            About shop
                        </h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {shop.description || shop.bio || "No description available."}
                        </p>

                        <div className="mt-8 pt-8 border-t border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-4">
                                Contact information
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
                </section>
            </div>
        </div>
    );
};

export default ShopDetails;
