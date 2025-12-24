import axios from "axios";
import { runRedirectToLogin } from "./redirect";

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
    withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

//Handle logout and prevent infinite loop
const handleLogout = () => {
    const publicPath = ["/login", "signup", "forgot-password"];
    const currentPath = window.location.pathname;
    if (!publicPath.includes(currentPath)) {
        runRedirectToLogin();
    }
};

//Handle adding a new access token to queued requests
const subcribeTokenRefresh = (callback: () => void) => {
    refreshSubscribers.push(callback);
};


//Execute queued requests after refresh
const onRefreshSuccess = () => {
    refreshSubscribers.forEach(callback => callback());
    refreshSubscribers = [];
};

//Handle API requests
axiosInstance.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
);

//Handle expired access token
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const is401 = error.response?.status === 401;
        const isRetry = originalRequest._retry;
        
        // Only attempt refresh for 401 errors and non-retried requests
        if (is401 && !isRetry) {
            if (isRefreshing) {
                return new Promise((resolve) => {
                    subcribeTokenRefresh(() =>
                        resolve(axiosInstance(originalRequest)));
                });
            }
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/refresh-token`, {},
                    { withCredentials: true }
                );

                isRefreshing = false;
                onRefreshSuccess();

                return axiosInstance(originalRequest);
            } catch (error) {
                isRefreshing = false;
                refreshSubscribers = [];
                handleLogout();
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    });

export default axiosInstance;