import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface ShopCategory {
    value: string;
    label: string;
}

interface Country {
    code: string;
    name: string;
}

interface SiteConfig {
    categories: string[];
    subCategories: Record<string, string[]>;
    shopCategories: ShopCategory[];
    countries: Country[];
    images: any[];
}

export const useSiteConfig = () => {
    return useQuery<SiteConfig>({
        queryKey: ['siteConfig'],
        queryFn: async () => {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/admin/api/get-all-customizations`);
            return response.data;
        },
        staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    });
};
