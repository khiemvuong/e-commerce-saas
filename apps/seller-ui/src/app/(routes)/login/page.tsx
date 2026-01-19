"use client";

type FormData={
    email: string;
    password: string;
};
import Link from 'next/link';
import React, {useState, useEffect} from 'react'
import { useRouter } from 'next/navigation';
import {useForm} from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import axios, {  AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageLoader from 'apps/seller-ui/src/shared/components/loading/page-loader';
import useSeller from 'apps/seller-ui/src/hooks/useSeller';

const Login = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();
    const {seller, isLoading: isSellerLoading} = useSeller();
    const {register, handleSubmit, formState: {errors}} = useForm<FormData>();

    // Redirect if already logged in
    useEffect(() => {
        if (!isSellerLoading && seller) {
            router.replace('/');
        }
    }, [seller, isSellerLoading, router]);

    const loginMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/login-seller`, data, {
                withCredentials: true,
            });
            return response.data;
        },
        onSuccess: (data) => {
            console.log("Login successful:", data);
            setServerError(null);
            // Invalidate seller query to force refetch with new session
            queryClient.invalidateQueries({ queryKey: ['seller'] });
            router.push("/");
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || "Invalid credentials!";
            setServerError(errorMessage);
        }
    });

    const onSubmit = async (data: FormData) => {
        loginMutation.mutate(data);
    }

    // Show loading if checking auth
    if (isSellerLoading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[f1f1f1]">
                <PageLoader text="Checking authentication..." />
            </div>
        );
    }

    // Don't render login form if already authenticated
    if (seller) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[f1f1f1]">
                <PageLoader text="Redirecting..." />
            </div>
        );
    }
return (
    <div className="w-full py-10 min-h-screen bg-[f1f1f1]">
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
                        {loginMutation.isPending ? <PageLoader text="Logging in..." /> : "Login"}
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