'use client';

import { usePathname } from 'next/navigation';

/**
 * HeaderSpacer Component
 * 
 * Adds top spacing to account for the fixed header.
 * - On homepage (/): No spacer needed (has fullscreen hero)
 * - On other pages: Adds padding to prevent content being hidden behind header
 */
const HeaderSpacer = () => {
    const pathname = usePathname();
    
    // Don't add spacer on homepage (has fullscreen hero that accounts for header)
    if (pathname === '/') {
        return null;
    }
    
    // Add spacer for all other pages
    // Header height is h-20 (80px) when scrolled/on inner pages
    return <div className="h-20 md:h-24" />;
};

export default HeaderSpacer;
