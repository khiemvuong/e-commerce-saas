import {useQuery} from "@tanstack/react-query"
import axiosInstance from "../utils/axiosInstance";
import { API_CONFIG } from "../utils/apiConfig";

// Fetch seller data from API

const fetchSeller = async () => {
    try {
        const response = await axiosInstance.get('/api/logged-in-seller');
        return response.data.seller;
    } catch (error) {
        return null;
    }
};


const useSeller = () => {
    const {data: seller, isPending, isError, refetch} = useQuery({
        queryKey: ["seller"],
        queryFn: fetchSeller,
        staleTime: API_CONFIG.STALE_TIME.STATIC,
        gcTime: API_CONFIG.GC_TIME.DEFAULT,
        retry: false,
        refetchOnWindowFocus: false,
    });
    return {seller: seller as any, isLoading: isPending, isError, refetch};
};

export default useSeller;