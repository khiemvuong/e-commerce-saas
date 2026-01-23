"use client";

type FormData={
    email: string;
    password: string;
};
import Link from 'next/link';
import React, {useState, useEffect} from 'react'
import { useRouter } from 'next/navigation';
import {useForm} from 'react-hook-form';
import GoogleButton from '../../../shared/components/google-button';
import { Eye, EyeOff } from 'lucide-react';
import  {  AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import useUser from 'apps/user-ui/src/hooks/useUser';
import PageLoader from 'apps/user-ui/src/shared/components/loading/page-loader';

const Login = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);
    const [requires2FA, setRequires2FA] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [totpCode, setTotpCode] = useState('');
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user, isLoading: isUserLoading } = useUser();
    const {register, handleSubmit, formState: {errors}} = useForm<FormData>();

    // Redirect if already logged in
    useEffect(() => {
        if (!isUserLoading && user) {
            router.replace('/');
        }
    }, [user, isUserLoading, router]);

    const loginMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const response = await axiosInstance.post(`/api/login-user`, data, {
                withCredentials: true,
            });
            return response.data;
        },
        onSuccess: async (data) => {
            console.log("Login successful:", data);
            setServerError(null);
            
            // Check if 2FA is required
            if (data.requiresTwoFactor) {
                setRequires2FA(true);
                setUserId(data.userId);
                return;
            }
            
            await queryClient.invalidateQueries({ queryKey: ['user'] });
            router.push("/");
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || "Invalid credentials!";
            setServerError(errorMessage);
        }
    });

    const verify2FAMutation = useMutation({
        mutationFn: async (code: string) => {
            const response = await axiosInstance.post(
                `/api/user/login/verify-2fa`,
                {
                    userId,
                    totpCode: code,
                },
                {
                    withCredentials: true,
                }
            );
            return response.data;
        },
        onSuccess: async (data) => {
            console.log("2FA verification successful:", data);
            setServerError(null);
            await queryClient.invalidateQueries({ queryKey: ['user'] });
            router.push("/");
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || "Invalid 2FA code!";
            setServerError(errorMessage);
        }
    });

    const onSubmit = async (data: FormData) => {
        loginMutation.mutate(data);
    }

    const handle2FASubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (totpCode.length === 6) {
            verify2FAMutation.mutate(totpCode);
        }
    }

    // Show loading if checking auth
    if (isUserLoading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[f1f1f1]">
                <PageLoader text="Checking authentication..." />
            </div>
        );
    }

    // Don't render login form if already authenticated
    if (user) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[f1f1f1]">
                <PageLoader text="Redirecting..." />
            </div>
        );
    }

    // Render 2FA verification form if needed
    if (requires2FA) {
        return (
            <div className="w-full py-10 min-h-screen bg-[f1f1f1]">
                <h1 className="text-4xl font-Poppins font-semibold text-black text-center">
                    Two-Factor Authentication
                </h1>
                <p className="text-center text-lg font-medium py-3 text-[#00000099]">
                    Enter the 6-digit code from your authenticator app
                </p>
                <div className="w-full flex justify-center">
                    <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
                        <form onSubmit={handle2FASubmit}>
                            <label className="block text-gray-700 mb-1">
                                Verification Code
                            </label>
                            <input
                                type="text"
                                placeholder="000000"
                                maxLength={6}
                                className="w-full p-2 border border-gray-300 outline-0 text-center text-2xl tracking-widest"
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                            />
                            <button
                                type="submit"
                                disabled={verify2FAMutation.isPending || totpCode.length !== 6}
                                className="w-full p-2 mt-4 bg-black text-white font-Roboto text-xl rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400"
                            >
                                {verify2FAMutation.isPending ? "Verifying..." : "Verify"}
                            </button>
                            {serverError && (
                                <p className="text-red-500 text-sm mt-2">
                                    {serverError}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setRequires2FA(false);
                                    setUserId(null);
                                    setTotpCode('');
                                    setServerError(null);
                                }}
                                className="w-full p-2 mt-2 text-gray-600 hover:text-black transition"
                            >
                                Back to login
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
return (
    <div className="w-full py-10 min-h-[80vh] bg-[f1f1f1]">
        <h1 className="text-4xl font-Poppins font-semibold text-black text-center">
            Login
        </h1>
        <p className="text-center text-lg font-medium py-3 text-[#00000099]">
            Home . Login
        </p>
        <div className ="w-full flex justify-center">
            <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
                <h3 className ="text-3xl font-semibold text-center mb-2">
                    Login to Ilan
                </h3>
                <p className="text-center text-gray-500 mb-4">
                    Don't have an account?{" "}
                    <Link href={"/signup"} className="text-blue-500 font-bold hover:underline">
                        Sign up
                    </Link>
                </p>
                <GoogleButton />
                <div className="flex items-center my-5 text-gray-400 text-sm">
                    <div className="flex-1 border-t border-gray-300">
                    </div>
                    <span className="px-3">or Sign in with Email</span>
                    <div className="flex-1 border-t border-gray-300"> </div>
                </div>
                <form method="post" action="" onSubmit={handleSubmit(onSubmit)}>
                    <label className="block text-gray-700 mb-1">
                        Email
                    </label>
                    <input 
                        type="email"
                        placeholder="Enter your email"
                        className="w-full p-2 border border-gray-300 outline-0"
                        {...register("email",{
                            required: "Email is required",
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Invalid email address"
                        },
                        })}
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm mb-2">
                            {errors.email.message}
                        </p>
                    )}
                    <label className="block text-gray-700 mb-1 mt-5">
                        Passwords
                    </label>
                    <div className="relative">
                        <input
                            type={passwordVisible ? "text" : "password"}
                            placeholder="Enter your password"
                            className="w-full p-2 border border-gray-300 outline-0"
                            {...register("password", {
                                required: "Password is required",
                                minLength: {
                                    value: 6,
                                    message: "Password must be at least 6 characters"
                                },
                            })}
                        />
                        <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-2 top-2 text-gray-600">
                            {passwordVisible ? <Eye/> : <EyeOff/>}
                        </button>
                        {errors.password && (
                            <p className="text-red-500 text-sm mb-2">
                                {String(errors.password.message)}
                            </p>
                        )}
                        
                    </div>
                    <div className="flex justify-between items-center my-4">
                            <label className="flex items-center text-gray-600">
                                <input type="checkbox" className="mr-2" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                                Remember me
                            </label>
                            <Link href="/forgot-password" className="text-blue-500 hover:underline text-sm">
                                Forgot Password?
                            </Link>
                    </div>
                    <button type="submit" disabled={loginMutation.isPending} className="w-full p-2 bg-black text-white font-Roboto text-xl rounded-lg hover:bg-gray-00 transition">
                        {loginMutation.isPending ? "Logging in..." : "Login"}
                    </button>
                    {serverError && (
                        <p className="text-red-500 text-sm mt-2">
                            {serverError}
                        </p>
                    )}
                </form>
            </div>

        </div>
    </div>
)
}

export default Login;