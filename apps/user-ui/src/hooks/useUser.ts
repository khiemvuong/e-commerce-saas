import React from "react";
import { useQuery } from "@tanstack/react-query"
import axiosInstance from "../utils/axiosInstance"
import { useAuthStore } from "../store/authStore";

// Fetch user data from API
const fetchUser = async () => {
    try {
        const response = await axiosInstance.get('/api/logged-in-user');
        return response.data.user;
    } catch (error) {
        return null;
    }
};


const useUser = () => {
    const { setLoggedIn, isLoggedIn } = useAuthStore();
    const { data: user, isPending, isError } = useQuery({
        queryKey: ["user"],
        queryFn: fetchUser,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
        refetchOnWindowFocus: false,
    });
    
    // Update login state when data changes
    React.useEffect(() => {
        if (user) {
            setLoggedIn(true);
        } else if (!isPending && !user) {
            setLoggedIn(false);
        }
    }, [user, isPending, setLoggedIn]);
    
    return { user: user as any, isLoading: isPending, isError };
};

export default useUser;