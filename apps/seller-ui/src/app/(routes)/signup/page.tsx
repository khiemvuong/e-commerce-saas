"use client";

import Link from 'next/link';
import React, {useState} from 'react'
import { useForm} from 'react-hook-form';
import { Eye, EyeOff} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { countries } from 'apps/seller-ui/src/utils/countries';
import CreateShop from 'apps/seller-ui/src/shared/modules/create-shop';
import StripeLogo from '../../../assets/svgs/stripe-logo';
import PageLoader from 'apps/seller-ui/src/shared/components/loading/page-loader';

const Signup = () => {
    const [activeStep, setActiveStep] = useState(1);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [showOtp, setShowOtp] = useState(false);
    const [canResend, setCanResend] = useState(true);
    const [timer, setTimer] = useState(60);
    const [otp,setOtp] = useState(["", "", "", ""]);
    const [sellerData, setSellerData] = useState<FormData | null>(null);
    const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
    const {register, handleSubmit, formState: {errors}} = useForm();
    const [sellerId, setSellerId] = useState("");
    const [isStripeLoading, setIsStripeLoading] = useState(false);
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
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/seller-registration`, data);
            return response.data;
        },
        onSuccess: (_, formData) => {
            setSellerData(formData);
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
            if (!sellerData) throw new Error("Seller data is missing");
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/verify-seller`, {
                ...sellerData,
                otp: otp.join(""),
            });
            return response.data;
        },
        onSuccess: (data) => {
            setSellerId(data?.seller?.id);
            setActiveStep(2);
        },
        onError: (error: any) => {
            console.error('OTP verification error:', error);
            console.error('Error response:', error?.response?.data);
            setServerError(error?.response?.data?.message || 'OTP verification failed');
        }
    });

    const onSubmit = async (data:any) => {
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
        if(sellerData){
            signupMutation.mutate(sellerData)
        }
    };

    const connectStripe = async () => {
        try {
            setIsStripeLoading(true);
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_SERVER_URL}/api/create-stripe-link`,
                { sellerId }
            );
            if (response.data.url) {
                window.location.href = response.data.url;
            }
            else{
                console.error("No URL returned from server");
            }
            setIsStripeLoading(false);
        } catch (error) {
            console.error("Stripe connection error:", error);
            setIsStripeLoading(false);
        }
    };

return (
    <div className="w-full flex flex-col items-center pt-10 min-h-screen">
        {/*<Stepper/>*/}
        <div className="relative flex items-center justify-between md:w-[50%] mb-8">
            <div className ="absolute top-[25%] left-0 w-[80%] md:w-[90%] h-1 bg-gray-300 -z-10"/>
            {[1,2,3].map((step) => (
                <div key={step}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                    ${step <=activeStep ? 'bg-black text-white' : 'bg-white text-gray-500 border border-gray-300'}`}
                    >
                        {step}
                    </div>
                    <span className ="ml-[15px] font-sans font-medium text-gray-700">
                    {step===1 ? "Create Account" : step===2 ? "Setup Shop" : "Connect Bank"}    
                    </span>
                </div>
            ))}
        </div>
        {/*Steps content */}
        <div className="md:w-[480px] p-8 ng-white shadow rounded-lg">
            {activeStep === 1 && (
                <>
                {!showOtp ? (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <h3 className ="text-2xl font-semibold text-center mb-4">
                            Create your account
                        </h3>
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
                            {String(errors.email.message)}
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
                            {String(errors.email.message)}
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
                        <label className="block text-gray-700 mb-1 mt-5">
                            Phone Number
                        </label>
                        <input type="tel"
                        placeholder="Enter your phone number"
                        className='w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1'
                        {...register("phone_number", {
                            required: "Phone number is required",
                            pattern: {
                                value: /^\+?[0-9]\d{1,14}$/,
                                message: "Invalid phone number format"
                            },
                            minLength: {
                                value: 10,
                                message: "Phone number must be at least 10 digits"
                            },
                            maxLength: {
                                value: 15,
                                message: "Phone number must be at most 15 digits"
                            }
                        })}
                    />
                    {errors.phone_number && (
                        <p className="text-red-500 text-sm mb-2">
                            {String(errors.phone_number.message)}
                        </p>
                    )}
                    <label className="block text-gray-700 mb-1 mt-5">
                            Country
                    </label>
                    <select className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1" {...register("country", { required: "Country is required" })}
                    defaultValue="US"
                    >
                        <option value="">Select your country</option>
                        {countries.map((country) => (
                            <option key={country.code} value={country.code}>{country.name}</option>
                        ))}
                    </select>
                    {errors.country && (
                        <p className="text-red-500 text-sm mb-2">
                            {String(errors.country.message)}
                        </p>
                    )}

                    </div>
                    <button type="submit"
                    disabled={signupMutation.isPending}
                    className="w-full p-2 bg-black text-white font-Roboto text-xl rounded-lg hover:bg-gray-600 transition mt-5">
                        {signupMutation.isPending ? "Signing Up..." : "Sign Up"}
                    </button>
                    {signupMutation.isError && 
                        signupMutation.error instanceof AxiosError && (
                            <p className="text-red-500 text-sm mt-2 text-center">
                                {signupMutation.error?.response?.data?.message || signupMutation.error.message}
                            </p>
                    )}
                    <p className="pt-3 text-center">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-500 font-semibold hover:underline">
                            Login
                        </Link>
                    </p>

                </form>
                ):(
                    <div>
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 justify-center py-3 rounded mb-4 text-center">
                            Please check your email for the verification code.
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
                                        className="w-12 h-12 border border-gray-300 text-center text-xl font-bold outline-none !rounded"
                                        ref={el => { if(el)inputRefs.current[index] = el }}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e.target.value, index)}
                                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                    />
                                ))
                            }
                        </div>
                        <button className="w-full mt-4 text-lg cursor-pointer bg-black text-white py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={verifyOtpMutation.isPending || otp.some(d => d === "")}
                        onClick={() => {
                            setServerError(null);
                            console.log('Current OTP:', otp.join(""));
                            console.log('Seller data:', sellerData);
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
                </>
            )}
            {activeStep === 2 && (             
                <CreateShop
                    sellerId={sellerId}
                    setActiveStep={setActiveStep}
                />
            )}
            {activeStep === 3 && (
                <div className="text-center rounded-lg">
                    <h3 className ="text-2xl font-bold mb-4">
                        Withdraw Method
                    </h3>
                    <br/>
                    <button
                    onClick={connectStripe}
                    className="w-full m-auto justify-center flex items-center gap-3 p-2 bg-black text-white font-Roboto text-lg hover:bg-gray-700 transition rounded-xl">
                        {isStripeLoading ? <PageLoader text="Connecting..." /> : (
                                <>
                                    Connect with <StripeLogo className="min-h-[40px] min-w-[80px]" />
                                </>
                        )}
                    </button>
                </div>
            )}

        </div>
    </div>
);
}

export default Signup;