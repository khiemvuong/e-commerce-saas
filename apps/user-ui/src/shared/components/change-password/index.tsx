'use client';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import React, { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form';
import { CheckCircle, AlertCircle, Mail, Lock } from 'lucide-react';

const RESEND_SECONDS = 60;

const ChangePassword = () => {
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm();

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [step, setStep] = useState<"request" | "otp" | "change">("request");
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [canResend, setCanResend] = useState(true);
    const [timer, setTimer] = useState(RESEND_SECONDS);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const [isRequestingOtp, setIsRequestingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startResendTimer = () => {
        clearTimer();
        setCanResend(false);
        setTimer(RESEND_SECONDS);
        timerRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearTimer();
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => () => clearTimer(), []);
    useEffect(() => {
        setError("");
        if (step === "otp") inputRefs.current[0]?.focus();
    }, [step]);

    const getOtpString = () => otp.join("").replace(/\D/g, "");

    // Step 1: Request OTP for password change
    const requestOtp = async () => {
        setError("");
        setIsRequestingOtp(true);
        try {
            await axiosInstance.post('/api/user/change-password/request-otp');
            setOtp(["", "", "", ""]);
            setStep("otp");
            startResendTimer();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to send OTP. Please try again.");
        } finally {
            setIsRequestingOtp(false);
        }
    };

    // Step 2: Verify OTP
    const verifyOtp = async () => {
        const code = getOtpString();
        if (code.length !== 4) {
            setError("Please enter the complete 4-digit OTP");
            return;
        }
        setError("");
        setIsVerifyingOtp(true);
        try {
            await axiosInstance.post('/api/user/change-password/verify-otp', { otp: code });
            clearTimer();
            setStep("change");
        } catch (err: any) {
            setError(err?.response?.data?.message || "Invalid OTP. Please try again.");
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    // Step 3: Change password (with OTP)
    const onSubmit = async (data: any) => {
        setError("");
        setMessage("");
        try {
            const code = getOtpString();
            await axiosInstance.post('/api/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword,
                otp: code,
            });
            setMessage("Password changed successfully.");
            reset();
            setStep("request");
            setOtp(["", "", "", ""]);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to change password. Please try again.");
        }
    };

    // OTP input handlers
    const handleOtpChange = (value: string, index: number) => {
        if (!/^[0-9]?$/.test(value)) return;
        const next = [...otp];
        next[index] = value;
        setOtp(next);
        if (value && index < inputRefs.current.length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace") {
            if (otp[index]) {
                const next = [...otp];
                next[index] = "";
                setOtp(next);
            } else if (index > 0) {
                inputRefs.current[index - 1]?.focus();
                const next = [...otp];
                next[index - 1] = "";
                setOtp(next);
            }
        }
        if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
        if (e.key === "ArrowRight" && index < inputRefs.current.length - 1)
            inputRefs.current[index + 1]?.focus();
        if (e.key === "Enter" && otp.every((d) => d !== "")) {
            e.preventDefault();
            verifyOtp();
        }
    };

    const newPassword = watch("newPassword");

    return (
        <div className="max-w-md space-y-6">
            {/* Success Message */}
            {message && (
                <div className="flex items-center gap-2 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                    <CheckCircle size={20} />
                    <p className="text-sm font-medium">{message}</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Step 1: Request OTP */}
            {step === "request" && (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-900">Security Verification Required</h4>
                                <p className="text-sm text-blue-700 mt-1">
                                    For your security, we need to verify your identity before changing your password. 
                                    Click the button below to receive a verification code via email.
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={requestOtp}
                        disabled={isRequestingOtp}
                        className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                    >
                        <Lock size={18} />
                        {isRequestingOtp ? "Sending OTP..." : "Send Verification Code"}
                    </button>
                </div>
            )}

            {/* Step 2: Enter OTP */}
            {step === "otp" && (
                <div className="space-y-4">
                    <div className="text-center">
                        <h4 className="text-lg font-semibold text-gray-900">Enter Verification Code</h4>
                        <p className="text-sm text-gray-600 mt-1">
                            We've sent a 4-digit code to your email address
                        </p>
                    </div>

                    <div className="flex justify-center gap-3 my-6">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength={1}
                                className="w-14 h-14 border-2 border-gray-300 text-center text-xl font-bold outline-none rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                                ref={(el) => {
                                    if (el) inputRefs.current[index] = el;
                                }}
                                value={digit}
                                onChange={(e) => handleOtpChange(e.target.value, index)}
                                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={verifyOtp}
                        disabled={isVerifyingOtp || otp.some((d) => d === "")}
                        className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                    </button>

                    <p className="text-center text-sm text-gray-600">
                        {canResend ? (
                            <button
                                type="button"
                                onClick={requestOtp}
                                disabled={isRequestingOtp}
                                className="text-blue-600 font-semibold hover:underline cursor-pointer"
                            >
                                Resend OTP
                            </button>
                        ) : (
                            <span>Resend in {timer}s</span>
                        )}
                    </p>
                </div>
            )}

            {/* Step 3: Change Password Form */}
            {step === "change" && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-green-700 text-center font-medium">
                            ✓ Identity verified! You can now change your password.
                        </p>
                    </div>

                    {/* Current Password */}
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                id="currentPassword"
                                type="password"
                                {...register("currentPassword", { 
                                    required: "Current password is required",
                                    minLength: {
                                        value: 6,
                                        message: "Password must be at least 6 characters"
                                    }
                                })}
                                className="form-input w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter current password"
                            />
                        </div>
                        {errors.currentPassword?.message && (
                            <p className="text-red-600 text-xs mt-1">
                                {String(errors.currentPassword.message)}
                            </p>
                        )}
                    </div>

                    {/* New Password */}
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                id="newPassword"
                                type="password"
                                {...register("newPassword", { 
                                    required: "New password is required",
                                    minLength: {
                                        value: 6,
                                        message: "Password must be at least 6 characters"
                                    },
                                })}
                                className="form-input w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter new password"
                            />
                        </div>
                        {errors.newPassword?.message && (
                            <p className="text-red-600 text-xs mt-1">
                                {String(errors.newPassword.message)}
                            </p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                            Must be at least 6 characters
                        </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                type="password"
                                {...register("confirmPassword", { 
                                    required: "Please confirm your password",
                                    validate: (value) => value === newPassword || "Passwords do not match"
                                })}
                                className="form-input w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Confirm new password"
                            />
                        </div>
                        {errors.confirmPassword?.message && (
                            <p className="text-red-600 text-xs mt-1">
                                {String(errors.confirmPassword.message)}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {isSubmitting ? "Changing Password..." : "Change Password"}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setStep("request");
                            setOtp(["", "", "", ""]);
                            reset();
                        }}
                        className="w-full text-gray-600 hover:text-gray-900 text-sm"
                    >
                        Cancel
                    </button>
                </form>
            )}
        </div>
    )
}

export default ChangePassword