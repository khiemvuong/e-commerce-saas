'use client';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import { CheckCircle, AlertCircle } from 'lucide-react';

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

    const onSubmit = async (data: any) => {
        setError("");
        setMessage("");
        try {
            await axiosInstance.post('/api/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword,
            });
            setMessage("Password changed successfully.");
            reset();
        } catch (error: any) {
            setError(error?.response?.data?.message || "Failed to change password. Please try again.");
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            </form>
        </div>
    )
}

export default ChangePassword