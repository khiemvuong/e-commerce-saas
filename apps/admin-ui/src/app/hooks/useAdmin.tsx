import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../utils/axiosInstance";
import { API_CONFIG } from "../../utils/apiConfig";

// Fetch admin data from API
const fetchAdmin = async () => {
    try {
        const response = await axiosInstance.get('/api/logged-in-admin');
        return response.data.admin;
    } catch (error) {
        return null;
    }
};

const useAdmin = () => {
    const { data: admin, isPending, isError, refetch } = useQuery({
        queryKey: ["admin"],
        queryFn: fetchAdmin,
        staleTime: API_CONFIG.STALE_TIME.STATIC,
        gcTime: API_CONFIG.GC_TIME.DEFAULT,
        retry: false,
        refetchOnWindowFocus: false,
    });
    return { admin: admin as any, isLoading: isPending, isError, refetch };
};

export default useAdmin;