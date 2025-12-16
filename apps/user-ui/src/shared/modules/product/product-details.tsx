'use client';
import React, { useEffect } from 'react'
import { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, RotateCcw, Heart, MapPin, Package, WalletMinimal, MessageSquareText } from 'lucide-react';
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

const ProductDetails = ({productDetails}:{productDetails: any}) => {
    const [currentImage, setCurrentImage] = useState(0);
    const [isSelected, setIsSelect] = useState(productDetails?.colors?.[0] || '');
    const [isSizeSelected, setIsSizeSelect] = useState(productDetails?.sizes?.[0] || '');  
    const [quantity, setQuantity] = useState(1);
    const [selectedProperties, setSelectedProperties] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
    
    const wishlist = useStore((state:any) => state.wishlist);
    const addToWishlist = useStore((state:any) => state.addToWishlist);
    const removeFromWishlist = useStore((state:any) => state.removeFromWishlist);
    const isWishlisted = wishlist.some((item:any) => item.id === productDetails.id);
    const {user} = useUser();
    const location = useLocationTracking();
    const deviceInfo = useDeviceTracking();
    const [recommendedProducts, setRecommendedProducts] = useState([]);

    const discountPercentage = productDetails?.regular_price && productDetails?.sale_price ? Math.round(((productDetails?.regular_price - productDetails?.sale_price) / productDetails?.regular_price) * 100) : 0;
    
    const fetchRecommendedProducts = async () => {
        try {   
            const query = new URLSearchParams();
            
            // Tính price range linh hoạt dựa trên giá sản phẩm
            const basePrice = productDetails?.sale_price || productDetails?.regular_price || 100;
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
            
            console.log('Products:', filtered.map((p: any) => p.name));
            setRecommendedProducts(filtered);
        } catch (error) {
            console.error("❌ Error fetching recommended products:", error);
        }
    };

    useEffect(() => {
        if (productDetails?.id) {
            fetchRecommendedProducts();
        } else {
            console.log('⏳ Waiting for product details...');
        }
    }, [productDetails?.id]);

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

  return (
    <div className="w-full bg-white">
        {/* Breadcrumb */}
        <div className="w-[90%] lg:w-[80%] mx-auto py-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <Link href="/" className="hover:underline">Product Listing</Link>
                <span>&gt;</span>
                <span className="text-gray-900">{productDetails?.title || 'Dummy Product Page'}</span>
            </div>
        </div>

        <div className="w-[90%] lg:w-[80%] mx-auto pb-12 grid grid-cols-1 lg:grid-cols-[40%_60%] gap-8">
            {/* Left Section: Product Images */}
            <div className="flex gap-4">
                {/* Thumbnail Gallery - Vertical */}
                <div className="flex flex-col gap-3 w-[120px]">
                    {productDetails?.images?.map((img: any, index: number) => (
                        <button
                            key={index}
                            onClick={() => setCurrentImage(index)}
                            className={`w-full aspect-square border-2 rounded-lg overflow-hidden transition ${
                                currentImage === index
                                    ? 'border-gray-400'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <Image
                                src={img.file_url}
                                alt={`Thumbnail ${index + 1}`}
                                width={120}
                                height={120}
                            />
                        </button>
                    ))}
                </div>

                {/* Main Image with Zoom */}
                <div className="flex-1">
                    <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
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
                                    <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                                        <button
                                            onClick={() => zoomIn()}
                                            className="bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition"
                                            aria-label="Zoom in"
                                        >
                                            <ZoomIn size={18} />
                                        </button>
                                        <button
                                            onClick={() => zoomOut()}
                                            className="bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition"
                                            aria-label="Zoom out"
                                        >
                                            <ZoomOut size={18} />
                                        </button>
                                        <button
                                            onClick={() => resetTransform()}
                                            className="bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition"
                                            aria-label="Reset zoom"
                                        >
                                            <RotateCcw size={18} />
                                        </button>
                                    </div>

                                    {/* Zoomable Image */}
                                    <TransformComponent
                                        wrapperClass="!w-full !aspect-square"
                                        contentClass="!w-full !h-full flex items-center justify-center"
                                    >
                                        <img
                                            src={productDetails?.images?.[currentImage]?.file_url || 'https://bunchobagels.com/wp-content/uploads/2024/09/placeholder.jpg'}
                                            alt="Product image"
                                            className="max-w-full max-h-full object-contain cursor-zoom-in"
                                        />
                                    </TransformComponent>
                                </>
                            )}
                        </TransformWrapper>
                    </div>
                </div>
            </div>

            {/* Right Section: Product Details */}
            <div className="space-y-5">
                {/* Title and Wishlist */}
                <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-semibold text-gray-900">
                        {productDetails?.title || 'Dummy Product Page'}
                    </h1>
                    <Heart 
                            className="ml-auto cursor-pointer" 
                            size={24}
                            stroke={isWishlisted ? "red" : "gray"}
                            fill={isWishlisted ? "red" : "none"}
                            onClick={() => {
                                isWishlisted 
                                    ? removeFromWishlist(productDetails.id, user, location, deviceInfo) 
                                    : addToWishlist({
                                        ...productDetails, 
                                        quantity,
                                        selectedOptions:{
                                            ...(isSelected && { color: isSelected }),
                                            ...(isSizeSelected && { size: isSizeSelected }),
                                            ...selectedProperties
                                        }}, 
                                    user, 
                                    location, 
                                    deviceInfo);
                            }}
                    />
                </div>
                {/*Brand*/}
                <div className="text-base text-gray-500">
                    Brand:{" "}
                    <span className="font-medium">{productDetails?.brand || 'No Brand'}</span>
                </div>
                {/* Price and Rating */}
                <div className="flex items-center gap-4">
                    <span className="text-3xl text-gray-700">
                        ${productDetails?.sale_price}
                    </span>
                    <span className="text-2xl text-gray-500 line-through">
                        ${productDetails?.regular_price?.toFixed(2) || '54.98'}
                    </span>
                    {/*Discount Percentage*/}
                    <span className="text-sm text-green-600 font-medium">
                        {discountPercentage}% Off
                    </span>
                    
                    {/* Line break */}
                    <div className="w-px h-6 bg-gray-600" />
                    <div className="flex items-center gap-2">
                        <Rating size='lg' rating={productDetails?.rating || 4.5} />
                        <span className="text-sm text-gray-500">({productDetails?.reviewCount || 32} review{productDetails?.reviewCount !== 1 ? 's' : ''})</span>
                    </div>
                    
                </div>

                {/* Short Description */}
                <div className="text-gray-600 text-sm leading-relaxed border-b pb-5">
                    {productDetails?.short_description || 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna.'}
                </div>

                {/* Bullet Points
                <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                        <span className="text-gray-900">•</span>
                        <span>Lorem ipsum dolor sit amet, adipi scing elit</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-gray-900">•</span>
                        <span>Lorem ipsum dolor sit amet, consectetuer adipi scing elit</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-gray-900">•</span>
                        <span>Lorem ipsum dolor sit amet, adipi</span>
                    </li>
                </ul> */}

                {/* Color Selection */}
                {productDetails?.colors?.length > 0 && (
                    <div className="space-y-2">
                        <span className="text-sm font-medium text-gray-700">Colors:</span>
                        <div className="flex gap-2">
                            {productDetails.colors.map((color:string, index:number) => (
                                <button
                                    key={index}
                                    className={`w-6 h-6 rounded-full border-2 ${isSelected===color ? 'border-gray-800 ring-2 ring-offset-2 ring-gray-300' : 'border-gray-300'}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setIsSelect(color)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Size Selection */}
                {productDetails?.sizes?.length > 0 && (
                    <div className="space-y-2">
                        <span className="text-sm font-medium text-gray-700">Size:</span>
                        <div className="flex gap-2">
                            {productDetails.sizes.map((size:string, index:number) => (
                                <button
                                    key={index}
                                    className={`px-4 py-2 rounded-md border-2 text-sm font-medium transition ${
                                        isSizeSelected===size 
                                            ? 'bg-black text-white border-black' 
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                    }`}
                                    onClick={() => setIsSizeSelect(size)}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Custom Properties Selection */}
                {productDetails?.custom_properties && Array.isArray(productDetails.custom_properties) && productDetails.custom_properties.length > 0 && (
                    <div className="space-y-4">
                        {productDetails.custom_properties.map((prop: any, index: number) => (
                            <div key={index} className="space-y-2">
                                <span className="text-sm font-medium text-gray-700">{prop.label}:</span>
                                <div className="flex gap-2 flex-wrap">
                                    {prop.value.map((val: string, vIndex: number) => (
                                        <button
                                            key={vIndex}
                                            className={`px-4 py-2 rounded-md border-2 text-sm font-medium transition ${
                                                selectedProperties[prop.label] === val
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                            }`}
                                            onClick={() => setSelectedProperties(prev => ({ ...prev, [prop.label]: val }))}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Quantity and Actions */}
                <div className="flex items-center gap-3">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                        <button
                            className="px-4 py-2 bg-white hover:bg-gray-100 font-medium text-gray-700"
                            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        >
                            -
                        </button>
                        <span className="px-6 py-2 bg-white font-medium text-gray-900 border-x border-gray-300">{quantity}</span>
                        <button
                            className="px-4 py-2 bg-white hover:bg-gray-100 font-medium text-gray-700"
                            onClick={() => setQuantity((prev) => prev + 1)}
                        >
                            +
                        </button>  
                    </div>
                    {/*Stock*/}
                    <div className="text-sm text-gray-600">
                        {productDetails?.stock > 0 
                            ? `${productDetails?.stock} items available` 
                            : (<span className="text-red-500 font-semibold">Out of stock</span>)}
                    </div>

                    {/* Add to Cart Button */}
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
                        />
                    </div>
                </div>

                {/* Shipping Info */}
                <div className="space-y-4 pt-4 border-t mt-6">
                    {/* Delivery Options */}
                    <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-gray-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Deliver to {location?.city || 'your location'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Ships in 3-7 working days</p>
                        </div>
                    </div>

                    {/* Return & Warranty */}
                    <div className="flex items-start gap-3">
                        <Package size={18} className="text-gray-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">30 Days Return Policy</p>
                            <p className="text-xs text-gray-500 mt-0.5">Easy return & refund available</p>
                        </div>
                    </div>

                    {/* Warranty */}
                    <div className="flex items-start gap-3">
                        <WalletMinimal size={18} className="text-gray-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Warranty Information</p>
                            <p className="text-xs text-gray-500 mt-0.5">1 year manufacturer warranty</p>
                        </div>
                    </div>

                    {/* Sold by */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t">
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">Sold by</p>
                            <p className="text-sm font-medium text-gray-900">
                                {productDetails?.Shop?.name || 'Unknown Seller'}
                            </p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Link
                                href={`#`}
                                className="px-4 py-2 border border-gray-300 text-gray-900 text-sm rounded-md hover:bg-gray-50 transition flex items-center gap-1"
                            >
                                <MessageSquareText size={16} />
                                Chat
                            </Link>
                        </div>
                    </div>
                    {/*Seller Performance*/}
                    <div className="pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-3">Seller Performance</p>
                        <div className="grid grid-cols-3 gap-4">
                            {/* Positive Feedback */}
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">98%</p>
                                <p className="text-xs text-gray-500 mt-1">Positive Feedback</p>
                            </div>
                            
                            {/* Ship on Time */}
                            <div className="text-center border-x border-gray-200">
                                <p className="text-2xl font-bold text-gray-900">95%</p>
                                <p className="text-xs text-gray-500 mt-1">Ship on Time</p>
                            </div>
                            
                            {/* Chat Response Rate */}
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">97%</p>
                                <p className="text-xs text-gray-500 mt-1">Chat Response</p>
                            </div>
                        </div>
                    </div>
                    {/*Go to store */}
                    <div className="pt-3 border-t text-center">
                        <Link
                            href={`/shop/${productDetails?.Shop?.id}`}
                            className="px-4 py-2  text-blue-500 font-medium text-sm rounded-md hover:underline transition"
                        >
                            GO TO STORE
                        </Link>
                    </div>

                </div>
            </div>
        </div>

        {/* Description and Reviews Section */}
        <div className="w-[90%] lg:w-[80%] mx-auto pb-12">
            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-300 mb-8">
                <button 
                    onClick={() => setActiveTab('description')}
                    className={`pb-3 font-medium transition ${
                        activeTab === 'description' 
                            ? 'text-gray-900 border-b-2 border-gray-900' 
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Description
                </button>
                <button 
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-3 font-medium transition ${
                        activeTab === 'reviews' 
                            ? 'text-gray-900 border-b-2 border-gray-900' 
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Reviews
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'description' && (
                <div 
                className="prose prose-sm space-y-6 text-gray-700 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                    __html: productDetails?.detailed_description || 'No description available.'
                }}  
            />
            )}
            {activeTab === 'reviews' && (
                <div className="text-gray-700">
                    <p className="text-sm">No reviews yet. Be the first to review this product!</p>
                </div>
            )}
        </div>
        {/* Recommended Products - You may also like */}
        <div className="w-[90%] lg:w-[80%] mx-auto pb-12 border-t-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Map through recommended products */}
                {recommendedProducts?.map((i: any) => (
                    <ProductCard key={i.id} product={i} />
                ))}
            </div>
        </div>
    </div>
  )
}

export default ProductDetails