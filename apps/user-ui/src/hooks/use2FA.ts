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
    hasBackupCodes: boolean;
}

// API functions
const get2FAStatus = async (): Promise<TwoFAStatus> => {
    const response = await axiosInstance.get('/api/user/2fa/status');
    return response.data;
};

const enable2FA = async (): Promise<Enable2FAResponse> => {
    const response = await axiosInstance.post('/api/user/2fa/enable');
    return response.data;
};

const verify2FA = async (totpCode: string): Promise<Verify2FAResponse> => {
    const response = await axiosInstance.post('/api/user/2fa/verify', { totpCode });
    return response.data;
};

const disable2FA = async (password: string): Promise<Disable2FAResponse> => {
    const response = await axiosInstance.post('/api/user/2fa/disable', { password });
    return response.data;
};

// Verify 2FA during login
const verifyLoginWith2FA = async (data: { userId: string; totpCode: string }) => {
    const response = await axiosInstance.post('/api/user/login/verify-2fa', data);
    return response.data;
};

// Change password OTP functions
const requestChangePasswordOtp = async () => {
    const response = await axiosInstance.post('/api/user/change-password/request-otp');
    return response.data;
};

const verifyChangePasswordOtp = async (otp: string) => {
    const response = await axiosInstance.post('/api/user/change-password/verify-otp', { otp });
    return response.data;
};

// Hooks
export const use2FAStatus = () => {
    return useQuery({
        queryKey: ['user-2fa-status'],
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
            queryClient.invalidateQueries({ queryKey: ['user-2fa-status'] });
        },
    });
};

export const useVerify2FA = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: verify2FA,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-2fa-status'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
};

export const useDisable2FA = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: disable2FA,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-2fa-status'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
};

export const useVerifyLoginWith2FA = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: verifyLoginWith2FA,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
};

// Change password OTP hooks
export const useRequestChangePasswordOtp = () => {
    return useMutation({
        mutationFn: requestChangePasswordOtp,
    });
};

export const useVerifyChangePasswordOtp = () => {
    return useMutation({
        mutationFn: verifyChangePasswordOtp,
    });
};
