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
    selectedOptions?: Record<string, any>;
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
const useStore = create<Store>()(
    persist(
        (set,get) => ({
            cart: [],
            wishlist: [],

            //Add to cart
            addToCart: (product,user,location,deviceInfo) => {
                console.log('🛒 Adding to cart:', {
                    productId: product.id,
                    title: product.title,
                    selectedOptions: product.selectedOptions,
                    quantity: product.quantity
                });

                // Sanitize product data to save localStorage space
                // Remove large fields like descriptions that are not needed in cart
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { detailed_description, short_description, ...productToSave } = product as any;

                set((state) => {
                    const existing=state.cart?.find((item) => 
                        item.id === productToSave.id && 
                        JSON.stringify(item.selectedOptions) === JSON.stringify(productToSave.selectedOptions)
                    );
                    if(existing){
                        return {
                            cart: state.cart.map((item) =>
                                item.id === productToSave.id && JSON.stringify(item.selectedOptions) === JSON.stringify(productToSave.selectedOptions)
                                    ? {...item, quantity: (item.quantity || 0) + (productToSave.quantity || 1)} 
                                    : item
                            )
                        };
                    }
                    // Generate a unique cartId for the new item
                    const cartId = `${productToSave.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    return {
                        cart: [...state.cart, {...productToSave, cartId, quantity: productToSave.quantity || 1, selectedOptions: productToSave.selectedOptions || {}}]
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
            removeFromCart: (cartId,user,location,deviceInfo) => {
                // Find item by cartId if available, otherwise fallback to id (for backward compatibility)
                const removeProduct= get().cart.find((item: any) => item.cartId === cartId || item.id === cartId);
                
                set((state) => ({
                    cart: state.cart?.filter((item: any) => 
                        item.cartId ? item.cartId !== cartId : item.id !== cartId
                    )
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
                // Sanitize product data to save localStorage space
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { detailed_description, short_description, ...productToSave } = product as any;
                
                set((state) => {
                    if(state.wishlist.find((item) => item.id === productToSave.id)){
                        return state;
                    }
                    return ({
                    wishlist: [...state.wishlist, productToSave]
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
export {useStore};