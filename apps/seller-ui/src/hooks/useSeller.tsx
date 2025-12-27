import {useQuery} from "@tanstack/react-query"
import axiosInstance from "../utils/axiosInstance";

// Fetch seller data from API

const fetchSeller = async () => {
    const response = await axiosInstance.get('/api/logged-in-seller');
    return response.data.seller;
};


const useSeller = () => {
    const {data: seller, isLoading, isError, refetch} = useQuery({
        queryKey: ["seller"],
        queryFn: fetchSeller,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 0, // Changed from 1 to 0 - let axios handle retries
        refetchOnWindowFocus: false, // Prevent unnecessary refetches
        retryOnMount: false,
    });
    return {seller,isLoading,isError,refetch};
};

export default useSeller;