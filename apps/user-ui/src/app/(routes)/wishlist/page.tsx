'use client';
import useUser from 'apps/user-ui/src/hooks/useUser';
import React from 'react'
import useLocationTracking from 'apps/user-ui/src/hooks/useLocationTracking';
import useDeviceTracking from 'apps/user-ui/src/hooks/useDeviceTracking';
import {useStore} from 'apps/user-ui/src/store';
import Link from 'next/link';
import Image from 'next/image';
import {  Trash2 } from 'lucide-react';
const WishlistPage = () => {
    const {user} = useUser();
    const location = useLocationTracking();
    const deviceInfo = useDeviceTracking();
    const addToCart = useStore((state:any) => state.addToCart);
    const removeFromWishlist = useStore((state:any) => state.removeFromWishlist);
    const wishlist = useStore((state:any) => state.wishlist);

    const decreaseQuantity = (productId: string) => {
        useStore.setState((state:any)=>({
            wishlist: state.wishlist.map((item:any) =>
                item.id === productId && item.quantity && item.quantity > 1
                ? { ...item, quantity: item.quantity - 1 }
                : item
            ),
        }));
    };
    const removeItem = (id:string) => {
        removeFromWishlist(id,user,location,deviceInfo);
    }
    const increaseQuantity = (productId: string) => {
        useStore.setState((state:any)=>({
            wishlist: state.wishlist.map((item:any) =>
                item.id === productId
                ? { ...item, quantity: (item.quantity ?? 1) + 1 }
                : item
            ),
        }));
    };

  return (
    <div className="w-full bg-white">
        <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
            {/*Breadcrumbs*/}
            <div className="pb-[50px]">
                <h1 className='mt-2 md:pt-p[50px] font-medium text-[44px] leading-[1] mb-[16px] font-poppins'>Wishlist ({wishlist.length})</h1>
                <Link 
                href={'/'} 
                className='text-[16px] text-gray-500 hover:underline'>
                    Home
                </Link>
                <span className='inline-block p-[1.5px] mx-1 bg-[#a8acbo] rounded-full'>
                    .
                </span>
                <span className='text-[16px] text-gray-500'> 
                    Wishlist
                </span>
            </div>
            {/*If wishlist is empty*/}
            {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <h2 className="text-2xl font-semibold mb-4">Your wishlist is empty</h2>
                    <p className="text-gray-600 mb-6">Browse products and add them to your wishlist.</p>
                    <Link 
                    href="/products"
                    className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition">
                        Shop Now
                    </Link>
                    </div>
                    ) : (
                        <div className=" flex flex-col gap-10 pb-10 md:">    
                            <table className='w-full border-collapse'>
                                <thead className='bg-[#f1f3f4]'>
                                    <tr>
                                        <th className='p-4 text-left font-medium text-gray-700 pl-4'>Product</th>
                                        <th className='p-4 text-left font-medium text-gray-700'>Price</th>
                                        <th className='p-4 text-left font-medium text-gray-700'>Quantity</th>
                                        <th className='p-4 text-left font-medium text-gray-700'>Actions</th>
                                        <th className='p-4 text-left font-medium text-gray-700'></th>
                                    </tr>

                                </thead>
                                <tbody>
                                    {wishlist.map((item:any) => (
                                        <tr key={item.id} className='border-b'>
                                            <td className='p-4 flex items-center gap-4'>
                                                <Image 
                                                src={item.images[0]?.file_url}
                                                alt={item.title}
                                                width={80}
                                                height={80}
                                                className='w-20 h-20 object-cover rounded-md'
                                                />
                                                <span className='font-medium text-gray-800'>{item.title}</span>
                                            </td>
                                            <td className='p-4 text-gray-800 font-medium'>${item?.sale_price.toFixed(2)}
                                            </td>
                                            <td >
                                                <div className='flex justify-center items-center gap-3 border border-gray-200 rounded-3xl w-[80px] p-[2px]'>
                                                    <button
                                                    onClick={()=> decreaseQuantity(item.id)}
                                                    className='text-black cursor-pointer text-xl font-bold hover:text-gray-500'>
                                                        -
                                                    </button>
                                                    <span className=' font-medium text-gray-800'>{item?.quantity}</span>
                                                    <button 
                                                    onClick={()=> increaseQuantity(item.id)}
                                                    className='text-black cursor-pointer text-xl font-bold hover:text-gray-500'>
                                                        +
                                                    </button>
                                                </div>
                                            </td>
                                            <td>       
                                                <button 
                                                    onClick={
                                                        ()=> addToCart(item,user,location,deviceInfo)
                                                    }
                                                    className='bg-gray-600 cursor-pointer text-white hover:bg-gray-500 transition-all px-5 py-2 rounded-md'>
                                                    Add to Cart
                                                </button>
                                            </td>
                                            <td>
                                                <button 
                                                onClick={()=> removeItem(item.id)}
                                                className=' flex flex-row items-center gap-2 text-gray-600 hover:text-red-600 transition'>
                                                    <Trash2 size={16} />
                                                    <span>Remove</span>
                                                </button>
                                            </td>
                                            
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                }
            </div>
        </div>
    )
}

export default WishlistPage