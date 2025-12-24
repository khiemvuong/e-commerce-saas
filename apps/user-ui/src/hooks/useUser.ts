import React from "react";
import { useQuery } from "@tanstack/react-query"
import axiosInstance from "../utils/axiosInstance"
import { useAuthStore } from "../store/authStore";
import { isProtected } from "../utils/protected";

// Fetch user data from API
const fetchUser = async () => {
    const response = await axiosInstance.get('/api/logged-in-user', isProtected);
    return response.data.user;
};


const useUser = () => {
    const { setLoggedIn, isLoggedIn } = useAuthStore();
    const { data: user, isPending, isError } = useQuery({
        queryKey: ["user"],
        queryFn: fetchUser,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
    });
    
    // Update login state when data changes
    React.useEffect(() => {
        if (user) {
            setLoggedIn(true);
        } else if (isError) {
            setLoggedIn(false);
        }
    }, [user, isError, setLoggedIn]);
    
    return { user: user as any, isLoading: isPending, isError };
};

export default useUser;