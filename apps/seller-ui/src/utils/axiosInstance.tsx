import axios from "axios";

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
    withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

//Handle logout and prevent infinite loop
const handleLogout = () => {
    if (window.location.pathname !== "/login") {
        window.location.href = "/login"; // Redirect to login page
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

        //prevent infinite loop
        if (error.response?.status === 401 && !originalRequest._retry) {
            if(isRefreshing) {
            return new Promise((resolve) => {
                subcribeTokenRefresh(() => {
                    resolve(axiosInstance(originalRequest));
                });
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