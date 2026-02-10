'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, RotateCcw, Heart, MapPin, WalletMinimal, MessageSquareText, ShieldCheck, Truck, ArrowRight, Star, Share2 } from 'lucide-react';
import Link from 'next/link';
import Rating from '../../components/ratings';
import { useStore } from 'apps/user-ui/src/store';
import useUser from 'apps/user-ui/src/hooks/useUser';
import useLocationTracking from 'apps/user-ui/src/hooks/useLocationTracking';
import useDeviceTracking from 'apps/user-ui/src/hooks/useDeviceTracking';
import AddToCartButton from '../../components/buttons/add-to-cart-button';
import Image from 'next/image';
import ProductCard from '../../components/cards/product-card';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import { useRouter } from 'next/navigation';
import { sendKafkaEvent } from 'apps/user-ui/src/actions/track-user';
import { optimizeImageUrl, IMAGE_PRESETS } from 'apps/user-ui/src/utils/imageOptimizer';
import toast from 'react-hot-toast';
import { getProductPrices } from 'apps/user-ui/src/utils/productPriceUtils';

// Skeleton component for product cards
const ProductCardSkeleton = () => (
    <div className="animate-pulse">
        <div className="bg-gray-100 aspect-[3/4] rounded-xl mb-4"></div>
        <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            <div className="h-4 bg-gray-100 rounded w-1/4"></div>
        </div>
    </div>
);

