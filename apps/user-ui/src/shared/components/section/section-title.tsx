import React from 'react'

const SectionTitle = ({title}:{title:string}) => {
  return (
    <div className="relative">
        <h2 className="text-xl md:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white">
            {title}
        </h2>
         <div className={`mt-3 h-1 rounded-full w-48 bg-gradient-to-r from-indigo-500 to-pink-500`} />

    </div>
  )
}

export default SectionTitle