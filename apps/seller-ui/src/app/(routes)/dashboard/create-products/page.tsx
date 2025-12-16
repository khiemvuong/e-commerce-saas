'use client';

import { useQuery } from '@tanstack/react-query';
import BreadCrumbs from 'apps/seller-ui/src/shared/components/breadcrums';
import ImagePlaceHolder from 'apps/seller-ui/src/shared/components/image-placeholder';
import { enhancements } from 'apps/seller-ui/src/utils/AI.enhancements';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import {  Wand, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ColorSelector from 'packages/components/color-selector';
import CustomProperties from 'packages/components/custom-properties';
import CustomSpecifications from 'packages/components/custom-specification';
import Input from 'packages/components/input';
import RichTextEditor from 'packages/components/rich-text-editor';
import SizeSelector from 'packages/components/size-selector';
import React, { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PageLoader from 'apps/seller-ui/src/shared/components/loading/page-loader';

interface UploadedImage {
  file_url: string;
  fileId: string;
  thumbnailUrl?: string;
  file?: File;
}

const Page = () => {
    const {register,control,watch,setValue,handleSubmit,formState:{errors}} = useForm();
    const [openImageModal, setOpenImageModal] = useState(false);
    const [activeEffect, setActiveEffect] = useState<string | null>(null);
    const [isChanged, setIsChanged] = useState(true);
    const [images, setImages] = useState<(UploadedImage | null)[]>([null]);
    const [uploadingIndexes] = useState<Set<number>>(new Set());
    const [previews, setPreviews] = useState<Record<number, string>>({});
    const [selectedImage, setSelectedImage] = useState('');
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

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


    const onSubmit = async(data:any) => {
      setIsSubmitting(true);
      try {
        // Upload images that haven't been uploaded yet
        const finalImages = await Promise.all(
          images.map(async (img) => {
            if (!img) return null;

            // If already uploaded (has fileId), keep it
            if (img.fileId) {
              return {
                file_url: img.file_url,
                fileId: img.fileId,
                thumbnailUrl: img.thumbnailUrl
              };
            }

            // If it's a local file, upload it now
            if (img.file) {
              const base64String = await convertToBase64(img.file);
              const uploadRes = await axiosInstance.post('/product/api/upload-product-image', {
                fileName: base64String,
              });
              
              if (uploadRes.data.success) {
                return {
                  file_url: uploadRes.data.file_url,
                  fileId: uploadRes.data.fileId,
                  thumbnailUrl: uploadRes.data.thumbnailUrl
                };
              }
            }
            return null;
          })
        );

        const validImages = finalImages.filter(Boolean);
        
        await axiosInstance.post('/product/api/create-product', {
          ...data,
          images: validImages
        });
        toast.success('Product created successfully');
        router.push('/dashboard/all-products');
      } catch (error:any) {
        toast.error(error?.response?.data?.message || 'Failed to create product');
      } finally {
        setIsSubmitting(false);
      }
    }

    const convertToBase64 = (file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = (error) => {
          reject(error);
        };
      });
    };
    const syncImagesField = (list: (UploadedImage | null)[]) => {
    const sanitized = list
      .filter((img): img is UploadedImage => !!img?.file_url && !!img.fileId)
      .map((img) => ({
        file_url: img.file_url,
        fileId: img.fileId,
        thumbnailUrl: img.thumbnailUrl ?? null,
      }));
      setValue('images', sanitized, { shouldDirty: true, shouldValidate: true });
    };

const handleImageChange = async (file: File | null, index: number) => {
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    toast.error('Image size must be less than 10MB');
    return;
  }
  if (!file.type.startsWith('image/')) {
    toast.error('Please upload a valid image');
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  setPreviews((prev) => ({ ...prev, [index]: objectUrl }));

  // Store file locally, do not upload yet
  const newImage: UploadedImage = {
    file_url: objectUrl,
    fileId: '', // Empty until upload
    file: file,
  };

  const updated = [...images];
  updated[index] = newImage;

  if (index === images.length - 1 && images.length < 8) {
    updated.push(null);
  }

  setImages(updated);
  // We don't sync to form 'images' field yet because they lack fileId, 
  // but onSubmit handles the merge.
  setIsChanged(true);
};

  const handleRemoveImage = async (index: number) => {
    // Nếu đang upload thì không cho xóa tại thời điểm đó
    if (uploadingIndexes.has(index)) return;

    const img = images[index];

    try {
      if (img?.fileId) {
        await axiosInstance.delete('/product/api/delete-product-image', {
          data: { fileId: img.fileId },
        });
      }

      // Xóa phần tử và dồn index
      const updated = [...images];
      updated.splice(index, 1);

      // Nếu rỗng thì thêm lại placeholder
      if (updated.length === 0) {
        updated.push(null);
      }

      // Nếu phần tử cuối cùng không phải placeholder và chưa đủ 8 ảnh -> thêm placeholder
      if (updated[updated.length - 1] !== null && updated.length < 8) {
        updated.push(null);
      }

      setImages(updated);
      setValue(
        'images',
        updated.filter(Boolean).map((i) => (i as UploadedImage).fileId)
      );
      setIsChanged(true);

      // Clear preview của index vừa xóa
      setPreviews((prev) => {
        const next: Record<number, string> = {};
        // Do đã shift index, ta dựng lại mapping preview theo index mới (chỉ giữ preview còn tồn tại)
        Object.keys(prev).forEach((k) => {
          const oldIdx = Number(k);
          const newIdx = oldIdx > index ? oldIdx - 1 : oldIdx;
          if (oldIdx !== index) next[newIdx] = prev[oldIdx];
          if (oldIdx === index) URL.revokeObjectURL(prev[oldIdx]);
        });
        return next;
      });

      toast.success('Image removed');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to remove image');
    }
  };

  const applyTransformation = async (transformation: string) => {
      if (!selectedImage || processing) return;
      setProcessing(true);
      try {
        const baseUrl = selectedImage.split('?')[0];
        const transformedUrl = `${baseUrl}?tr=${transformation}`;

        // Wait until the transformed image finishes loading before updating UI and showing success toast
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = (e) => reject(e);
          img.src = transformedUrl;
        });

        // Apply transform in UI only (no persistence) and mark active effect
        setSelectedImage(transformedUrl);
        setActiveEffect(transformation);
        toast.success('Enhancement applied!');
      } catch (error) {
        console.log('Error applying transformation:', error);
        toast.error('Failed to apply enhancement');
      } finally {
        setProcessing(false);
      }
  }

  const confirmEffect = () => {
    if (selectedImageIndex === null || selectedImageIndex === undefined) {
      toast.error('No image selected');
      return;
    }

    const idx = selectedImageIndex;
    const current = images[idx];

    // Ensure the image was uploaded and has a fileId
    if (!current || !current.fileId) {
      toast.error('Please upload an image first');
      return;
    }

    // Update the image with the transformed URL
    const updated = [...images];
    updated[idx] = {
      ...current,
      file_url: selectedImage,
    };

    setImages(updated);
    syncImagesField(updated);
    setIsChanged(true);
    setOpenImageModal(false);
    setActiveEffect(null);
    toast.success('Effect confirmed and saved!');
  };

    const handleSaveDraft = () => {
      // Implement save draft functionality here
    }

  return (
    <form className="w-full mx-auto p-8 shadow-md rounded-lg text-white" onSubmit={handleSubmit(onSubmit)}>
      {isSubmitting && <PageLoader />}
      {/* Heading and Breadcrums */}
      <BreadCrumbs title="Create Product"/>
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
            images={images}
            onImageChange={handleImageChange}
            isUploading={uploadingIndexes.has(0)}
            setSelectedImage={setSelectedImage}
            setSelectedImageIndex={setSelectedImageIndex}
            onRemove={handleRemoveImage}
            defaultImage={previews[0] || images[0]?.file_url || null}
            key={`image-0-${images[0]?.fileId || previews[0] || 'empty'}`}
            />
          )}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {images.slice(1).map((img, i) => {
              const realIndex = i + 1;
              return (
                <ImagePlaceHolder
                  setOpenImageModal={setOpenImageModal}
                  size="765 x 850"
                  key={`image-${realIndex}-${img?.fileId || previews[realIndex] || 'empty'}`}
                  small
                  index={realIndex}
                  images={images}
                  setSelectedImage={setSelectedImage}
                  setSelectedImageIndex={setSelectedImageIndex}
                  onImageChange={handleImageChange}
                  onRemove={handleRemoveImage}
                  defaultImage={previews[realIndex] || img?.file_url || null}
                  isUploading={uploadingIndexes.has(realIndex)}
                />
              );
            })}
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
                  {...register('short_description',{
                    required:"Short description is required",
                    validate: (value) =>{
                      const wordCount = value.trim().split(/\s+/).length;
                      return wordCount <= 150 || `Short description must be less than 150 words (Current: ${wordCount} words)`;
                    }
                  })}
                />
                {errors.short_description &&
                <p className="text-red-500 text-sm mt-1">{errors.short_description.message as string}
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
                  {...register('slug',{
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
                            {subCategories.map((sub_category: string) => (
                              <option key={sub_category} value={sub_category} className='bg-black'>
                                {sub_category}
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
      {openImageModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-[450px] text-white">
            <div className="flex justify-between items-center pb-3 mb-4">
              <h2 className='text-lg font-semibold'>Enhaunce Product Image</h2>
              <X size={20} className="ml-2 cursor-pointer" onClick={() => setOpenImageModal(!openImageModal)} />
            </div>
            <div className="w-full h-[300px] rounded-md overflow-hidden border border-gray-600 relative">
              {selectedImage ? (
                <img
                src={selectedImage}
                alt='product-image'
                className=" object-cover w-full h-full"
              />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e]">
                  <p className="text-gray-400">No image selected</p>
                </div>
              )}
            </div>
            {selectedImage && (
              <div className="mt-4 space-y-2">
                <h3 className='text-white text-sm font-semibold'>
                  AI Enhancement
                </h3>
                <div className="grid grid-cols-2 gap-3 mx-h-[250px] overflow-y-auto">
                {enhancements?.map(({label,effect})=>(
                  <button
                  key={effect}
                  type="button"
                  className={`p-2 rounded-md flex items-center gap-2 ${activeEffect === effect ? 'bg-blue-600 text-white'  : 'bg-gray-700 hover:bg-gray-600'}`}
                  onClick={()=>applyTransformation(effect)}
                  disabled={processing}
                  >
                    <Wand size={18} />
                    {label}
                  </button>
                ))}
                </div>
                {/*Action Buttons*/}
                  {/* Confirm Button - only show if an effect is applied */}
                  {activeEffect && (
                    <button
                      type="button"
                      onClick={confirmEffect}
                      className=" w-full my-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500"
                      disabled={processing}
                    >
                      Confirm Enhancement
                    </button>
                  )}
                  {/*Reset Button*/}
                  <button
                    type="button"
                    onClick={() => {
                      const baseUrl = selectedImage.split('?')[0];
                      setSelectedImage(baseUrl);
                      setActiveEffect(null);
                      toast.success('Reset to original');
                    }}
                    className={`w-full px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600`}
                    disabled={processing}
                  >
                    Reset to Original
                  </button>
                </div>
            )
            }
          </div>
        </div>
      )}
      {/* Save Draft Buttons */}
      <div className="mt-6 flex justify-end gap-3">
        {isChanged && (
          <button type="button" onClick={handleSaveDraft} className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600">
            Save Draft
          </button>
        )}
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500">
          Create Product
        </button>
      </div>

    </form>
  )
}
export default Page