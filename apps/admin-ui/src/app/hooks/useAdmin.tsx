import {useQuery} from "@tanstack/react-query"
import axiosInstance from "../../utils/axiosInstance";

// Fetch admin data from API

const fetchAdmin = async () => {
    const response = await axiosInstance.get('/api/logged-in-admin');
    return response.data.admin;
};


const useAdmin = () => {
    const {
        data: admin, 
        isLoading, 
        isError, 
        refetch
    } = useQuery({
        queryKey: ["admin"],
        queryFn: fetchAdmin,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
    });
    return {admin,isLoading,isError,refetch};
};

export default useAdmin;