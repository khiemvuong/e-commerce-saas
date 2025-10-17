"use client";

type FormData={
    name: string;
    email: string;
    password: string;
};
import Link from 'next/link';
import React, {useState} from 'react'
import { useRouter } from 'next/navigation';
import {useForm} from 'react-hook-form';
import GoogleButton from '../../../shared/components/google-button';
import { Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
const Signup = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [showOtp, setShowOtp] = useState(false);
    const [canResend, setCanResend] = useState(true);
    const [timer, setTimer] = useState(60);
    const [otp,setOtp] = useState(["", "", "", ""]);
    const [userData, setUserData] = useState<FormData | null>(null);
    const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
    const router = useRouter();
    const {register, handleSubmit, formState: {errors}} = useForm<FormData>();
    const startResendTimer = () => {
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 5) {
                    clearInterval(interval);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };
    const signupMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/user-registration`, data);
            return response.data;
        },  
        onSuccess: (data, formData) => {
            console.log('Signup successful:', data);
            setUserData(formData);
            setShowOtp(true);
            setCanResend(false);
            setTimer(60);
            startResendTimer();
            setServerError(null);
        },
        onError: (error: any) => {
            console.error('Signup error:', error);
            setServerError(error?.response?.data?.message || 'An error occurred during signup');
            setShowOtp(false);
        }
    });

    const verifyOtpMutation = useMutation({
        mutationFn: async () => {
            if (!userData) throw new Error("User data is missing");
            
            const otpCode = otp.join("");
            console.log('Verifying OTP with full data:', { 
                name: userData.name,
                email: userData.email, 
                password: userData.password,
                otp: otpCode 
            });
            
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/verify-user`, {
                name: userData.name,
                email: userData.email,
                password: userData.password,
                otp: otpCode,
            });
            return response.data;
        },
        onSuccess: (data) => {
            console.log('OTP verification successful:', data);
            router.push('/login');
        },
        onError: (error: any) => {
            console.error('OTP verification error:', error);
            console.error('Error response:', error?.response?.data);
            setServerError(error?.response?.data?.message || 'OTP verification failed');
        }
    });

    const onSubmit = async (data: FormData) => {
        console.log('Submitting signup data:', data);
        setServerError(null);
        signupMutation.mutate(data);
    };
    const handleOtpChange = (value: string, index: number) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if(value && index < inputRefs.current.length -1){
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if(e.key === "Backspace" && !otp[index] && index > 0){
            const newOtp = [...otp];
            newOtp[index - 1] = "";
            setOtp(newOtp);
            inputRefs.current[index - 1]?.focus();
        }
    };
    const resendOtp = () => {
        if(userData){
            signupMutation.mutate(userData)
        }
    };

return (
    <div className="w-full py-10 min-h-[80vh] bg-[f1f1f1]">
        <h1 className="text-4xl font-Poppins font-semibold text-black text-center">
            Sign Up
        </h1>
        <p className="text-center text-lg font-medium py-3 text-[#00000099]">
            Home . SignUp
        </p>
        <div className ="w-full flex justify-center">
            <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
                <h3 className ="text-3xl font-semibold text-center mb-2">
                    Sign Up to Ilan
                </h3>
                <p className="text-center text-gray-500 mb-4">
                    Already have an account?{" "}
                    <Link href={"/signup"} className="text-blue-500 font-bold hover:underline">
                        Sign in
                    </Link>
                </p>
                <GoogleButton />
                <div className="flex items-center my-5 text-gray-400 text-sm">
                    <div className="flex-1 border-t border-gray-300">
                    </div>
                    <span className="px-3">or Sign up with Email</span>
                    <div className="flex-1 border-t border-gray-300"> </div>
                </div>
                {!showOtp ? (
                    <form onSubmit={handleSubmit(onSubmit)}>
                    <label className="block text-gray-700 mb-1">
                        Name
                    </label>
                    <input 
                        type="text"
                        placeholder="Enter your name"
                        className="w-full p-2 border border-gray-300 outline-0"
                        {...register("name",{
                            required: "Name is required",
                            
                        })}
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm mb-2">
                            {errors.email.message}
                        </p>
                    )}
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
                    <button type="submit"
                    disabled={signupMutation.isPending}
                    className="w-full p-2 bg-black text-white font-Roboto text-xl rounded-lg hover:bg-gray-600 transition mt-5">
                        {signupMutation.isPending ? "Signing Up..." : "Sign Up"}
                    </button>

                </form>
                ):(
                    <div>
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                            ✅Please check your email for the verification code.
                        </div>
                        <h3 className="text-xl font-semibold text-center mb-4">
                        Enter the 4-digit code sent to your email
                        </h3>
                        <div className="flex justify-center gap-2 mb-4">
                            {
                                otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        maxLength={1}
                                        className="w-12 h-12 border border-gray-300 text-center outline-none !rounded"
                                        ref={el => { if(el)inputRefs.current[index] = el }}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e.target.value, index)}
                                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                    />
                                ))
                            }
                        </div>
                        <button className="w-full mt-4 text-lg cursor-pointer bg-blue-500 text-white py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={verifyOtpMutation.isPending || otp.some(d => d === "")}
                        onClick={() => {
                            setServerError(null);
                            console.log('Current OTP:', otp.join(""));
                            console.log('User data:', userData);
                            verifyOtpMutation.mutate();
                        }}
                        >
                            {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
                        </button>
                        <p className="text-center text-sm mt-4">
                            {canResend ? (
                                <button onClick={resendOtp} className="text-blue-500 font-semibold hover:underline cursor-pointer">
                                    Resend Otp
                                </button>
                                ) : (
                                    `Resend code in ${timer} seconds`
                                )}
                        </p>
                        {verifyOtpMutation.isError && !serverError && (
                            <p className="text-red-500 text-sm mt-2 text-center">
                                {verifyOtpMutation.error instanceof AxiosError 
                                    ? verifyOtpMutation.error?.response?.data?.message || 'OTP verification failed'
                                    : 'An error occurred during OTP verification'
                                }
                            </p>
                        )}

                    </div>
                )}
            </div>
        </div>
    </div>
);
}

export default Signup;