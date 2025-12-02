'use client'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
const Providers = ({children}: {children: React.ReactNode}) => {
    const [queryClient] = React.useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                staleTime: 5 * 60 * 1000, // 5 minutes
            },
        },
    }));
return (
    <QueryClientProvider client={queryClient}>
        <Toaster 
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#363636',
                    color: '#fff',
                },
                success: {
                    duration: 4000,
                    iconTheme: {
                        primary: '#4ade80',
                        secondary: '#fff',
                    },
                },
                error: {
                    duration: 4000,
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                    },
                },
            }}
        />
        {children}
    </QueryClientProvider>
)
}

export default Providers