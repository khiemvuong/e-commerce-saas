'use client';
import useSeller from 'apps/seller-ui/src/hooks/useSeller';
import PageLoader from 'apps/seller-ui/src/shared/components/loading/page-loader';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'
import { toast } from 'react-hot-toast';

const page = () => {
    const route = useRouter();
    const {seller,  isLoading: isSellerLoading} = useSeller();
    useEffect(() => {
        if (!isSellerLoading && !seller) {
          toast.error("Please login to continue");
          route.push("/login");
        }
      }, [seller, isSellerLoading, route]);
      
    return (
        isSellerLoading ? <PageLoader /> : <></>

    )
}

export default page