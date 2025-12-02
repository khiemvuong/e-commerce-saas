import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useUser from "./useUser";


const useRequiredAuth = () => {
    const router = useRouter();
    const {user, isLoading} = useUser();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/login");
        }
    }, [user, isLoading, router]);
    return {user, isLoading};
};

export default useRequiredAuth;