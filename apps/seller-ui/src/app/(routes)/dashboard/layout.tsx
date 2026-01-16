'use client';

import SidebarWrapper from 'apps/seller-ui/src/shared/components/sidebar/sidebar'
import AuthGuard from 'apps/seller-ui/src/shared/components/guards/auth-guard'
import DashboardSkeleton from 'apps/seller-ui/src/shared/components/loading/dashboard-skeleton'
import React from 'react'

const Layout = ({ children }:{children: React.ReactNode}) => {
return (
    <AuthGuard fallback={<DashboardSkeleton />}>
        <div className='flex h-full bg-black min-h-screen'>
            {/* Sidebar */}
            <aside className ="w-[280px] min-w-[250px] max-w-[300px] border-r border-r-slate-800 text-white p-4">
                <div className="sticky top-0">
                    <SidebarWrapper/>
                </div>
            </aside>
            
            {/* Main Content */}
            <main className="flex-1 p-4">
                {children}
            </main>

        </div>
    </AuthGuard>
)
}

export default Layout