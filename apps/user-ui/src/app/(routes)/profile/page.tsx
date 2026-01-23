"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import useRequiredAuth from 'apps/user-ui/src/hooks/useRequiredAuth';
import QuickActionCard from 'apps/user-ui/src/shared/components/cards/quick-action.card';
import StatCard from 'apps/user-ui/src/shared/components/cards/stat.card';
import ChangePassword from 'apps/user-ui/src/shared/components/change-password';
import ShippingAdressSection from 'apps/user-ui/src/shared/components/shippingAdress';
import OrderTable from 'apps/user-ui/src/shared/components/tables/orders.table';
import TwoFactorAuth from 'apps/user-ui/src/shared/components/TwoFactorAuth';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import { BadgeCheck, Bell, CheckCircle, Clock, Gift, Inbox, Lock, LogOutIcon, MapPin, Pencil, PhoneCall, Receipt, Settings, Shield, ShoppingBag, Truck, User, X, Camera, User2Icon } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import React, {useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import PageLoader from 'apps/user-ui/src/shared/components/loading/page-loader';
import useLogout from 'apps/user-ui/src/hooks/useLogout';

const NavItems = ({label,Icon,active,danger,onClick}:any)=>(
    <button
        onClick={onClick}
        className={'w-full flex items-center gap-3 px-4 py-2 rounded-md hover:bg-gray-100 transition ' + 
            (active ? 'bg-gray-200 font-semibold' : 'font-medium') + (danger ? ' text-red-600 hover:bg-red-100' : ' text-gray-700 hover:text-blue-600'
            )}
    >
        <Icon className="w-5 h-5"/>
        {label}
    </button>
)

const Page = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { logout, isLoggingOut } = useLogout();
    const{user,isLoading} = useRequiredAuth();
    const { data: orders = [] } = useQuery({
        queryKey: ['user-orders'],
        queryFn: async () => {
            const res = await axiosInstance.get('/order/api/get-user-orders');
            return res.data.orders;
        }
    });
    const totalOrders = orders.length;
    const processingOrders = orders.filter((order:any) => order?.deliveryStatus !== 'Delivered' && order?.deliveryStatus !== 'Cancelled').length;
    const completedOrders = orders.filter((order:any) => order.deliveryStatus === 'Delivered').length;
    const queryTab=searchParams.get('active') || 'Profile';
    const [activeTab, setActiveTab] = useState(queryTab);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editAvatar, setEditAvatar] = useState<string | null>(null);
    const [newAvatarFile, setNewAvatarFile] = useState<{file_url: string, fileId: string} | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if(activeTab!==queryTab){
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.set('active', activeTab);
            router.replace(`/profile?${newParams.toString()}`,{scroll:false} );
        }
    }, [activeTab]);

    useEffect(() => {
        if (isEditModalOpen && user) {
            setEditName(user.name || '');
            setEditAvatar(user.avatar || null);
        }
    }, [isEditModalOpen, user]);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            try {
                const res = await axiosInstance.post('/api/upload-avatar', {
                    fileName: base64String
                });
                if (res.data.success) {
                    setEditAvatar(res.data.file_url);
                    setNewAvatarFile({
                        file_url: res.data.file_url,
                        fileId: res.data.fileId
                    });
                }
            } catch (error) {
                console.error("Avatar upload failed", error);
                toast.error("Failed to upload avatar");
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProfile = async () => {
        try {
            setIsUpdating(true);
            await axiosInstance.put('/api/update-profile', {
                name: editName,
                avatar: newAvatarFile
            });
            await queryClient.invalidateQueries({ queryKey: ['user'] });
            setIsEditModalOpen(false);
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error("Update failed", error);
            toast.error("Failed to update profile");
        } finally {
            setIsUpdating(false);
        }
    };

  return (
    <div className='bg-gray-50 p-6 pb-14'>
        <div className="md:w-[85%] w-[95%] mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            {/*Greeting Section*/}
            <div className="mb-8">
                <div className="h-40 bg-gradient-to-r from-[#070707] via-[#1a1a1a] to-[#070707] relative overflow-hidden">
                    {/* Gold gradient effects */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,108,0.20),transparent_70%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(201,168,108,0.15),transparent_70%)]" />
                    <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#C9A86C]/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-[-50%] left-[-10%] w-64 h-64 bg-[#C9A86C]/10 rounded-full blur-3xl"></div>
                </div>
                <div className="px-8 relative">
                    <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 gap-6">
                        <div className="relative group">
                            <div className="p-1.5 bg-white rounded-full shadow-lg">
                                {user?.avatar ? (
                                    <Image
                                        src={user.avatar}
                                        alt={user.name || "User"}
                                        width={128}
                                        height={128}
                                        className="w-28 h-28 rounded-full object-cover border-4 border-white"
                                    />
                                ) : (
                                    <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white">
                                        <User2Icon size={48} className="text-gray-400"/>
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => setIsEditModalOpen(true)}
                                className="absolute bottom-2 right-2 p-2 bg-[#C9A86C] text-black rounded-full hover:bg-[#E8D5B5] transition shadow-md border-2 border-white group-hover:scale-110"
                                title="Change Avatar"
                            >
                                <Camera size={16} />
                            </button>
                        </div>
                        
                        <div className="flex-1 text-center md:text-left mb-2">
                             {isLoading ? (
                                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-2 mx-auto md:mx-0"></div>
                            ) : (
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    {user?.name || "User"}
                                </h1>
                            )}
                            <p className="text-gray-500 font-medium">Welcome back to your profile!</p>
                            <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
                                <span className="px-3 py-1 bg-[#C9A86C]/10 text-[#C9A86C] text-xs font-bold uppercase tracking-wider rounded-full border border-[#C9A86C]/20">
                                    {user?.role || 'Member'}
                                </span>
                                <span className="text-sm text-gray-400 flex items-center gap-1">
                                    <Clock size={14} />
                                    Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="mb-4 md:mb-2 hidden md:block">
                             <button 
                                onClick={() => setIsEditModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#C9A86C] to-[#B8956A] text-black rounded-xl hover:from-[#E8D5B5] hover:to-[#C9A86C] transition-all duration-300 shadow-md font-semibold"
                            >
                                <Pencil size={16} />
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/*Profile Overview Grid*/}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Orders"
                    count={totalOrders}
                    Icon={Clock}
                />
                <StatCard
                    title="Processing Orders"
                    count={processingOrders}
                    Icon={Truck}
                />
                <StatCard
                    title="Completed Orders"
                    count={completedOrders}
                    Icon={CheckCircle}
                />
            </div>
        </div>
         {/*Side Bar and content layout*/}
            <div className="mt-10 flex flex-col md:flex-row gap-6">
                {/*Left Navigation Sidebar*/}
                <div className="bg-white p-4 rounded-md shadow-md w-full md:w-1/5">
                    <nav className="space-y-2">
                        <NavItems
                            label="Profile"
                            Icon={User}
                            active={activeTab === 'profile'}
                            onClick={() => setActiveTab('profile')}
                        />
                        <NavItems
                            label="My Orders"
                            Icon={ShoppingBag}
                            active={activeTab === 'My Orders'}
                            onClick={() => setActiveTab('My Orders')}
                        />
                        <NavItems
                            label="Inbox"
                            Icon={Inbox}
                            active={activeTab === 'inbox'}
                            onClick={() => setActiveTab('inbox')}
                        />
                        <NavItems
                            label="Notifications"
                            Icon={Bell}
                            active={activeTab === 'notifications'}
                            onClick={() => setActiveTab('notifications')}
                        />
                        <NavItems
                            label="Shipping Address"
                            Icon={MapPin}
                            active={activeTab === 'shipping'}
                            onClick={() => setActiveTab('shipping')}
                        />
                        <NavItems
                            label="Change Password"
                            Icon={Lock}
                            active={activeTab === 'change-password'}
                            onClick={() => setActiveTab('change-password')}
                        />
                        <NavItems
                            label="Security Settings"
                            Icon={Shield}
                            active={activeTab === 'security'}
                            onClick={() => setActiveTab('security')}
                        />
                        {/*Line break*/}
                        <hr className="my-4 border-gray-300" />
                        <NavItems
                            label="Logout"
                            Icon={LogOutIcon}
                            danger
                            onClick={logout}
                        />
                    </nav>
                </div>
                {/*Main Content Area*/}
                <div className="bg-white p-6 rounded-md shadow-md w-full md:w-3/5">
                    <h2 className="text-2xl font-semibold mb-4">
                        {activeTab.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                    </h2>
                    {activeTab === 'profile' && !isLoading && user ? (
                        <div className='space-y-4 text-sm text-gray-700'>
                            <p>
                                <span className="font-medium">Name: </span>{user?.name || 'N/A'}
                            </p>
                            <p>
                                <span className="font-medium">Email: </span>{user?.email || 'N/A'}
                            </p>
                            <p>
                                <span className="font-medium">Joined: </span><span>{new Date(user?.createdAt || 'N/A').toLocaleDateString()}</span>
                            </p>
                            <p>
                                <span className="font-medium">Earned Points: </span>{user?.points || 0}
                            </p>
                        </div>
                    ) : activeTab === 'shipping' ? (
                        <ShippingAdressSection/>
                    ) : activeTab === 'My Orders' ?(
                        <OrderTable />
                    ): activeTab === 'change-password' ?(
                        <ChangePassword />                    ): activeTab === 'security' ?(
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Two-Factor Authentication</h3>
                                <TwoFactorAuth />
                            </div>
                        </div>                    ) : null}
                </div>
                {/*Right Quick Panel*/}
                <div className="w-full md:w-1/5 space-y-4 cursor-pointer">
                    <QuickActionCard
                        Icon={Gift}
                        title="Referral Program"
                        description="Invite friends and earn rewards for each successful referral!"
                    />
                    <QuickActionCard
                        Icon={BadgeCheck}
                        title="Your Badges"
                        description="View your earned badges and achievements."
                    />
                    <QuickActionCard
                        Icon={Settings}
                        title="Account Settings"
                        description="Manage your account preferences and settings."
                    />
                    <QuickActionCard
                        Icon={Receipt}
                        title="Billing History"
                        description="Check your recent payments"
                    />
                    <QuickActionCard
                        Icon={PhoneCall}
                        title="Support Center"
                        description="Need help? Contact our support team for assistance."
                    />
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                        <button 
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-6 text-gray-800">Edit Profile</h2>
                        
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative">
                                <Image 
                                    src={editAvatar || 'https://img.favpng.com/16/13/13/patient-gray-avatar-silhouette-YbNU02fy.jpg'} 
                                    alt="Avatar Preview" 
                                    width={100} 
                                    height={100} 
                                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                                />
                                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
                                    <Camera size={16} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                </label>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input 
                                type="text" 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleUpdateProfile}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {(isUpdating || isUploading || isLoggingOut) && <PageLoader />}
    </div>
  )
}

export default Page