const ProductDetails = ({productDetails}:{productDetails: any}) => {
    const router = useRouter();
    const [currentImage, setCurrentImage] = useState(0);
    const [isSelected, setIsSelect] = useState(Array.isArray(productDetails?.colors) && productDetails.colors.length > 0 ? productDetails.colors[0] : '');
    const [isSizeSelected, setIsSizeSelect] = useState(Array.isArray(productDetails?.sizes) && productDetails.sizes.length > 0 ? productDetails.sizes[0] : '');  
    const [quantity, setQuantity] = useState(1);
    const [selectedProperties, setSelectedProperties] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
    const [isChatLoading, setIsChatLoading] = useState(false);
    
    const wishlist = useStore((state:any) => state.wishlist);
    const addToWishlist = useStore((state:any) => state.addToWishlist);
    const removeFromWishlist = useStore((state:any) => state.removeFromWishlist);
    const isWishlisted = wishlist.some((item:any) => item.id === productDetails.id);
    const {user, isLoading: isLoadingUser} = useUser();
    const location = useLocationTracking();
    const deviceInfo = useDeviceTracking();
    
    // Lazy loading states for recommendations
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);
    const [hasLoadedRecommendations, setHasLoadedRecommendations] = useState(false);
    const recommendationsRef = useRef<HTMLDivElement>(null);
    const hasTrackedView = useRef(false);

    // Get normalized prices using helper
    const productPrices = getProductPrices(productDetails);
    const discountPercentage = productPrices.discountPercent;
    
    const fetchRecommendedProducts = useCallback(async () => {
        if (hasLoadedRecommendations || isRecommendationsLoading) return;
        
        setIsRecommendationsLoading(true);
        try {   
            const query = new URLSearchParams();
            
            // Tính price range linh hoạt dựa trên giá sản phẩm
            const basePrice = productPrices.displayPrice || 100;
            const minPrice = Math.max(0, basePrice - 200);
            const maxPrice = basePrice + 200;
            
            query.set("priceRange", `${minPrice},${maxPrice}`);
            
            // Filter theo category nếu có
            if (productDetails?.category) {
                query.set("categories", productDetails.category);
            }
            
            query.set("page", "1");
            query.set("limit", "8");
            
            
            const res = await axiosInstance.get(
                `/product/api/get-filtered-products?${query.toString()}`
            );
                        
            // Loại bỏ sản phẩm hiện tại khỏi danh sách recommended
            const filtered = (res.data.products || []).filter((p: any) => p.id !== productDetails?.id);
            
            setRecommendedProducts(filtered);
            setHasLoadedRecommendations(true);
        } catch (error) {
            console.error("❌ Error fetching recommended products:", error);
        } finally {
            setIsRecommendationsLoading(false);
        }
    }, [productDetails?.id, productDetails?.sale_price, productDetails?.regular_price, productDetails?.category, hasLoadedRecommendations, isRecommendationsLoading]);

    // Intersection Observer for lazy loading recommendations
    useEffect(() => {
        if (!productDetails?.id) return;
        
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasLoadedRecommendations) {
                    fetchRecommendedProducts();
                }
            },
            { threshold: 0.1, rootMargin: '200px' } // Start loading 200px before visible
        );
        
        if (recommendationsRef.current) {
            observer.observe(recommendationsRef.current);
        }
        
        return () => observer.disconnect();
    }, [productDetails?.id, hasLoadedRecommendations, fetchRecommendedProducts]);

    useEffect(() => {
        if (productDetails?.custom_properties && Array.isArray(productDetails.custom_properties)) {
            const defaults: Record<string, string> = {};
            productDetails.custom_properties.forEach((prop: any) => {
                if (prop.value && prop.value.length > 0) {
                    defaults[prop.label] = prop.value[0];
                }
            });
            setSelectedProperties(defaults);
        }
    }, [productDetails]);

    useEffect(() => {
        if (productDetails?.id && location && deviceInfo && !isLoadingUser && !hasTrackedView.current) {
            sendKafkaEvent({
                userId: user?.id,
                productId: productDetails.id,
                shopId: productDetails.Shop?.id,
                action: "product_view",
                device: deviceInfo || "Unknown Device",
                country: location.country || undefined,
                city: location.city || undefined,
            });
            hasTrackedView.current = true;
        }
    }, [productDetails?.id, location, deviceInfo, user?.id, isLoadingUser]);

    const handleChat = async () => {
        // Kiểm tra đăng nhập
        if (!user) {
            toast.error('Vui lòng đăng nhập để chat với người bán', {
                duration: 4000,
            });
            
            // Hỏi người dùng có muốn chuyển đến trang đăng nhập không
            setTimeout(() => {
                const shouldRedirect = window.confirm('Bạn có muốn chuyển đến trang đăng nhập không?');
                if (shouldRedirect) {
                    router.push('/login');
                }
            }, 500);
            return;
        }

        if (isChatLoading) return;
        setIsChatLoading(true);
        try {
            const res = await axiosInstance.post('/chatting/api/create-user-conversationGroup', {
                sellerId: productDetails?.Shop?.sellerId,
            });
            router.push(`/inbox?conversationId=${res.data.conversation.id}`);
        } catch (error) {
            console.error('Error starting chat with seller:', error);
            toast.error('Không thể bắt đầu chat. Vui lòng thử lại sau.');
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
    <div className="w-full bg-white min-h-screen font-sans">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/" className="hover:text-black transition-colors">Home</Link>
                <span>/</span>
                <Link href="/products" className="hover:text-black transition-colors">Products</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium truncate max-w-[200px]">{productDetails?.title || 'Product'}</span>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
                
                {/* Left Section: Gallery */}
                <div className="space-y-6">
                    {/* Main Image */}
                    <div className="w-full aspect-[4/4] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 relative group">
                        <TransformWrapper
                            initialScale={1}
                            minScale={0.5}
                            maxScale={3}
                            wheel={{ step: 0.1 }}
                            doubleClick={{ mode: 'zoomIn' }}
                        >
                            {({ zoomIn, zoomOut, resetTransform }) => (
                                <>
                                    {/* Zoom Controls */}
                                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button onClick={() => zoomIn()} className="bg-white/90 hover:bg-white p-2.5 rounded-full shadow-lg text-gray-700 hover:text-[#C9A86C] transition-colors"><ZoomIn size={20} /></button>
                                        <button onClick={() => zoomOut()} className="bg-white/90 hover:bg-white p-2.5 rounded-full shadow-lg text-gray-700 hover:text-[#C9A86C] transition-colors"><ZoomOut size={20} /></button>
                                        <button onClick={() => resetTransform()} className="bg-white/90 hover:bg-white p-2.5 rounded-full shadow-lg text-gray-700 hover:text-[#C9A86C] transition-colors"><RotateCcw size={20} /></button>
                                    </div>

                                    <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                                        <img
                                            src={optimizeImageUrl(productDetails?.images?.[currentImage]?.file_url, IMAGE_PRESETS.detailMain) || '/placeholder.jpg'}
                                            alt={productDetails?.title}
                                            className="max-w-full max-h-full object-contain cursor-zoom-in"
                                        />
                                    </TransformComponent>
                                </>
                            )}
                        </TransformWrapper>
                        
                        {/* Discount Badge */}
                        {discountPercentage > 0 && (
                            <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
                                -{discountPercentage}%
                            </div>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {productDetails?.images?.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {productDetails.images.map((img: any, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImage(index)}
                                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                        currentImage === index
                                            ? 'border-[#C9A86C] ring-2 ring-[#C9A86C]/20 shadow-sm'
                                            : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    <Image
                                        src={optimizeImageUrl(img.file_url, IMAGE_PRESETS.detailThumb)}
                                        alt={`Thumbnail ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Section: Product Info */}
                <div className="lg:sticky lg:top-24 h-fit space-y-8">
                    {/* Header */}
                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                             <div className="space-y-1">
                                {productDetails?.brand && (
                                    <Link href={`/products?search=${productDetails.brand}`} className="text-[#C9A86C] font-semibold text-sm tracking-wide hover:underline uppercase">
                                        {productDetails.brand}
                                    </Link>
                                )}
                                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                                    {productDetails?.title}
                                </h1>
                             </div>
                             <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        toast.success("Link copied to clipboard!");
                                    }}
                                    className="p-3 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
                                    title="Share Product"
                                >
                                    <Share2 size={24} />
                                </button>
                                <button 
                                    onClick={() => isWishlisted 
                                        ? removeFromWishlist(productDetails.id, user, location, deviceInfo) 
                                        : addToWishlist({...productDetails, quantity, selectedOptions:{...(isSelected && { color: isSelected }), ...(isSizeSelected && { size: isSizeSelected }), ...selectedProperties}}, user, location, deviceInfo)
                                    }
                                    className={`p-3 rounded-full transition-all ${
                                        isWishlisted ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                    }`}
                                >
                                    <Heart size={24} fill={isWishlisted ? "currentColor" : "none"} />
                                </button>
                             </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full">
                                <Rating size="sm" rating={productDetails?.rating || 0} />
                                <span className="text-sm font-medium text-gray-900 border-l border-gray-300 pl-2 ml-1">
                                    {productDetails?.rating?.toFixed(1) || '0.0'}
                                </span>
                            </div>
                            <span className="text-sm text-gray-500 dot-before flex items-center gap-1">
                                <MessageSquareText size={14} />
                                {productDetails?.reviewCount || 0} reviews
                            </span>
                            <span className="text-sm text-gray-500 border-l border-gray-300 pl-4">{productDetails?.totalSales || 0} sold</span>
                        </div>
                        
                        <div className="flex items-baseline gap-4 pt-2">
                            <span className="text-4xl font-bold text-[#C9A86C]">
                                ${productPrices.displayPrice.toLocaleString()}
                            </span>
                            {productPrices.hasDiscount && (
                                <span className="text-xl text-gray-400 line-through decoration-gray-400/50">
                                    ${productPrices.regularPrice.toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Description Short */}
                    <div 
                        className="text-gray-600 leading-relaxed text-sm lg:text-[15px] line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: productDetails?.short_description || '' }}
                    />

                    {/* Selectors */}
                    <div className="space-y-6">
                        {/* Colors */}
                        {productDetails?.colors && Array.isArray(productDetails.colors) && productDetails.colors.length > 0 && (
                            <div className="space-y-3">
                                <span className="text-sm font-medium text-gray-900 uppercase tracking-wide">Color: <span className="text-gray-500 font-normal normal-case ml-1">{isSelected}</span></span>
                                <div className="flex flex-wrap gap-3">
                                    {productDetails.colors.map((color: string) => (
                                        <button
                                            key={color}
                                            onClick={() => setIsSelect(color)}
                                            className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                                isSelected === color 
                                                    ? 'ring-2 ring-offset-2 ring-[#C9A86C]' 
                                                    : 'hover:ring-1 hover:ring-offset-1 hover:ring-gray-300'
                                            }`}
                                        >
                                            <span 
                                                className="w-full h-full rounded-full border border-black/10 shadow-inner" 
                                                style={{ backgroundColor: color }} 
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sizes */}
                        {productDetails?.sizes && Array.isArray(productDetails.sizes) && productDetails.sizes.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-900 uppercase tracking-wide">Size: <span className="text-gray-500 font-normal normal-case ml-1">{isSizeSelected}</span></span>
                                    <button className="text-xs text-[#C9A86C] underline hover:text-[#b08f55]">Size Guide</button>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {productDetails.sizes.map((size: string) => (
                                        <button
                                            key={size}
                                            onClick={() => setIsSizeSelect(size)}
                                            className={`min-w-[48px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                                isSizeSelected === size 
                                                    ? 'bg-black text-white shadow-md transform scale-105' 
                                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Custom Properties */}
                        {productDetails?.custom_properties && Array.isArray(productDetails.custom_properties) && productDetails.custom_properties.map((prop: any, idx: number) => (
                             <div key={idx} className="space-y-3">
                                <span className="text-sm font-medium text-gray-900 uppercase tracking-wide">{prop.label}</span>
                                <div className="flex flex-wrap gap-3">
                                    {prop.value.map((val: string, vIndex: number) => (
                                        <button
                                            key={vIndex}
                                            onClick={() => setSelectedProperties(prev => ({ ...prev, [prop.label]: val }))}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                selectedProperties[prop.label] === val
                                                    ? 'bg-black text-white shadow-md' 
                                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
                                            }`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <div className="flex items-center bg-gray-100 rounded-full p-1.5 w-fit">
                            <button className="w-10 h-10 rounded-full bg-white text-gray-600 hover:text-[#C9A86C] shadow-sm flex items-center justify-center transition" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                            <span className="w-12 text-center font-semibold text-gray-900">{quantity}</span>
                            <button className="w-10 h-10 rounded-full bg-white text-gray-600 hover:text-[#C9A86C] shadow-sm flex items-center justify-center transition" onClick={() => setQuantity(quantity + 1)}>+</button>
                        </div>
                        <div className="flex-1">
                             <AddToCartButton 
                                product={productDetails}
                                quantity={quantity}
                                selectedOptions={{
                                    ...(isSelected && { color: isSelected }),
                                    ...(isSizeSelected && { size: isSizeSelected }),
                                    ...selectedProperties
                                }}
                                variant="default"
                                className="!w-full !rounded-full !h-[52px] !text-base"
                            />
                        </div>
                    </div>
                    
                    {/* Delivery Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 justify-center sm:justify-start">
                        <MapPin size={16} />
                        <span>Deliver to <span className="font-medium text-gray-900">{location?.city || 'your location'}</span></span>
                    </div>

                    {/* Benefits */}
                    <div className="grid grid-cols-2 gap-4 pt-6">
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-white rounded-full shadow-sm text-[#C9A86C]"><Truck size={20} /></div>
                            <div>
                                <h4 className="font-semibold text-sm text-gray-900">Free Shipping</h4>
                                <p className="text-xs text-gray-500 mt-1">On orders over $200</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-white rounded-full shadow-sm text-[#C9A86C]"><ShieldCheck size={20} /></div>
                            <div>
                                <h4 className="font-semibold text-sm text-gray-900">Warranty</h4>
                                <p className="text-xs text-gray-500 mt-1">1 Year Protection</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-white rounded-full shadow-sm text-[#C9A86C]"><RotateCcw size={20} /></div>
                            <div>
                                <h4 className="font-semibold text-sm text-gray-900">Returns</h4>
                                <p className="text-xs text-gray-500 mt-1">30 Days Money Back</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-white rounded-full shadow-sm text-[#C9A86C]"><WalletMinimal size={20} /></div>
                            <div>
                                <h4 className="font-semibold text-sm text-gray-900">Payment</h4>
                                <p className="text-xs text-gray-500 mt-1">{productDetails?.cash_on_delivery === 'yes' ? 'COD Available' : 'Secure Online'}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Seller Card */}
                    {productDetails?.Shop && (
                        <div className="border border-gray-200 rounded-xl p-5 hover:border-[#C9A86C]/50 transition bg-white shadow-sm mt-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-400">
                                    {productDetails.Shop.name?.charAt(0) || 'S'}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">{productDetails.Shop.name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        <span className="flex items-center gap-1 text-[#C9A86C]"><Star size={12} fill="currentColor" /> 4.8</span>
                                        <span>•</span>
                                        <span>98% Positive</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                     <button 
                                        onClick={handleChat}
                                        disabled={isChatLoading}
                                        className="p-2 text-gray-600 hover:text-[#C9A86C] hover:bg-[#C9A86C]/10 rounded-full transition disabled:opacity-50"
                                        title="Chat with Seller"
                                    >
                                        <MessageSquareText size={20} />
                                     </button>
                                    <Link href={`/shop/${productDetails.Shop.id}`} className="px-4 py-2 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 transition">
                                        VISIT STORE
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Tabs */}
            <div className="mt-16 border-t border-gray-200 pt-10">
                <div className="flex items-center justify-center gap-8 mb-10 border-b border-gray-200 w-fit mx-auto">
                    <button 
                        onClick={() => setActiveTab('description')}
                        className={`pb-4 px-4 font-semibold text-lg transition-all relative ${
                            activeTab === 'description' 
                                ? 'text-[#C9A86C]' 
                                : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        Description
                        {activeTab === 'description' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C9A86C]" />}
                    </button>
                    <button 
                        onClick={() => setActiveTab('reviews')}
                        className={`pb-4 px-4 font-semibold text-lg transition-all relative ${
                            activeTab === 'reviews' 
                                ? 'text-[#C9A86C]' 
                                : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        Reviews ({productDetails?.reviewCount || 0})
                         {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C9A86C]" />}
                    </button>
                </div>

                <div className="max-w-4xl mx-auto">
                    {activeTab === 'description' ? (
                        <div 
                            className="prose prose-lg prose-gray mx-auto text-gray-600 leading-relaxed w-full max-w-full break-words overflow-x-auto"
                            dangerouslySetInnerHTML={{
                                __html: productDetails?.detailed_description || '<p class="text-center text-gray-500 italic">No description available for this product.</p>'
                            }}  
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-2xl">
                             <div className="bg-white p-4 rounded-full shadow-sm mb-4"><MessageSquareText size={32} className="text-gray-300" /></div>
                             <h3 className="text-lg font-medium text-gray-900">No Reviews Yet</h3>
                             <p className="text-gray-500 mt-1">Be the first to share your thoughts on this product</p>
                             <button className="mt-6 px-6 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition shadow-md">Write a Review</button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Recommendations */}
            <div ref={recommendationsRef} className="mt-24">
                <div className="flex justify-between items-end mb-8">
                     <div>
                        <h2 className="text-2xl font-bold text-gray-900">You may also like</h2>
                        <p className="text-gray-500 mt-1">Curated recommendations based on your interest</p>
                     </div>
                     <Link href="/products" className="text-sm font-medium text-[#C9A86C] hover:text-[#b08f55] flex items-center gap-1 group">
                        View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                     </Link>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                     {isRecommendationsLoading ? (
                        [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
                    ) : recommendedProducts?.length > 0 ? (
                        recommendedProducts.map((p: any) => (
                            <ProductCard key={p.id} product={p} />
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl">
                            <p className="text-gray-500">No similar products found at the moment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  )
}

export default ProductDetails