'use client';

import ImagePlaceHolder from 'apps/seller-ui/src/shared/components/image-placeholder';
import {  ChevronRight } from 'lucide-react';
import ColorSelector from 'packages/components/color-selector';
import CustomProperties from 'packages/components/custom-properties';
import CustomSpecifications from 'packages/components/custom-specification';
import Input from 'packages/components/input';
import React, { useState } from 'react'
import { useForm } from 'react-hook-form';

const Page = () => {
    const {register,control,watch,setValue,handleSubmit,formState:{errors}} = useForm();
    const [openImageModal, setOpenImageModal] = useState(false);
    const[isChanged,setIsChanged] = useState(false);
    const [images,setImages] = useState<(File | null)[]>([null]);
    const[loading,setLoading] = useState(false);


    const onSubmit = (data:any) => {
      console.log(data);
    }

    const handleImageChange = (file: File | null, index: number) => {
      const updatedImages = [...images];
      updatedImages[index] = file;

      if(index === images.length - 1 && images.length < 8 && file) {
          updatedImages.push(null); // Add a new placeholder if the last one is filled
      }

      setImages(updatedImages);
      setValue('images', updatedImages); // Update form value
    }

    const handleRemoveImage = (index: number) => {
      setImages(prevImages => {
          let updatedImages = [...prevImages];
          if (index === -1) {
              updatedImages[0] = null; // Reset the first image if index is -1
          } else {
              updatedImages.splice(index, 1); // Remove the image at the specified index
          }

          if(updatedImages.includes(null) === false && updatedImages.length < 8) {
              updatedImages.push(null);
          }
          return updatedImages;
      });
      setValue('images', images); // Update form value
    }

  return (
    <form className="w-full mx-auto p-8 shadow-md rounded-lg text-white" onSubmit={handleSubmit(onSubmit)}>
      {/* Heading and Breadcrums */}
      <h2 className="text-2xl py-2 font-semibold font-poppins text-white"> Create Product</h2>
      <div className="flex items-center">
        <span className="text-[#80Deea] cursor-pointer">
          Dashboard
        </span>
        <ChevronRight className="opacity-[.8]" size={16} />
        <span>Create Product</span>
      </div>
      {/* Content Layout */}
      <div className="py-4 w-full flex gap-6">
        {/* Left Side - Image upload section */}
        <div className="md:w-[35%]">
          {images?.length > 0 && (
            <ImagePlaceHolder
            setOpenImageModal={setOpenImageModal}
            size="765 x 850"
            small={false}
            index={0}
            onImageChange={handleImageChange}
            onRemove={handleRemoveImage}
            />
          )}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {images?.slice(1).map((_, index) => (
              <ImagePlaceHolder
                setOpenImageModal={setOpenImageModal}
                size="765 x 850"
                key={index}
                small
                index={index + 1}
                onImageChange={handleImageChange}
                onRemove={handleRemoveImage}
              />
            ))}
          </div>
        </div>
        {/* Right Side - form inputs */}
        <div className="md:w-[65%]">
          <div className="w-full flex gap-6">
            <div className="w-2/4">
              {/* Product Title Input */}
              <div className="mb-4">
                <Input
                  label="Product Title *"
                  placeholder='Enter product title'
                  {...register('title',{required:"Product title is required"})}
                />
                {errors.title && 
                <p className="text-red-500 text-sm mt-1">{errors.title.message as string}
                </p>}
              </div>
    
              {/* Product Short Description */}
              <div className="mt-2">
                <Input
                  type="textarea"
                  rows={7}
                  cols={10}
                  label="Short Description *(Max 150 words)"
                  placeholder='Enter product short description for quick overview'
                  {...register('description',{
                    required:"Short description is required",
                    validate: (value) =>{
                      const wordCount = value.trim().split(/\s+/).length;
                      return wordCount <= 150 || `Short description must be less than 150 words (Current: ${wordCount} words)`;
                    }
                  })}
                />
                {errors.description &&
                <p className="text-red-500 text-sm mt-1">{errors.description.message as string}
                </p>}
              </div>

              {/* Product Tags */}
              <div className="mt-2">
                <Input
                  label="Product Tags *"
                  placeholder='e.g. , electronics, gadgets'
                  {...register('tags',{required:"Separate related tags with comma(,)"})}
                />
                {errors.tags &&
                <p className="text-red-500 text-sm mt-1">{errors.tags.message as string}
                </p>}
              </div>
              {/* Product Warranty */}
              <div className="mt-2">
                <Input
                  label="Product Warranty *"
                  placeholder='e.g. , 1 year, 6 months'
                  {...register('warranty',{required:"Product warranty is required"})}
                />
                {errors.warranty &&<p className="text-red-500 text-sm mt-1">{errors.warranty.message as string}
                </p>}
              </div>

              {/* Product Slug */}
              <div className="mt-2">
                <Input
                  label="Product Slug *"
                  placeholder='e.g. , apple-iphone-14-pro'
                  {...register('product_slug',{
                    required:"Product slug is required",
                    pattern:{
                      value:/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                      message:"Slug can only contain lowercase letters, numbers, and hyphens(-) without spaces"
                    },
                    minLength:{
                      value:3,
                      message:"Slug must be at least 3 characters long"
                    },
                    maxLength:{
                      value:50,
                      message:"Slug must be at most 50 characters long"
                    }
                  })}
                />
                {errors.slug &&<p className="text-red-500 text-sm mt-1">{errors.slug.message as string}
                </p>}
              </div>
              {/* Product Brand */}
              <div className="mt-2">
                <Input
                  label="Product Brand "
                  placeholder='e.g. , Apple, Samsung'
                  {...register('brand')}
                />
                {errors.brand &&<p className="text-red-500 text-sm mt-1">{errors.brand.message as string}
                </p>}
              </div>

              {/* Product Color */}
              <div className="mt-2">
                <ColorSelector control={control} errors={errors} />
              </div>

              {/* Custom Specifications */}
              <div className="mt-2">
                <CustomSpecifications control={control} errors={errors} />
              </div>
              
              {/* Custom Properties */}
              <div className="mt-2">
                <CustomProperties control={control} errors={errors} />
              </div>

              {/* Cash on Delivery */}
              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Cash on Delivery *
                </label>
                <select 
                  {...register('cash_on_delivery',{required:"Cash on delivery option is required"})}
                  defaultValue="yes"
                  className="w-full px-4 py-2 bg-[#1e1e1e] border border-gray-600 rounded-lg focus:outline-none focus:border-gray-500 text-gray-200">
                  <option value="yes" className="bg-black">Yes</option>
                  <option value="no" className="bg-black">No</option>
                </select>
                {errors.cash_on_delivery &&<p className="text-red-500 text-sm mt-1">{errors.cash_on_delivery.message as string}
                </p>}
              </div>
              <div/>
            </div>
            <div className="w-2/4">
                  <label className='block font-semibold text-gray-300 mb-1'>
                    Category *
                  </label>
            </div>
          </div>
        </div>
      </div>
      
    </form>
  )
}

export default Page