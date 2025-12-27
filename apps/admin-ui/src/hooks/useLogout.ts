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
            await axiosInstance.post('/api/logout-admin');
            
            // Clear all cached queries
            queryClient.clear();
            
            // Redirect to login (admin login is at root /)
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
            // Even if API fails, clear cache and redirect
            queryClient.clear();
            router.push('/');
        } finally {
            setIsLoggingOut(false);
        }
    };

    return { logout, isLoggingOut };
};

export default useLogout;
