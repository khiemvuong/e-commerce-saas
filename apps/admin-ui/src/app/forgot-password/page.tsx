"use client";

import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { AxiosError } from "axios";
import axiosInstance from "../../utils/axiosInstance";
import { useMutation } from "@tanstack/react-query";

type EmailForm = { email: string };
type ResetForm = { password: string };

const RESEND_SECONDS = 60;

const ForgotPassword = () => {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  // Email form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailForm>();

  // Reset form
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors },
  } = useForm<ResetForm>();

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
    setServerError(null); 
    if (step === "otp") inputRefs.current[0]?.focus();
  }, [step]);

  const sanitizedEmail = (email: string) => email.trim().toLowerCase();
  const getOtpString = () => otp.join("").replace(/\D/g, "");

  const requestOtpMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const e = sanitizedEmail(email);
      const response = await axiosInstance.post(
        `/api/forgot-password-user`,
        { email: e }
      );
      return response.data;
    },
    onSuccess: (_data, { email }) => {
      setUserEmail(sanitizedEmail(email));
      setOtp(["", "", "", ""]);
      setStep("otp");
      startResendTimer();
    },
    onError: (error: AxiosError) => {
      const msg =
        (error.response?.data as { message?: string })?.message ||
        "An error occurred while requesting OTP!";
      setServerError(msg);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userEmail) throw new Error("User email is not set");
      const code = getOtpString();
      const response = await axiosInstance.post(
        `/api/verify-forgot-password-user`,
        { email: userEmail, otp: code }
      );
      return response.data;
    },
    onSuccess: () => {
      clearTimer();
      setStep("reset");
    },
    onError: (error: AxiosError) => {
      const msg =
        (error.response?.data as { message?: string })?.message ||
        "An error occurred while verifying OTP!";
      setServerError(msg);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      const code = getOtpString();
      const response = await axiosInstance.post(
        `/api/reset-password-user`,
        { email: userEmail, otp: code, newPassword: password }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Password reset successful! Please login with your new password.");
      setStep("email");
      router.push("/");
    },
    onError: (error: AxiosError) => {
      const msg =
        (error.response?.data as { message?: string })?.message ||
        "An error occurred while resetting password!";
      setServerError(msg);
    },
  });

  // OTP inputs
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
      verifyOtpMutation.mutate();
    }
  };

  // Submit handlers
  const onSubmitEmail = ({ email }: EmailForm) => {
    setServerError(null);
    requestOtpMutation.mutate({ email });
  };

  const onSubmitPassword = ({ password }: ResetForm) => {
    setServerError(null);
    resetPasswordMutation.mutate({ password });
  };

  return (
    <div className="w-full py-10 min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white">
          Forgot Password
        </h1>
        <p className="text-lg font-medium py-3 text-slate-400">
          Admin Portal
        </p>
      </div>

      <div className="w-full max-w-md px-4">
        <div className="p-8 bg-slate-800/50 backdrop-blur-sm shadow-2xl rounded-2xl border border-slate-700">
          {step === "email" && (
            <>
              <h3 className="text-2xl font-semibold text-center mb-2 text-white">
                Reset your password
              </h3>
              <p className="text-center text-slate-400 mb-6">
                Go back to{" "}
                <Link href={"/"} className="text-blue-400 font-bold hover:underline">
                  Login
                </Link>
              </p>

              <form
                method="post"
                action=""
                noValidate
                onSubmit={handleSubmitEmail(onSubmitEmail)}
              >
                <label className="block text-slate-300 mb-1 font-medium">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition placeholder-slate-500"
                  autoComplete="email"
                  {...registerEmail("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  onChange={() => setServerError(null)}
                />
                {emailErrors.email && (
                  <p className="text-red-400 text-sm mt-1">{emailErrors.email.message}</p>
                )}

                <button
                  type="submit"
                  disabled={requestOtpMutation.isPending}
                  className="w-full p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg rounded-lg hover:from-blue-700 hover:to-purple-700 transition mt-5 disabled:opacity-60 shadow-lg"
                >
                  {requestOtpMutation.isPending ? "Sending OTP..." : "Send Reset Code"}
                </button>

                {serverError && (
                  <p className="text-red-400 text-sm mt-3 text-center">{serverError}</p>
                )}
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <h3 className="text-xl font-semibold text-center mb-4 text-white">
                Enter the 4-digit code sent to your email
              </h3>

              <div className="flex justify-center gap-3 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    className="w-14 h-14 bg-slate-700/50 border-2 border-slate-600 text-center text-xl font-bold text-white outline-none rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    ref={(el) => {
                      if (el) inputRefs.current[index] = el;
                    }}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className="w-full text-lg cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
                  disabled={verifyOtpMutation.isPending || otp.some((d) => d === "")}
                  onClick={() => verifyOtpMutation.mutate()}
                >
                  {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
                </button>

                <p className="text-center text-sm text-slate-400">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!userEmail) return;
                        setServerError(null);
                        setOtp(["", "", "", ""]);
                        requestOtpMutation.mutate({ email: userEmail });
                      }}
                      className="text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <span>Resend in {timer}s</span>
                  )}
                </p>
              </div>

              {serverError && (
                <p className="text-red-400 text-sm mt-3 text-center">{serverError}</p>
              )}
            </>
          )}

          {step === "reset" && (
            <>
              <h3 className="text-2xl font-semibold text-center mb-4 text-white">
                Reset Your Password
              </h3>
              <form
                method="post"
                action=""
                noValidate
                onSubmit={handleSubmitReset(onSubmitPassword)}
              >
                <label className="block text-slate-300 mb-1 font-medium">New Password</label>
                <input
                  type="password"
                  placeholder="Enter your new password"
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition placeholder-slate-500"
                  autoComplete="new-password"
                  {...registerReset("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters long",
                    },
                  })}
                  onChange={() => setServerError(null)}
                />
                {resetErrors.password && (
                  <p className="text-red-400 text-sm mt-1">
                    {String(resetErrors.password.message)}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="w-full mt-5 text-lg cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-60 transition shadow-lg"
                >
                  {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                </button>
                {serverError && (
                  <p className="text-red-400 text-sm mt-3 text-center">{serverError}</p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
