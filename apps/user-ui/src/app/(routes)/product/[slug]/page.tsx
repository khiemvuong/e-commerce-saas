import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import React from 'react'
import { Metadata } from 'next';
import ProductDetails from 'apps/user-ui/src/shared/modules/product/product-details';
async function fetchProductDetails(slug: string) {
    const res = await axiosInstance.get(`/product/api/get-product/${slug}`);
    return res.data.product;
}
export async function generateMetadata({
    params,
    }:{
        params: Promise<{slug: string}>;
    }) : Promise<Metadata> {
    const { slug } = await params;
    const product = await fetchProductDetails(slug);
    return {
        title: `${product?.title} || 'Ilan E-commerce'`,
        description: product?.short_description || 
        'Discover Ilan E-commerce - your ultimate destination for a wide range of products. Shop now for unbeatable deals and quality items!',
        openGraph:{
            title: `${product?.title} || 'Ilan E-commerce'`,
            description: product?.short_description || ' ',
            images:[product?.images?.[0].file_url || '/default-product-image.jpg'],
            type:"website",
        },
        twitter:{
            card:"summary_large_image",
            title: `${product?.title} || 'Ilan E-commerce'`,
            description: product?.short_description || ' ',
            images:[product?.images?.[0].file_url || '/default-product-image.jpg'],
        },
    };

}
const Product = async({params}:{params: Promise<{slug: string}>}) => {
    const { slug } = await params;
    const productDetails = await fetchProductDetails(slug);
    return (
      <ProductDetails productDetails={productDetails} />
    );

}

export default Product