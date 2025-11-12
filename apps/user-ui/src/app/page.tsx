"use client"
import React from 'react'
import Hero from '../shared/modules/hero'
import SectionTitle from '../shared/components/section/section-title'
import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../utils/axiosInstance'
import ProductCard from '../shared/components/cards/product-card'
import ScrollToTop from '../shared/components/scroll-to-top'
import ShopCard from '../shared/components/cards/shop.card'
const page = () => {
  const {
    data:products,
    isLoading,
    isError,
  }= useQuery({
    queryKey: ['products'],
    queryFn: async()=>{
      const res= await axiosInstance.get('/product/api/get-all-products?page=1&limit=10')
      return res.data.products;
    },
    staleTime:2*60*1000,
  });

  const {data:latestProducts}=useQuery({
    queryKey:['latest-products'],
    queryFn: async()=>{
      const res= await axiosInstance.get('/product/api/get-all-products?page=1&limit=10&type=latest')
      return res.data.products;
    },
    staleTime:2*60*1000,
  });

  const {data:shops, isLoading:shopLoading} = useQuery({
    queryKey:["shops"],
    queryFn:async()=>{
      const res = await axiosInstance.get("/product/api/top-shops");
      return res.data.shops;
    },
    staleTime:1000*60*2,
  });

  return (
    <div className="min-h-screen pb-10">
      <Hero/>
      <div className='md:w-[80%] w-[90%] my-10 m-auto'>
        {/*Suggested Product Seciton*/}
        <div>
          <div className="mb-8">
            <SectionTitle
              title="Suggested Products"
            />
          </div>
          {isLoading &&(
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
              {/* Product Cards */}
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[250px] animated-pulse bg-gray-300 rounded-xl shadow-md overflow-hidden hover:scale-105 transition-transform duration-300"
                >
                </div>
              ))}
            </div>
          )}
          {!isLoading && !isError &&(
            <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
              {products?.map((product:any)=>(
                  <ProductCard key={product.id} product={product}/>
              ))}
            </div>
          )}

          {products?.length === 0 &&(
            <div className="text-center text-gray-500">No products available.</div>
          )}
        </div>

        {/*Latest Product Section*/}
        <div>
          <div className="my-8 block">
            <SectionTitle
              title="Latest Products"
            />
          </div>
          {isLoading &&(
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
              {/* Product Cards */}
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[250px] animated-pulse bg-gray-300 rounded-xl shadow-md overflow-hidden hover:scale-105 transition-transform duration-300"
                >
                </div>
              ))}
            </div>
          )}
          {!isLoading && !isError &&(
            <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
              {latestProducts?.map((product:any)=>(
                  <ProductCard key={product.id} product={product}/>
              ))}
            </div>
          )}
          {latestProducts?.length === 0 &&(
            <div className="text-center text-gray-500">No products available.</div>
          )}
        </div>

        {/*Top Shops Section*/}
        <div className="div">
          <div className="my-8 block">
            <SectionTitle title="Top Shops"/>
          </div>
          {!shopLoading &&(
            <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
              {shops?.map((shop:any)=>(
                <ShopCard key={shop.id} shop={shop}/>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  )
}


export default page