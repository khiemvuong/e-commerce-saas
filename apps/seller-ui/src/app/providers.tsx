"use client";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import useSeller from "../hooks/useSeller";
import { WebSocketProvider } from "../context/web-socket-context";
const Providers = ({ children }: { children: React.ReactNode }) => {
    const [queryClient] = React.useState(() => new QueryClient());
    return (
        <QueryClientProvider client={queryClient}>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: "#363636",
                        color: "#fff",
                    },
                    success: {
                        duration: 4000,
                        iconTheme: {
                            primary: "#4ade80",
                            secondary: "#fff",
                        },
                    },
                    error: {
                        duration: 4000,
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
    const { seller, isLoading } = useSeller();
    if (isLoading) return null;
    return (
        <>
            {seller && (
                <WebSocketProvider seller={seller}>{children}</WebSocketProvider>
            )}
            {!seller && children}
        </>
    );
};

export default Providers;
