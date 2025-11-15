import React from 'react'

const QuickActionCard = ({Icon,title,description}:any) => {
  return (
    <div className="flex bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow items-start gap-4">
        <Icon className="w-6 h-6 text-blue-500 mt-1"/>
        <div className="div">
            <h4 className='text-sm text-gray-800 mb-1 font-semibold'>
                {title}
            </h4>
            <p className='text-xs text-gray-500'>
                {description}
            </p>
        </div>
    </div>
  )
}

export default QuickActionCard