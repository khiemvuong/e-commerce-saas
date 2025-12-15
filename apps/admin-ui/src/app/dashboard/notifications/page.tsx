import BreadCrumbs from 'apps/admin-ui/src/shared/components/breadcrums'
import React from 'react'

const Notifications = () => {
  return (
    <div className="w-full min-h-screen p-8">
        <BreadCrumbs title="Notifications"/>
        <p className='text-center pt-24 text-white text-sm font-Poppins'>
            No Notifications available yet!
        </p>
    </div>
    );
};

export default Notifications