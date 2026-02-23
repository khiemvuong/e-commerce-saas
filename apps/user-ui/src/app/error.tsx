"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 font-Poppins">
                Something went wrong!
            </h2>
            <p className="mt-2 text-gray-500 max-w-md">
                We apologize for the inconvenience. Our team has been notified.
            </p>
            <div className="mt-8 flex gap-4">
                <button
                    onClick={() => reset()}
                    className="px-6 py-3 bg-[#C9A86C] text-white rounded-full font-medium hover:bg-[#B8956A] transition-colors"
                >
                    Try again
                </button>
                <Link
                    href="/"
                    className="px-6 py-3 border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
