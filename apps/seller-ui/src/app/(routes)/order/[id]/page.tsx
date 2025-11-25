// 'use client'

// import React,{useEffect,useState} from 'react'
// import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance'
// import {useParams, useRouter} from 'next/navigation';
// import { ArrowLeft, Loader2 } from 'lucide-react';

// const statuses = ['Ordered','Packed','Shipped','Delivered','Out for Delivery'];

// const Page = () => {
//     const params = useParams();
//     const orderId = params.id as string;

//     const [order, setOrder] = useState<any>(null);
//     const [loading, setLoading] = useState(true);
//     const [updating,setUpdating] = useState(false);
//     const router = useRouter();

//     const fetchOrder = async () => {
//         try {
//             const res=await axiosInstance.get(`/order/api/get-order-details/${orderId}`);
//             setOrder(res.data.order);
//         } catch (error) {
//             console.error("Error fetching order details:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
//         const newStatus = e.target.value;
//         setUpdating(true);
//         try {
//             await axiosInstance.put(`/order/api/update-order-status/${orderId}`, {
//                 deliveryStatus: newStatus,
//             });
//             setOrder((prevOrder:any) => ({
//                 ...prevOrder,
//                 deliveryStatus: newStatus,
//             }));
//         } catch (error) {
//             console.error("Error updating order status:", error);
//         } finally {
//             setUpdating(false);
//         }
//     };

//     useEffect(() => {
//         if (orderId) {
//             fetchOrder();
//         }
//     }, [orderId]);

//     if (loading) {
//         return (
//             <div className="flex justify-center items-center h-[40vh]">
//                 <Loader2 className='animate-spin w-6 h-6 text-gray-600' />
//             </div>
//         );
//     }

//     if (!order) {
//         return (
//             <div className="text-center text-gray-600">
//                 Order not found.
//             </div>
//         );
//     }

//     return (
//         <div className="max-w-5xl mx-auto px-4 py-10">
//             <div className="my-4">
//                 <span
//                 className="flex items-center text-blue-600 cursor-pointer hover:underline"
//                 onClick={() => router.push('/dashboard/orders')}
//                 >
//                     <ArrowLeft />
//                     Go Back to Dashboard
//                 </span>
//             </div>
//         </div>

//         <h1 className='text-2xl font-bold text-gray-200 mb-4'>
//             Order #{order.id.slice(-6)}
//         </h1>

//         {/*Status Selector*/}
//         <div className="mb-6">
//             <label className="block text-gray-300 mb-2 font-medium">
//                 Update Delivery Status:
//             </label>
//             <select
//                 value={order.deliveryStatus}
//                 onChange={handleStatusChange}
//                 disabled={updating}
//                 className="block w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2"
//             >
//                 {statuses.map((status) => (
//                     const currentIndex = statuses.indexOf(order.deliveryStatus);
//                     const statusIndex = statuses.indexOf(status);
//                     return (
//                         <option
//                             key={status}
//                             value={status}
//                             disabled={statusIndex < currentIndex}
//                             className={statusIndex < currentIndex ? 'text-gray-500' : ''}
//                         >
//                             {status}
//                         </option>
//                     );
//                 ))}
//             </select>
//         </div>

//         {/*Delivery Progress*/}
//         <div className="mb-6">
//             <div className="flex items-center justify-between text-xs font-medium text-gray-400 mb-2">
//                 {statuses.map((step,idx) => (
//                     const current = step === order.deliveryStatus;
//                     const passed = statuses.indexOf(order.deliveryStatus) > idx;
//                     return (
//                         <div key={step} className=`flex-1 text-left ${current 
//                             ? "text-blue-600"
//                             : passed
//                             ? "text-green-600"
//                             : "text-gray-500"
//                         }`}>
//                             {step}
//                         </div>
//                 ))}
//             </div>
//             <div className='flex items-center'>
//                 {statuses.map((step,idx) => {
//                     const reached = idx <= statuses.indexOf(order.deliveryStatus)
//                     return (
//                         <div key={step} className='flex-1 flex-items-center'>
//                             <div
//                                 className={`
//                                     w-6 h-6 rounded-full ${reached ? "bg-blue-600" : "bg-gray-500"}`}
//                                     />
//                                     {idx !== statuses.length - 1 && (
//                                         <div
//                                             className={`flex-1 h-1 ${reached ? "bg-blue-600" : "bg-gray-500"}`}
//                                         />
//                                     )}
//                         </div>
//                     );
//                 })}
//             </div>
//         </div>

//     );
// };