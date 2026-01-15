import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../utils/axiosInstance';
import { useState } from 'react';

export const useLogout = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const logout = async () => {
        try {
            setIsLoggingOut(true);
            
            // Call logout API
            await axiosInstance.post('/api/logout-seller');
            
            // Clear all cached queries
            queryClient.clear();
            
            // Redirect to login
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Even if API fails, clear cache and redirect
            queryClient.clear();
            router.push('/login');
        } finally {
            setIsLoggingOut(false);
        }
    };

    return { logout, isLoggingOut };
};

export default useLogout;
