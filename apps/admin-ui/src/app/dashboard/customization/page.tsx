'use client';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from 'apps/admin-ui/src/utils/axiosInstance';
import BreadCrumbs from 'apps/admin-ui/src/shared/components/breadcrums';
import { Image as ImageIcon, List, Layout, Trash2, Plus, Save, Upload } from 'lucide-react';
import ComponentLoader from 'apps/admin-ui/src/shared/components/loading/component-loader';
import { compressImage, compressionPresets, formatFileSize } from 'apps/admin-ui/src/services/imageCompressionService';

const Customization = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('categories');
    
    // Local state for editing
    const [categories, setCategories] = useState<string[]>([]);
    const [subCategories, setSubCategories] = useState<Record<string, string[]>>({});
    const [categoryImages, setCategoryImages] = useState<Record<string, {file_url: string, fileId: string}>>({});
    const [images, setImages] = useState<any[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [newSubCategory, setNewSubCategory] = useState<Record<string, string>>({});
    const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['customizations'],
        queryFn: async () => {
            const res = await axiosInstance.get('/admin/api/get-all-customizations');
            return res.data;
        },
    });

    useEffect(() => {
        if (data) {
            setCategories(data.categories || []);
            setSubCategories(data.subCategories || {});
            setImages(data.images || []);
            
            // Extract category images from images array
            const catImages: Record<string, {file_url: string, fileId: string}> = {};
            (data.images || []).forEach((img: any) => {
                if (img.type?.startsWith('category_')) {
                    const catName = img.type.replace('category_', '');
                    catImages[catName] = { file_url: img.file_url, fileId: img.fileId };
                }
            });
            setCategoryImages(catImages);
        }
    }, [data]);

    const updateMutation = useMutation({
        mutationFn: async (payload: any) => {
            return await axiosInstance.put('/admin/api/update-site-config', payload);
        },
        onSuccess: () => {
            alert('Configuration updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['customizations'] });
        },
        onError: (err) => {
            console.error(err);
            alert('Failed to update configuration.');
        }
    });

    const handleSave = () => {
        updateMutation.mutate({
            categories,
            subCategories,
            images
        });
    };

    // Category Handlers
    const addCategory = () => {
        if (newCategory && !categories.includes(newCategory)) {
            setCategories([...categories, newCategory]);
            setSubCategories({ ...subCategories, [newCategory]: [] });
            setNewCategory('');
        }
    };

    const removeCategory = (cat: string) => {
        const newCats = categories.filter(c => c !== cat);
        setCategories(newCats);
        const newSubs = { ...subCategories };
        delete newSubs[cat];
        setSubCategories(newSubs);
        // Also remove category image
        const newImages = images.filter(img => img.type !== `category_${cat}`);
        setImages(newImages);
        const newCatImages = { ...categoryImages };
        delete newCatImages[cat];
        setCategoryImages(newCatImages);
    };

    // Subcategory Handlers
    const addSubCategory = (cat: string) => {
        const val = newSubCategory[cat];
        if (val) {
            const currentSubs = subCategories[cat] || [];
            if (!currentSubs.includes(val)) {
                setSubCategories({
                    ...subCategories,
                    [cat]: [...currentSubs, val]
                });
                setNewSubCategory({ ...newSubCategory, [cat]: '' });
            }
        }
    };

    const removeSubCategory = (cat: string, sub: string) => {
        const currentSubs = subCategories[cat] || [];
        setSubCategories({
            ...subCategories,
            [cat]: currentSubs.filter(s => s !== sub)
        });
    };

    // Category Image Upload with compression
    const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, categoryName: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingCategory(categoryName);
        try {
            // Compress image first
            const result = await compressImage(file, compressionPresets.balanced);
            const compressedFile = result.compressedFile;
            
            if (result.wasCompressed) {
                console.log(`Category image compressed: ${formatFileSize(result.originalSize)} -> ${formatFileSize(result.compressedSize)}`);
            }

            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                try {
                    const res = await axiosInstance.post('/admin/api/upload-site-image', {
                        fileName: base64String
                    });
                    if (res.data.success) {
                        // Remove old category image if exists
                        const filteredImages = images.filter(img => img.type !== `category_${categoryName}`);
                        
                        const newImage = {
                            file_url: res.data.file_url,
                            fileId: res.data.fileId,
                            type: `category_${categoryName}`
                        };
                        setImages([...filteredImages, newImage]);
                        setCategoryImages({
                            ...categoryImages,
                            [categoryName]: { file_url: res.data.file_url, fileId: res.data.fileId }
                        });
                    }
                } catch (error) {
                    console.error("Upload failed", error);
                    alert("Upload failed");
                } finally {
                    setUploadingCategory(null);
                }
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error("Compression failed", error);
            setUploadingCategory(null);
            alert("Image processing failed");
        }
    };

    const removeCategoryImage = (categoryName: string) => {
        const newImages = images.filter(img => img.type !== `category_${categoryName}`);
        setImages(newImages);
        const newCatImages = { ...categoryImages };
        delete newCatImages[categoryName];
        setCategoryImages(newCatImages);
    };

    // General image upload with compression
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Use different presets based on type
            const preset = type === 'banner' ? compressionPresets.high : compressionPresets.balanced;
            const result = await compressImage(file, preset);
            const compressedFile = result.compressedFile;
            
            if (result.wasCompressed) {
                console.log(`${type} image compressed: ${formatFileSize(result.originalSize)} -> ${formatFileSize(result.compressedSize)}`);
            }

            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                try {
                    const res = await axiosInstance.post('/admin/api/upload-site-image', {
                        fileName: base64String
                    });
                    if (res.data.success) {
                        const newImage = {
                            file_url: res.data.file_url,
                            fileId: res.data.fileId,
                            type: type
                        };
                        setImages([...images, newImage]);
                    }
                } catch (error) {
                    console.error("Upload failed", error);
                    alert("Upload failed");
                }
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error("Compression failed", error);
            alert("Image processing failed");
        }
    };

    const removeImage = (fileId: string) => {
        setImages(images.filter(img => img.fileId !== fileId));
    };

    const getImagesByType = (type: string) => {
        return images.filter(img => img.type === type);
    };

    const tabs = [
        { id: 'categories', label: 'Categories', icon: List },
        { id: 'logo', label: 'Logo', icon: ImageIcon },
        { id: 'banner', label: 'Banner', icon: Layout },
    ];

    if (error) {
        return (
            <div className='w-full min-h-screen p-6 bg-gray-950 text-white flex items-center justify-center'>
                <p className="text-red-400">Failed to load customizations</p>
            </div>
        );
    }

    return (
        <div className='w-full min-h-screen p-6 bg-gray-950 text-white'>
            <BreadCrumbs title="Customization" />
            <div className="mt-6">
                {/* Tabs Header */}
                <div className="flex border-b border-gray-800 mb-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${
                                    activeTab === tab.id
                                        ? 'text-blue-500'
                                        : 'text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />
                                )}
                            </button>
                        );
                    })}
                </div>
                {isLoading ? (
                    <ComponentLoader text="Loading..." />
                ) : (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 min-h-[400px]">
                    {activeTab === 'categories' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-white">Categories Structure</h3>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        placeholder="New Category Name"
                                        className="bg-gray-800 border border-gray-700 text-white px-3 py-1 rounded text-sm focus:outline-none focus:border-blue-500"
                                    />
                                    <button 
                                        onClick={addCategory}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                    >
                                        <Plus size={16} /> Add
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid gap-3">
                                {categories.length > 0 ? (
                                    categories.map((cat: string, index: number) => (
                                        <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-4">
                                                    {/* Category Image */}
                                                    <div className="relative group">
                                                        {categoryImages[cat] ? (
                                                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-600 relative">
                                                                <img 
                                                                    src={categoryImages[cat].file_url} 
                                                                    alt={cat}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <button 
                                                                    onClick={() => removeCategoryImage(cat)}
                                                                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 size={16} className="text-red-400" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                                                                {uploadingCategory === cat ? (
                                                                    <span className="text-xs text-gray-400">...</span>
                                                                ) : (
                                                                    <>
                                                                        <Upload size={16} className="text-gray-500" />
                                                                        <span className="text-xs text-gray-500 mt-1">Image</span>
                                                                    </>
                                                                )}
                                                                <input 
                                                                    type="file" 
                                                                    className="hidden" 
                                                                    accept="image/*"
                                                                    onChange={(e) => handleCategoryImageUpload(e, cat)}
                                                                    disabled={uploadingCategory === cat}
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                    <h4 className="font-medium text-blue-400">{cat}</h4>
                                                </div>
                                                <button onClick={() => removeCategory(cat)} className="text-red-400 hover:text-red-300">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            
                                            <div className="mt-2 pl-4 border-l-2 border-gray-700">
                                                {subCategories[cat]?.map((sub: string, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between text-sm text-gray-400 mt-1 group">
                                                        <span>{sub}</span>
                                                        <button onClick={() => removeSubCategory(cat, sub)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <div className="flex gap-2 mt-2">
                                                    <input 
                                                        type="text" 
                                                        value={newSubCategory[cat] || ''}
                                                        onChange={(e) => setNewSubCategory({...newSubCategory, [cat]: e.target.value})}
                                                        placeholder="Add subcategory..."
                                                        className="bg-gray-900 border border-gray-700 text-gray-300 px-2 py-1 rounded text-xs w-full focus:outline-none focus:border-blue-500"
                                                    />
                                                    <button 
                                                        onClick={() => addSubCategory(cat)}
                                                        className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">No categories found.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'logo' && (
                        <div className="flex flex-col gap-8 h-full min-h-[300px]">
                            {/* Logo 1 */}
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-white">Logos</h3>
                                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                                        <Plus size={16} /> Upload Logo
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'logo')}
                                        />
                                    </label>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {getImagesByType('logo').map((img, idx) => (
                                        <div key={idx} className="relative group bg-gray-800 rounded-lg border border-gray-700 p-4 flex items-center justify-center">
                                            <img 
                                                src={img.file_url} 
                                                alt="Logo" 
                                                className="max-w-full max-h-32 object-contain" 
                                            />
                                            <button 
                                                onClick={() => removeImage(img.fileId)}
                                                className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {getImagesByType('logo').length === 0 && (
                                        <p className="text-gray-500 col-span-full">No logos uploaded.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'banner' && (
                        <div className="flex flex-col gap-4 h-full min-h-[300px]">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-white">Banners</h3>
                                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                                    <Plus size={16} /> Upload Banner
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'banner')}
                                    />
                                </label>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {getImagesByType('banner').map((img, idx) => (
                                    <div key={idx} className="relative group bg-gray-800 rounded-lg border border-gray-700 p-4">
                                        <img 
                                            src={img.file_url} 
                                            alt="Banner" 
                                            className="w-full max-h-64 object-cover rounded" 
                                        />
                                        <button 
                                            onClick={() => removeImage(img.fileId)}
                                            className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {getImagesByType('banner').length === 0 && (
                                    <p className="text-gray-500">No banners uploaded.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="mt-6 flex justify-end border-t border-gray-800 pt-4">
                        <button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Save size={20} />
                            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
                )}
            </div>
        </div>
                
    );
};

export default Customization;