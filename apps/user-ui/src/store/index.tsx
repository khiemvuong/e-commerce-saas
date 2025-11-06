import {create} from 'zustand';
import { persist } from 'zustand/middleware';
import { sendKafkaEvent } from '../actions/track-user';

type Product={
    id: string;
    title: string;
    price: number;
    image:string;
    quantity?: number;
    shopId: string;
}
type Store={
    cart: Product[];
    wishlist: Product[];
    addToCart: (
        product: Product,
        user:any,
        location:any,
        deviceInfo:any,
    ) => void;
    removeFromCart: (
        id: string,
        user:any,
        location:any,
        deviceInfo:any,
    ) => void;
    addToWishlist: (
        product: Product,
        user:any,
        location:any,
        deviceInfo:any,
    ) => void;
    removeFromWishlist: (
        id: string,
        user:any,
        location:any,
        deviceInfo:any,
    ) => void;
    clearWishlist: () => void;
    clearCart: () => void;
    
}
export const useStore = create<Store>()(
    persist(
        (set,get) => ({
            cart: [],
            wishlist: [],

            //Add to cart
            addToCart: (product,user,location,deviceInfo) => {
                set((state) => {
                    const existing=state.cart?.find((item) => item.id === product.id);
                    if(existing){
                        return {
                            cart: state.cart.map((item) =>
                                item.id === product.id ? {...item, quantity: (item.quantity || 0) + 1} : item
                            )
                        };
                    }
                    return {
                        cart: [...state.cart, {...product, quantity: 1}]
                    };
                });
                // Send kafka event
                if(user?.id && location && deviceInfo){
                    sendKafkaEvent({
                        userId: user?.id,
                        productId: product?.id,
                        shopId: product?.shopId,
                        action: 'add_to_cart',
                        device: deviceInfo || "Unknown Device",
                        country: location?.country || "Unknown",
                        city: location?.city || "Unknown",
                    });
                }
            },
            removeFromCart: (id,user,location,deviceInfo) => {
                const removeProduct= get().cart.find((item) => item.id === id);
                set((state) => ({
                    cart: state.cart?.filter((item) => item.id !== id)
                }));
                 // Send kafka event
                if(user?.id && location && deviceInfo && removeProduct){
                    sendKafkaEvent({
                        userId: user?.id,
                        productId: removeProduct?.id,
                        shopId: removeProduct?.shopId,
                        action: 'remove_from_cart',
                        device: deviceInfo || "Unknown Device",
                        country: location?.country || "Unknown",
                        city: location?.city || "Unknown",
                    });
                }
            },
            addToWishlist: (product,user,location,deviceInfo) => {

                set((state) => {
                    if(state.wishlist.find((item) => item.id === product.id)){
                        return state;
                    }
                    return ({
                    wishlist: [...state.wishlist, product]
                    });
                });
                // Send kafka event
                if(user?.id && location && deviceInfo){
                    sendKafkaEvent({
                        userId: user?.id,
                        productId: product?.id,
                        shopId: product?.shopId,
                        action: 'add_to_wishlist',
                        device: deviceInfo || "Unknown Device",
                        country: location?.country || "Unknown",
                        city: location?.city || "Unknown",
                    });
                }
            },
            removeFromWishlist: (id,user,location,deviceInfo) => {
                const removeProduct= get().wishlist.find((item) => item.id === id);
                set((state) => ({
                    wishlist: state.wishlist.filter((item) => item.id !== id)
                }));
                // Send kafka event
                if(user?.id && location && deviceInfo && removeProduct){
                    sendKafkaEvent({
                        userId: user?.id,
                        productId: removeProduct?.id,
                        shopId: removeProduct?.shopId,
                        action: 'remove_from_wishlist',
                        device: deviceInfo || "Unknown Device",
                        country: location?.country || "Unknown",
                        city: location?.city || "Unknown",
                    });
                }
            },
            clearWishlist: () => {
                set({
                    wishlist: []
                });
                localStorage.removeItem('store-storage');
            },
            clearCart: () => {
                set({
                    cart: []
                });
                localStorage.removeItem('store-storage');
            },
            
        }),
        {
            name: 'store-storage', // name of the item in the storage (must be unique)
        }
    )
);