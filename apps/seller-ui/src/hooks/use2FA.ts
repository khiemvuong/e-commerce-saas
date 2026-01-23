import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../utils/axiosInstance';

// Types
export interface Enable2FAResponse {
    success: boolean;
    message: string;
    secret: string;
    qrCodeUri: string;
    backupCodes: string[];
}

export interface Verify2FAResponse {
    success: boolean;
    message: string;
}

export interface Disable2FAResponse {
    success: boolean;
    message: string;
}

export interface TwoFAStatus {
    enabled: boolean;
}

// API functions
const get2FAStatus = async (): Promise<TwoFAStatus> => {
    const response = await axiosInstance.get('/api/2fa/status');
    return response.data;
};

const enable2FA = async (): Promise<Enable2FAResponse> => {
    const response = await axiosInstance.post('/api/2fa/enable');
    return response.data;
};

const verify2FA = async (code: string): Promise<Verify2FAResponse> => {
    const response = await axiosInstance.post('/api/2fa/verify', { code });
    return response.data;
};

const disable2FA = async (password: string): Promise<Disable2FAResponse> => {
    const response = await axiosInstance.post('/api/2fa/disable', { password });
    return response.data;
};

// Hooks
export const use2FAStatus = () => {
    return useQuery({
        queryKey: ['2fa-status'],
        queryFn: get2FAStatus,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false,
    });
};

export const useEnable2FA = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: enable2FA,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
        },
    });
};

export const useVerify2FA = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: verify2FA,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
            queryClient.invalidateQueries({ queryKey: ['seller'] });
        },
    });
};

export const useDisable2FA = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: disable2FA,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
            queryClient.invalidateQueries({ queryKey: ['seller'] });
        },
    });
};
