import React from 'react'

const Layout = ({ children }:{children: React.ReactNode}) => {
return (
    <div className='flex h-full bg-black min-h-screen'>
        {/* Main Content */}
        <main className="flex-1 p-4">
            {children}
        </main>

    </div>
)
}

export default Layout