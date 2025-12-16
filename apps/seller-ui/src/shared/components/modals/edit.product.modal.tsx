'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Wand } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import Input from 'packages/components/input';
import RichTextEditor from 'packages/components/rich-text-editor';
import ColorSelector from 'packages/components/color-selector';
import CustomSpecifications from 'packages/components/custom-specification';
import CustomProperties from 'packages/components/custom-properties';
import SizeSelector from 'packages/components/size-selector';
import ImagePlaceHolder from 'apps/seller-ui/src/shared/components/image-placeholder';
import { enhancements } from 'apps/seller-ui/src/utils/AI.enhancements';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageLoader from 'apps/seller-ui/src/shared/components/loading/page-loader';

interface UploadedImage {
    file_url: string;
    fileId: string;
    thumbnailUrl?: string;
    file?: File;
}

interface EditProductModalProps {
    product: any;
    onClose: () => void;
}

const EditProductModal = ({ product, onClose }: EditProductModalProps) => {
    const queryClient = useQueryClient();
    const { register, control, watch, setValue, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            title: product?.title || '',
            short_description: product?.short_description || '',
            detailed_description: product?.detailed_description || '',
            warranty: product?.warranty || '',
            slug: product?.slug || '',
            tags: Array.isArray(product?.tags) ? product.tags.join(',') : (product?.tags || ''),
            brand: product?.brand || '',
            video_url: product?.video_url || '',
            category: product?.category || '',
            sub_category: product?.sub_category || '',
            stock: product?.stock || 0,
            sale_price: product?.sale_price || 0,
            regular_price: product?.regular_price || 0,
            cash_on_delivery: product?.cash_on_delivery || 'yes',
            colors: product?.colors || [],
            sizes: product?.sizes || [],
            custom_specifications: product?.custom_specifications || [],
            custom_properties: product?.custom_properties || [],
            discountCode: product?.discount_codes?.map((d: any) => d.id) || [],
            images: product?.images || [],
        }
    });

    const [openImageModal, setOpenImageModal] = useState(false);
    const [activeEffect, setActiveEffect] = useState<string | null>(null);
    const [images, setImages] = useState<(UploadedImage | null)[]>([]);
    const [uploadingIndexes, setUploadingIndexes] = useState<Set<number>>(new Set());
    const [previews, setPreviews] = useState<Record<number, string>>({});
    const [selectedImage, setSelectedImage] = useState('');
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (product?.images) {
            const initialImages = product.images.map((img: any) => ({
                file_url: img.file_url,
                fileId: img.fileId
            }));
            const filledImages = [...initialImages];
            if (filledImages.length < 8) filledImages.push(null);
            setImages(filledImages);
            setValue('images', initialImages);
        } else {
            setImages([null]);
        }
    }, [product, setValue]);

    const { data } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await axiosInstance.get('/product/api/get-categories');
            return res.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const { data: discountCodes = [] } = useQuery({
        queryKey: ['shop-discounts'],
        queryFn: async () => {
            const res = await axiosInstance.get('/product/api/get-discount-codes');
            return res?.data?.discount_codes || [];
        },
    });

    const categories = data?.categories || [];
    const subCategoriesData = data?.subCategories || [];
    const selectedCategory = watch('category');

    const subCategories = useMemo(() => {
        return selectedCategory ? subCategoriesData[selectedCategory] || [] : [];
    }, [selectedCategory, subCategoriesData]);

    const convertToBase64 = (file: File) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
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
        // We don't sync to form 'images' field yet because they lack fileId
    };

    const handleRemoveImage = async (index: number) => {
        if (uploadingIndexes.has(index)) return;
        const img = images[index];
        try {
            if (img?.fileId) {
                await axiosInstance.delete('/product/api/delete-product-image', {
                    data: { fileId: img.fileId },
                });
            }
            const updated = [...images];
            updated.splice(index, 1);
            if (updated.length === 0) updated.push(null);
            if (updated[updated.length - 1] !== null && updated.length < 8) updated.push(null);

            setImages(updated);
            syncImagesField(updated);
            toast.success('Image removed');
        } catch (err: any) {
            console.error(err);
            toast.error('Failed to remove image');
        }
    };

    const applyTransformation = async (transformation: string) => {
        if (!selectedImage || processing) return;
        setProcessing(true);
        try {
            const baseUrl = selectedImage.split('?')[0];
            const transformedUrl = `${baseUrl}?tr=${transformation}`;
            await new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = (e) => reject(e);
                img.src = transformedUrl;
            });
            setSelectedImage(transformedUrl);
            setActiveEffect(transformation);
            toast.success('Enhancement applied!');
        } catch (error) {
            toast.error('Failed to apply enhancement');
        } finally {
            setProcessing(false);
        }
    };

    const confirmEffect = () => {
        if (selectedImageIndex === null || selectedImageIndex === undefined) return;
        const idx = selectedImageIndex;
        const current = images[idx];
        if (!current || !current.fileId) return;

        const updated = [...images];
        updated[idx] = { ...current, file_url: selectedImage };
        setImages(updated);
        syncImagesField(updated);
        setOpenImageModal(false);
        setActiveEffect(null);
        toast.success('Effect confirmed!');
    };

    const onSubmit = async (data: any) => {
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

            await axiosInstance.put(`/product/api/edit-product/${product.id}`, {
                ...data,
                discountCodes: data.discountCode,
                images: validImages
            });
            toast.success('Product updated successfully');
            queryClient.invalidateQueries({ queryKey: ['shop-products'] });
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to update product');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 overflow-y-auto py-10">
            {isSubmitting && <PageLoader />}
            <div className="bg-gray-900 w-full max-w-6xl rounded-lg shadow-xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
                    <X size={24} />
                </button>
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Edit Product</h2>
                    <form onSubmit={handleSubmit(onSubmit)} className="text-white">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Left Side - Images */}
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
                                        key={`image-0-${images[0]?.fileId || 'empty'}`}
                                    />
                                )}
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    {images.slice(1).map((img, i) => {
                                        const realIndex = i + 1;
                                        return (
                                            <ImagePlaceHolder
                                                setOpenImageModal={setOpenImageModal}
                                                size="765 x 850"
                                                key={`image-${realIndex}-${img?.fileId || 'empty'}`}
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

                            {/* Right Side - Form */}
                            <div className="md:w-[65%]">
                                <div className="flex gap-6">
                                    <div className="w-1/2 space-y-4">
                                        <Input
                                            label="Product Title *"
                                            placeholder='Enter product title'
                                            {...register('title', { required: "Product title is required" })}
                                        />
                                        {errors.title && <p className="text-red-500 text-sm">{errors.title.message as string}</p>}

                                        <Input
                                            type="textarea"
                                            rows={5}
                                            label="Short Description *"
                                            {...register('short_description', { required: "Required" })}
                                        />

                                        <Input
                                            label="Product Tags *"
                                            {...register('tags', { required: "Required" })}
                                        />

                                        <Input
                                            label="Warranty *"
                                            {...register('warranty', { required: "Required" })}
                                        />

                                        <Input
                                            label="Slug *"
                                            {...register('slug', { required: "Required" })}
                                        />

                                        <Input
                                            label="Brand"
                                            {...register('brand')}
                                        />

                                        <ColorSelector control={control} errors={errors} />
                                        <CustomSpecifications control={control} errors={errors} />
                                        <CustomProperties control={control} errors={errors} />

                                        <div>
                                            <label className="block font-semibold text-gray-300 mb-1">Cash on Delivery *</label>
                                            <select
                                                {...register('cash_on_delivery', { required: "Required" })}
                                                className="w-full px-4 py-2 bg-[#1e1e1e] border border-gray-600 rounded-lg text-gray-200"
                                            >
                                                <option value="yes">Yes</option>
                                                <option value="no">No</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="w-1/2 space-y-4">
                                        <div>
                                            <label className='block font-semibold text-gray-300 mb-1'>Category *</label>
                                            <Controller
                                                name="category"
                                                control={control}
                                                rules={{ required: "Required" }}
                                                render={({ field }) => (
                                                    <select {...field} className="w-full px-4 py-2 bg-[#1e1e1e] border border-gray-600 rounded-lg text-gray-200">
                                                        <option value="">Select Category</option>
                                                        {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                )}
                                            />
                                        </div>

                                        <div>
                                            <label className='block font-semibold text-gray-300 mb-1'>Sub Category *</label>
                                            <Controller
                                                name="sub_category"
                                                control={control}
                                                rules={{ required: "Required" }}
                                                render={({ field }) => (
                                                    <select {...field} className="w-full px-4 py-2 bg-[#1e1e1e] border border-gray-600 rounded-lg text-gray-200">
                                                        <option value="">Select Sub Category</option>
                                                        {subCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                )}
                                            />
                                        </div>

                                        <div>
                                            <label className="block font-semibold text-gray-300 mb-1">Detailed Description *</label>
                                            <Controller
                                                name="detailed_description"
                                                control={control}
                                                rules={{ required: "Required" }}
                                                render={({ field }) => (
                                                    <RichTextEditor value={field.value} onChange={field.onChange} />
                                                )}
                                            />
                                        </div>

                                        <Input label="Video URL" {...register('video_url')} />
                                        <Input label="Regular Price *" type="number" {...register('regular_price', { required: "Required" })} />
                                        <Input label="Sale Price" type="number" {...register('sale_price', { required: "Required" })} />
                                        <Input label="Stock *" type="number" {...register('stock', { required: "Required" })} />
                                        <SizeSelector control={control} errors={errors} />

                                        <div>
                                            <label className="block font-semibold text-gray-300 mb-1">Discount Codes</label>
                                            <div className="flex flex-wrap gap-3">
                                                {discountCodes?.map((code: any) => (
                                                    <button
                                                        key={code.id} type="button"
                                                        className={`px-3 py-1 text-sm font-semibold rounded-md ${watch(`discountCode`)?.includes(code.id) ? 'bg-gray-700 border border-[#ffffff6b] text-white' : 'bg-gray-800 text-gray-300'}`}
                                                        onClick={() => {
                                                            const current = watch('discountCode') || [];
                                                            const updated = current.includes(code.id) ? current.filter((id: string) => id !== code.id) : [...current, code.id];
                                                            setValue('discountCode', updated);
                                                        }}
                                                    >
                                                        {code.public_name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded-md">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Update Product</button>
                        </div>
                    </form>
                </div>
            </div>

            {openImageModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-80">
                    <div className="bg-gray-800 p-6 rounded-lg w-[450px] text-white">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className='text-lg font-semibold'>Enhance Image</h2>
                            <X size={20} className="cursor-pointer" onClick={() => setOpenImageModal(false)} />
                        </div>
                        <div className="w-full h-[300px] rounded-md overflow-hidden border border-gray-600 relative">
                            {selectedImage && <img src={selectedImage} alt='preview' className="object-cover w-full h-full" />}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto">
                            {enhancements?.map(({ label, effect }) => (
                                <button
                                    key={effect}
                                    type="button"
                                    className={`p-2 rounded-md flex items-center gap-2 ${activeEffect === effect ? 'bg-blue-600' : 'bg-gray-700'}`}
                                    onClick={() => applyTransformation(effect)}
                                    disabled={processing}
                                >
                                    <Wand size={18} /> {label}
                                </button>
                            ))}
                        </div>
                        {activeEffect && (
                            <button type="button" onClick={confirmEffect} className="w-full mt-4 px-4 py-2 bg-green-600 rounded-md">Confirm</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditProductModal;
