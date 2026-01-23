'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Input from 'packages/components/input';
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form';
import axios, {AxiosError} from 'axios';
import PageLoader from '../shared/components/loading/page-loader';
import Link from 'next/link';

type FormData = {
  email: string;
  password: string;
}

const fetchAdmin = async () => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/logged-in-admin`, {
      withCredentials: true
    });
    return response.data.admin;
  } catch (error) {
    return null;
  }
};

const Page = () => {
  const {register, handleSubmit} = useForm<FormData>();
  const [serverError,setServerError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');

  const { data: admin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['admin'],
    queryFn: fetchAdmin,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!isAdminLoading && admin) {
      router.replace('/dashboard');
    }
  }, [admin, isAdminLoading, router]);

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/login-admin`, 
        data, 
        {withCredentials: true}
      );
      return response.data;
    },
    onSuccess: (data) => {
      setServerError(null);
      
      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        setRequires2FA(true);
        setAdminId(data.adminId);
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      router.push('/dashboard');
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?:string})?.message ||
        "Invalid crendentials";
      setServerError(errorMessage);
    }
  });

  const verify2FAMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/login/verify-2fa`,
        {
          adminId,
          totpCode: code,
        },
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      setServerError(null);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      router.push('/dashboard');
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as { message?: string })?.message || "Invalid 2FA code!";
      setServerError(errorMessage);
    }
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data);
  }

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length === 6) {
      verify2FAMutation.mutate(totpCode);
    }
  }

  // Show loading if checking auth
  if (isAdminLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-900">
        <PageLoader text="Checking authentication..." />
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (admin) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-900">
        <PageLoader text="Redirecting..." />
      </div>
    );
  }

  // Render 2FA verification form if needed
  if (requires2FA) {
    return (
      <div className='w-full h-screen flex items-center justify-center bg-slate-900'>
        <div className="md:w-[450px] w-full pb-8 bg-slate-800 rounded-md shadow">
          <form className='p-5' onSubmit={handle2FASubmit}>
            <h1 className='text-3xl pb-3 pt-4 font-semibold text-center text-white font-Poppins'>
              Two-Factor <br/> Authentication
            </h1>
            <p className="text-center text-slate-400 mb-4">
              Enter the 6-digit code from your authenticator app
            </p>
            <div className="mt-3">
              <label className="block text-slate-300 mb-1">Verification Code</label>
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-center text-2xl tracking-widest outline-none focus:border-blue-500"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <button
              type="submit"
              disabled={!isMounted || verify2FAMutation.isPending || totpCode.length !== 6}
              className="w-full mt-4 text-xl flex justify-center font-semibold font-Poppins cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {verify2FAMutation.isPending ? (
                <PageLoader text="Verifying..." />
              ) : (
                'Verify'
              )}
            </button>
            {serverError && (
              <p className='mt-3 text-red-400 text-center'>{serverError}</p>
            )}
            <button
              type="button"
              onClick={() => {
                setRequires2FA(false);
                setAdminId(null);
                setTotpCode('');
                setServerError(null);
              }}
              className="w-full mt-2 text-slate-400 hover:text-white transition"
            >
              Back to login
            </button>
          </form>
        </div>
      </div>
    );
  }
  return (
    <div className='w-full h-screen flex items-center justify-center'>
      <div className="md:w-[450px] w-full pb-8 bg-slate-800 rounded-md shadow">
        <form className='p-5' onSubmit={handleSubmit(onSubmit)} method="POST">
          <h1 className='text-3xl pb-3 pt-4 font-semibold text-center text-white font-Poppins'>
            Welcome, <br/> Admin
          </h1>
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            {...register('email', { 
              required: "Email is required" ,
              pattern: { 
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
                message: "Invalid email address" 
              },
            })}
          />
          <div className='mt-3'>
            <Input
              label="Password"
              type="password"
              placeholder="******"
              {...register('password', {
                required: "Password is required" 
              })}
            />
          </div>
          <div className="flex justify-end mt-2">
            <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm hover:underline transition">
              Forgot Password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={!isMounted || loginMutation.isPending}
            className="w-full mt-4 text-xl flex justify-center font-semibold font-Poppins cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            {loginMutation.isPending ? (
              <PageLoader text="Logging in..." />
            ) : (
              'Login'
            )}
          </button>
          {serverError && (
            <p className='mt-3 text-red-500 text-center'>{serverError}</p>
          )}
        </form>
      </div>
    </div>
  )
}

export default Page