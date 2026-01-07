import {useQuery} from "@tanstack/react-query"
import axiosInstance from "../utils/axiosInstance";

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
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
        refetchOnWindowFocus: false,
    });
    return {seller: seller as any, isLoading: isPending, isError, refetch};
};

export default useSeller;