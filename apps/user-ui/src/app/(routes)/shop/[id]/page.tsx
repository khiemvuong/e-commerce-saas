import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import React from 'react'
import { Metadata } from 'next';
import ShopDetails from 'apps/user-ui/src/shared/modules/shop/shop-details';

async function fetchShopDetails(id: string) {
    try {
        const res = await axiosInstance.get(`/seller/api/get-shop-details/${id}`);
        return res.data.shop;
    } catch (error) {
        return null;
    }
}

export async function generateMetadata({
    params,
    }:{
        params: Promise<{id: string}>;
    }) : Promise<Metadata> {
    const { id } = await params;
    const shop = await fetchShopDetails(id);
    const avatar = shop?.images?.find((img: any) => img.type === "avatar")?.file_url;
    
    return {
        title: `${shop?.name} || 'Ilan E-commerce'`,
        description: shop?.description || shop?.bio ||
        'Discover Ilan E-commerce - your ultimate destination for a wide range of products. Shop now for unbeatable deals and quality items!',
        openGraph:{
            title: `${shop?.name} || 'Ilan E-commerce'`,
            description: shop?.description || shop?.bio || ' ',
            images:[avatar || '/default-shop-image.jpg'],
            type:"website",
        },
        twitter:{
            card:"summary_large_image",
            title: `${shop?.name} || 'Ilan E-commerce'`,
            description: shop?.description || shop?.bio || ' ',
            images:[avatar || '/default-shop-image.jpg'],
        },
    };

}
const Shop = async({params}:{params: Promise<{id: string}>}) => {
    const { id } = await params;
    const shopDetails = await fetchShopDetails(id);
    return (
      <ShopDetails shop={shopDetails} />
    );

}

export default Shop
