"use client";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
            <h1 className="text-7xl font-bold text-gray-200 font-Poppins">404</h1>
            <h2 className="mt-4 text-2xl font-semibold text-gray-800 font-Poppins">
                Page Not Found
            </h2>
            <p className="mt-2 text-gray-500 max-w-md">
                Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Link
                href="/"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-[#C9A86C] text-white rounded-full font-medium hover:bg-[#B8956A] transition-colors"
            >
                Back to Home
            </Link>
        </div>
    );
}
