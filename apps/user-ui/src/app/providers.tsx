"use client";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import useUser from "../hooks/useUser";
import { WebSocketProvider } from "../context/web-socket-context";
const Providers = ({ children }: { children: React.ReactNode }) => {
    const [queryClient] = React.useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        refetchOnWindowFocus: false,
                        staleTime: 5 * 60 * 1000, // 5 minutes
                    },
                },
            })
    );
    return (
        <QueryClientProvider client={queryClient}>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 2000,
                    style: {
                        background: "#363636",
                        color: "#fff",
                    },
                    success: {
                        duration: 2000,
                        iconTheme: {
                            primary: "#4ade80",
                            secondary: "#fff",
                        },
                    },
                    error: {
                        duration: 2000,
                        iconTheme: {
                            primary: "#ef4444",
                            secondary: "#fff",
                        },
                    },
                }}
            />
            <ProvidersWithWebSocket>{children}</ProvidersWithWebSocket>
        </QueryClientProvider>
    );
};
const ProvidersWithWebSocket = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const { user,isLoading } = useUser();
    if (isLoading) return null;
    return (
        <>
            {user && <WebSocketProvider user={user}>{children}</WebSocketProvider>}
            {!user && children}
        </>
    );
};
export default Providers;
