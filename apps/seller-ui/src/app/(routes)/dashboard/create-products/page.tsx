'use client';

import { useQuery } from '@tanstack/react-query';
import ImagePlaceHolder from 'apps/seller-ui/src/shared/components/image-placeholder';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import {  ChevronRight } from 'lucide-react';
import ColorSelector from 'packages/components/color-selector';
import CustomProperties from 'packages/components/custom-properties';
import CustomSpecifications from 'packages/components/custom-specification';
import Input from 'packages/components/input';
import RichTextEditor from 'packages/components/rich-text-editor';
import SizeSelector from 'packages/components/size-selector';
import React, { useMemo, useState } from 'react'
import { Controller, set, useForm } from 'react-hook-form';

const Page = () => {
    const {register,control,watch,setValue,handleSubmit,formState:{errors}} = useForm();
    const [openImageModal, setOpenImageModal] = useState(false);
    const[isChanged,setIsChanged] = useState(true);
    const [images,setImages] = useState<(File | null)[]>([null]);
    const[loading,setLoading] = useState(false);

    const {data,isLoading,isError} = useQuery({
      queryKey: ['categories'],
      queryFn: async() => {
        try {
          const res = await axiosInstance.get('/product/api/get-categories');
          return res.data;
        } catch (error) {
          console.error(error);
        }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
      });
      const{data:discountCodes=[],isLoading:discountLoading}=useQuery({
        queryKey:['shop-discounts'],
        queryFn: async ()=>{
            const res=await axiosInstance.get('/product/api/get-discount-codes');
            return res?.data?.discount_codes || [];
        },
    });

      const categories = data?.categories || [];
      const subCategoriesData = data?.subCategories || [];

      const selectedCategory = watch('category');
      const regularPrice = watch('regular_price');

      const subCategories = useMemo(() => {
        return selectedCategory ? subCategoriesData[selectedCategory] || [] : [];
      }, [selectedCategory, subCategoriesData]);


    const onSubmit = (data:any) => {
      console.log(data);
    }

    const convertToBase64 = (file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.onerror = (error) => {
          reject(error);
        };
      });
    };
    const handleImageChange = async (file: File | null, index: number) => {
      if(!file) return;

      try {
        const fileName= await convertToBase64(file);

        const response=await axiosInstance.post('/product/api/upload-product-image',fileName
        );
        const updatedImages = [...images];
        updatedImages[index] = response.data.fileName;
        if(file && index === images.length - 1 && images.length < 8) {
            updatedImages.push(null); // Add a new placeholder if the last one is filled
        }
        setImages(updatedImages);
        setValue('images', updatedImages); // Update form value
      } catch (error) {
        console.error("Error uploading image:", error);
      }
      
    }

    const handleRemoveImage = async(index: number) => {
      try {
        const updatedImages = [...images];
        const imageToDelete = updatedImages[index];
        if (imageToDelete && typeof imageToDelete === 'string') {
        }
        updatedImages.splice(index, 1); // Remove the image at the specified index
        //Add a null placeholder if there are less than 8 images
        if (updatedImages.length < 8 && !updatedImages.includes(null)) {
          updatedImages.push(null);
        }
        setImages(updatedImages);
        setValue('images', updatedImages); // Update form value
        }
      catch (error) {
        console.error("Error deleting image:", error);        
      }
    };
    // setImages((prev) => {
    //   const newImages = [...prev];
    //   newImages.splice(index, 1); // Remove the image at the specified index
    //       if (newImages.length === 0) {
    //         return [null];
    //       }
    //     return newImages;
    //   });
    //   setValue('images', images); // Update form value
    const handleSaveDraft = () => {
      // Implement save draft functionality here
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
            defaultImage={images[0] ? URL.createObjectURL(images[0]) : null}
              key={`image-0-${images[0]?.name || 'empty'}`}
            />
          )}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {images?.slice(1).map((image, index) => (
              <ImagePlaceHolder
                setOpenImageModal={setOpenImageModal}
                size="765 x 850"
                key={`image-${index + 1}-${image?.name || 'empty'}`}
                small
                index={index + 1}
                onImageChange={handleImageChange}
                onRemove={ handleRemoveImage}
                defaultImage={image ? URL.createObjectURL(image) : null}
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
                  {/* Category */}
                  <label className='block font-semibold text-gray-300 mb-1'>
                    Category *
                  </label>
                  {
                    isLoading ? (
                      <p className='text-gray-400'>Loading categories...</p>
                    ) : isError ? (
                      <p className="text-red-500">Error loading categories</p>
                    ) : (
                      <Controller
                        name="category"
                        control={control}
                        rules={{ required: "Category is required" }}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full px-4 py-2 bg-[#1e1e1e] border border-gray-600 rounded-lg focus:outline-none focus:border-gray-500 text-gray-200"
                          >
                            {""}
                              <option value="" className='bg-black'>
                                Select Category
                              </option>
                            {categories.map((category: string) => (
                              <option key={category} value={category} className='bg-black'>
                                {category}
                              </option>
                            ))}
                            
                          </select>
                        )}
                      />
                  )}
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.category.message as string}
                    </p>
                  )}

                  {/* Sub Category */}
                  <div className="mt-2">
                    <label className='block font-semibold text-gray-300 mb-1'>
                      Sub Category *
                    </label>
                    {
                    isLoading ? (
                      <p className='text-gray-400'>Loading subcategories...</p>
                    ) : isError ? (
                      <p className="text-red-500">Error loading subcategories</p>
                    ) : (
                      <Controller
                        name="sub_category"
                        control={control}
                        rules={{ required: "Sub category is required" }}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full px-4 py-2 bg-[#1e1e1e] border border-gray-600 rounded-lg focus:outline-none focus:border-gray-500 text-gray-200"
                          >
                            {""}
                              <option value="" className='bg-black'>
                                Select Sub Category
                              </option>
                            {subCategories.map((subCategory: string) => (
                              <option key={subCategory} value={subCategory} className='bg-black'>
                                {subCategory}
                              </option>
                            ))}
                            
                          </select>
                        )}
                      />
                  )}
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.category.message as string}
                    </p>
                  )}
                  </div>

                  {/* Detail Description */}
                  <div className="mt-2">
                      <label className="block font-semibold text-gray-300 mb-1">
                        Detailed Description * (Min 100 words)
                      </label>
                      <Controller
                        name="detailed_description"
                        control={control}
                        rules={{
                          required: "Detailed description is required",
                          validate: (value) => {
                            const wordCount = value.trim().split(/\s+/).length;
                            return wordCount >= 100 || `Detailed description must be at least 100 words (Current: ${wordCount} words)`;
                          }
                        }}
                        render={({ field }) => (
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}                         
                          />
                        )}
                      />
                      {errors.detailed_description &&
                      <p className="text-red-500 text-sm mt-1">{errors.detailed_description.message as string}
                      </p>}                      
                  <div/>
                  {/* Video URL */}
                  <div className="mt-2">
                    <Input
                      label="Product Video URL "
                      placeholder='e.g. , https://www.youtube.com/watch?v=example'
                      {...register('video_url',{
                        pattern:{
                          value:/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
                          message:"Please enter a valid YouTube URL"
                        }
                      })}
                    />
                    {errors.video_url &&<p className="text-red-500 text-sm mt-1">{errors.video_url.message as string}
                    </p>}
                  </div>
                  {/* Regular Price */}
                  <div className="mt-2">
                    <Input
                      label="Regular Price *"
                      placeholder='e.g. , 90$'
                      {...register('regular_price',{
                        required:"Regular price is required",
                        valueAsNumber:true,
                        min:{
                          value:1,
                          message:"Price must be at least 1$"
                        },
                        validate: (value) => !isNaN(value) || "Price must be a positive number",
                      })}
                    />
                    {errors.regular_price &&<p className="text-red-500 text-sm mt-1">{errors.regular_price.message as string}
                    </p>}
                  </div>
                  {/* Sale Price */}
                  <div className="mt-2">
                    <Input
                      label="Sale Price "
                      placeholder='e.g. , 80$'
                      {...register('sale_price',{
                        required: "Sale price is required",
                        valueAsNumber:true,
                        min:{
                          value:1,
                          message:"Sale price must be at least 1$"
                        },
                        validate: (value) => {
                          if (isNaN(value)) {
                            return "Sale price must be a number";
                          }
                          if (regularPrice && value >= regularPrice) {
                            return "Sale price must be less than regular price";
                          }
                          return  true;
                        }
                      })}
                    />
                    {errors.sale_price &&<p className="text-red-500 text-sm mt-1">{errors.sale_price.message as string}
                    </p>}
                  </div>
                  {/* Product stock */}
                  <div className="mt-2">
                    <Input
                      label="Product Stock *"
                      placeholder='e.g. , 100'
                      {...register('stock',{
                        required:"Product stock is required",
                        valueAsNumber:true,
                        min:{
                          value:1,
                          message:"Stock must be at least 1"
                        },
                        max:{
                          value:1000,
                          message:"Stock must be less than 1,000"
                        },
                        validate: (value) => {
                          if (isNaN(value)) {
                            return "Stock must be a number";
                          }
                          if (!Number.isInteger(value)) {
                            return "Stock must be an integer";
                          }
                          return true;
                        }
                      })}/>
                    {errors.stock &&<p className="text-red-500 text-sm mt-1">{errors.stock.message as string}
                    </p>}
                  </div>
                  {/* Sizes*/}
                  <div className='mt-2'>
                      <SizeSelector
                        control={control}
                        errors={errors}
                      />
                  </div>
                  {/* Vouchers */}
                  <div className="mt-3">
                    <label className="block font-semibold text-gray-300 mb-1">
                      Select Discount Codes(Optional)
                    </label>
                    { discountLoading ? (
                      <p className='text-gray-400'>Loading discount codes...</p>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {discountCodes?.map((code:any) => (
                          <button 
                          key={code.id} type="button" 
                          className={`px-3 py-1  text-sm font-semibold rounded-md ${watch(`discountCode`)
                            ?.includes(code.id) ? 'bg-gray-700 border border-[#ffffff6b] text-white' : 'bg-gray-800 hover:bg-gray-600 border-gray-600 text-gray-300'
                          } `} 
                          onClick={()=>
                          {
                            const currentSelection = watch('discountCode') || [];
                            const updatedSelection = currentSelection?.includes(code.id) 
                            ? currentSelection.filter((id:string) => id !== code.id) : [...currentSelection, code.id];
                            setValue('discountCode', updatedSelection);
                          }}
                          >
                            {code.public_name} ({code.discountValue}
                          {code.discountType === 'percentage' ? '%' : '$'} Off
                            )
                          </button>
                        ))}
                      </div>
                    )}

                  </div>
              </div>
            </div>           
          </div>          
        </div>
      </div>
      {/* Save Draft Buttons */}
      <div className="mt-6 flex justify-end gap-3">
              {isChanged &&(
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className='px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors'
                  >
                  Save Draft
                </button>
              )
              }
              <button
                type="submit"
                disabled={loading}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors'
              >
                {loading ? 'Creating...' : 'Create Product'}
              </button>
      </div>

    </form>
  )
}
export default Page