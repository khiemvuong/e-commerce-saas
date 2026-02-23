"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
                    <h2 className="text-2xl font-semibold text-gray-800 font-Poppins">
                        A critical error occurred
                    </h2>
                    <p className="mt-2 text-gray-500">
                        {error.message || "Please try refreshing the page."}
                    </p>
                    <button
                        onClick={() => reset()}
                        className="mt-8 px-6 py-3 bg-[#C9A86C] text-white rounded-full font-medium"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
