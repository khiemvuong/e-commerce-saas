'use client';
import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useStore } from 'apps/user-ui/src/store';
import useUser from 'apps/user-ui/src/hooks/useUser';
import useLocationTracking from 'apps/user-ui/src/hooks/useLocationTracking';
import useDeviceTracking from 'apps/user-ui/src/hooks/useDeviceTracking';
import { toast } from 'react-hot-toast';

interface AddToCartButtonProps {
  product: any;
  variant?: 'default' | 'hover' | 'simple';
  className?: string;
  showIcon?: boolean;
  quantity?: number;
  selectedOption?: {
    color?: string;
    size?: string;
  };
  onClick?: (e: React.MouseEvent) => void;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  variant = 'default',
  className = '',
  showIcon = true,
  quantity = 1,
  selectedOption,
  onClick
}) => {
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const addToCart = useStore((state: any) => state.addToCart);
  const cart = useStore((state: any) => state.cart);
  const isInCart = cart.some((item: any) => item.id === product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const productToAdd = {
      ...product,
      quantity,
      ...(selectedOption && { selectedOption })
    };
    
    addToCart(productToAdd, user, location, deviceInfo);
    
    if (isInCart) {
      toast.success(`Added ${quantity} more to cart`);
    } else {
      toast.success('Item added to cart');
    }
    
    onClick?.(e);
  };

  // Variant styles
  const variants = {
    hover: "absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-black w-full text-white px-4 py-2 shadow-md hover:bg-gray-700 transition-all duration-300 translate-y-full group-hover:translate-y-0",
    
    default: "flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors duration-300",
    
    simple: "flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
  };

  return (
    <button
      onClick={handleAddToCart}
      className={`${variants[variant]} ${className}`}
    >
      {showIcon && <ShoppingBag size={18} />}
      <span>{isInCart ? 'Add More' : 'Add to Cart'}</span>
    </button>
  );
};

export default AddToCartButton;
