'use client';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import { Image as  Store, Save, Upload, Trash2, Plus, Globe, MapPin, Clock, Image } from 'lucide-react';
import ProductCard from '../shared/components/cards/product-card';

const SellerDashboard = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('products');

    // Form State
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [website, setWebsite] = useState('');
    const [address, setAddress] = useState('');
    const [openingHours, setOpeningHours] = useState('');
    const [socialLinks, setSocialLinks] = useState<any[]>([]);
    const [images, setImages] = useState<any[]>([]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['seller-shop'],
        queryFn: async () => {
            const res = await axiosInstance.get('/seller/api/get-shop-details');
            return res.data.shop;
        },
    });

    useEffect(() => {
        if (data) {
            setName(data.name || '');
            setBio(data.bio || '');
            setWebsite(data.website || '');
            setAddress(data.address || '');
            setOpeningHours(data.opening_hours || '');
            setSocialLinks(data.socialLinks || []);
            setImages(data.images || []);
        }
    }, [data]);

    const updateMutation = useMutation({
        mutationFn: async (payload: any) => {
            return await axiosInstance.put('/seller/api/update-shop', payload);
        },
        onSuccess: () => {
            alert('Shop updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['seller-shop'] });
        },
        onError: (err) => {
            console.error(err);
            alert('Failed to update shop.');
        }
    });

    const handleSave = () => {
        updateMutation.mutate({
            name,
            bio,
            website,
            socialLinks,
            images,
            address,
            opening_hours: openingHours
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            try {
                const res = await axiosInstance.post('/seller/api/upload-shop-image', {
                    fileName: base64String
                });
                if (res.data.success) {
                    const newImage = {
                        file_url: res.data.file_url,
                        fileId: res.data.fileId,
                        type: type
                    };
                    const otherImages = images.filter(img => img.type !== type);
                    setImages([...otherImages, newImage]);
                }
            } catch (error) {
                console.error("Upload failed", error);
                alert("Upload failed");
            }
        };
        reader.readAsDataURL(file);
    };

    const addSocialLink = () => {
        setSocialLinks([...socialLinks, { platform: 'Facebook', url: '' }]);
    };

    const updateSocialLink = (index: number, field: string, value: string) => {
        const newLinks = [...socialLinks];
        newLinks[index][field] = value;
        setSocialLinks(newLinks);
    };

    const removeSocialLink = (index: number) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== index));
    };

    const getAvatar = () => images.find(img => img.type === 'avatar');
    const getCover = () => images.find(img => img.type === 'cover');

    if (isLoading) return <div className="p-8 text-purple-600 min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50"><div className="text-lg font-medium">Loading...</div></div>;
    if (error) return <div className="p-8 text-red-600 min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50"><div className="text-lg font-medium">Error loading shop details</div></div>;

      return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-gray-800 font-sans selection:bg-purple-300 pb-20">
      {/* Cover Image Section */}
      <div className="relative h-[300px] md:h-[200px] w-full group overflow-hidden">
        {getCover() ? (
          <>
            <img src={getCover().file_url} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-100/90 via-transparent to-purple-900/30 opacity-90" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-600">
            <span className="text-white flex items-center gap-2 font-medium">
              <Image /> Add Cover Image
            </span>
          </div>
        )}
        {/* Hover Overlay for Cover Upload */}
        <label className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
          <div className="bg-white/90 px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm hover:bg-white transition text-purple-600 font-medium">
            <Upload size={20} />
            <span>Change Cover</span>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
        </label>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section with Avatar and Info */}
        <div className="relative -mt-20 mb-8 flex flex-col md:flex-row items-start md:items-end gap-6">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="w-40 h-40 rounded-full border-4 border-white bg-gradient-to-br from-blue-200 to-purple-200 overflow-hidden shadow-2xl">
              {getAvatar() ? (
                <img src={getAvatar().file_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-purple-400">
                  <Store size={48} />
                </div>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center rounded-full bg-purple-600/70 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent">
              <Upload size={24} className="text-white" />
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
            </label>
          </div>

          {/* Shop Info - Editable */}
          <div className="flex-1 w-full md:mb-4">
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Shop Name"
                className="text-3xl md:text-4xl font-bold bg-transparent border-b-2 border-transparent hover:border-purple-300 focus:border-purple-500 focus:outline-none transition-colors w-full placeholder-gray-400 text-gray-900"
              />
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a short bio..."
                className="text-gray-600 bg-transparent border-b border-transparent hover:border-purple-300 focus:border-purple-400 focus:outline-none transition-colors w-full placeholder-gray-400"
              />
              
              {/* Address & Opening Hours */}
              <div className="flex flex-col sm:flex-row gap-4 mt-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="text-purple-500" />
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Add Address (e.g. Bình Dương)"
                    className="bg-transparent border-none focus:outline-none min-w-[200px] text-gray-700 placeholder-gray-400"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={14} className="text-purple-500" />
                  <input
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    placeholder="Add Opening Hours"
                    className="bg-transparent border-none focus:outline-none min-w-[200px] text-gray-700 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Website & Socials */}
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                  <Globe size={14} />
                  <input 
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Add Website"
                    className="bg-transparent border-none focus:outline-none min-w-[100px] text-blue-600 placeholder-blue-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="md:mb-6 flex gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 rounded-full font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 transform hover:scale-105"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b-2 border-purple-200 mb-8 sticky top-0 bg-white/80 backdrop-blur-md z-10 rounded-t-xl">
          <div className="flex gap-8 px-4">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'products' 
                  ? 'border-purple-600 text-purple-600' 
                  : 'border-transparent text-gray-500 hover:text-purple-500'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'about' 
                  ? 'border-purple-600 text-purple-600' 
                  : 'border-transparent text-gray-500 hover:text-purple-500'
              }`}
            >
              About & Social
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12">
            {data?.products?.map((product:any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Social Media Links</h3>
            <div className="space-y-4 bg-white p-6 rounded-2xl border-2 border-purple-200 shadow-lg">
              {socialLinks.map((link, idx) => (
                <div key={idx} className="flex gap-3">
                  <select
                    value={link.platform}
                    onChange={(e) => updateSocialLink(idx, 'platform', e.target.value)}
                    className="bg-purple-50 border-2 border-purple-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:border-purple-400"
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Twitter">Twitter</option>
                    <option value="Youtube">Youtube</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => updateSocialLink(idx, 'url', e.target.value)}
                    placeholder="URL"
                    className="flex-1 bg-purple-50 border-2 border-purple-200 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:border-purple-400"
                  />
                  <button 
                    onClick={() => removeSocialLink(idx)} 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button 
                onClick={addSocialLink} 
                className="w-full py-3 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 hover:text-purple-700 hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Plus size={18} /> Add Social Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerDashboard;