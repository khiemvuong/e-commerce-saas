"use client";

import { useQueryClient } from '@tanstack/react-query';
import ProfileIcon from 'apps/user-ui/src/assets/svgs/profile-icon'
import useUser from 'apps/user-ui/src/hooks/useUser';
import QuickActionCard from 'apps/user-ui/src/shared/components/cards/quick-action.card';
import StatCard from 'apps/user-ui/src/shared/components/cards/stat.card';
import ShippingAdressSection from 'apps/user-ui/src/shared/components/shippingAdress';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import { BadgeCheck, Bell, CheckCircle, Clock, Gift, Inbox, Loader2, Lock, LogOutIcon, MapPin, Pencil, PhoneCall, Receipt, Settings, ShoppingBag, Truck, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import React, {useEffect, useState } from 'react'

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
    const{user,isLoading} = useUser();
    const queryTab=searchParams.get('active') || 'Profile';
    const [activeTab, setActiveTab] = useState(queryTab);

    useEffect(() => {
        if(activeTab!==queryTab){
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.set('active', activeTab);
            router.replace(`/profile?${newParams.toString()}`);
        }
    }, [activeTab]);

    const logOutHandler = async () => {
        await axiosInstance.get("/api/log-out-user").then((res) =>{
            queryClient.invalidateQueries({queryKey: ['user']});
            router.push("/login");
        });
    };
  return (
    <div className='bg-gray-50 p-6 pb-14'>
        <div className=" max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
            {/*Greeting Section*/}
            <div className="mb-6 border-b pb-4 flex gap-4 justify-center">
                <div className=" flex-col flex items-center">
                    <ProfileIcon size={40} className="text-gray-600"/>
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Welcome back to your profile!</span>
                    </div>
                    {isLoading ? (
                        <Loader2 className='inline animate-spin w-5 h-5'/>
                    ) : (
                        <span className="text-lg font-semibold text-gray-700"> {user?.name ? ` ${user.name}` : ","}</span>
                    )}
                </div>
            </div>

            {/*Profile Overview Grid*/}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Orders"
                    count={10}
                    Icon={Clock}
                />
                <StatCard
                    title="Processing Orders"
                    count={4}
                    Icon={Truck}
                />
                <StatCard
                    title="Completed Orders"
                    count={6}
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
                        {/*Line break*/}
                        <hr className="my-4 border-gray-300" />
                        <NavItems
                            label="Logout"
                            Icon={LogOutIcon}
                            danger
                            onClick={logOutHandler}
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
                            <div className="flex items-center gap-3">
                                <Image 
                                src={user?.avatar || 'https://img.favpng.com/16/13/13/patient-gray-avatar-silhouette-YbNU02fy.jpg'} 
                                alt="profile" 
                                width={60} 
                                height={60} 
                                className="w-16 h-16 rounded-full object-cover"/>
                                <button className='flex items-center gap-1 text-xs text-blue-600'>
                                    <Pencil size={15} />Edit Profile
                                </button>
                            </div>
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
                    ) : null}
                </div>
                {/*Right Quick Panel*/}
                <div className="w-full md:w-2/5 space-y-4 cursor-pointer">
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
    </div>
  )
}

export default Page

