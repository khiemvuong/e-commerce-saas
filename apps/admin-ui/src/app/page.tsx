'use client';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Input from 'packages/components/input';
import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import axios, {AxiosError} from 'axios';
import OverlayLoader from '../shared/components/loading/overlay-loader';
type FormData = {
  email: string;
  password: string;
}
const Page = () => {
  const {register, handleSubmit} = useForm<FormData>();
  const [serverError,setServerError] = useState<string | null>(null);
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/login-admin`, 
        data, 
        {withCredentials: true}
      );
      return response.data;
    },
    onSuccess: () => {
      setServerError(null);
      router.push('/dashboard');
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?:string})?.message ||
        "Invalid crendentials";
      setServerError(errorMessage);
    }
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data);
  }
  return (
    <div className='w-full h-screen flex items-center justify-center'>
      <div className="md:w-[450px] w-full pb-8 bg-slate-800 rounded-md shadow">
        <form className='p-5' onSubmit={handleSubmit(onSubmit)}>
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
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full mt-5 text-xl flex justify-center font-semibold font-Poppins cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            {loginMutation.isPending ? (
              OverlayLoader({ text: "Logging in..." })
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