import React from 'react'

const StatCard = ({title,count,Icon}:any) => {
  return (
    <div className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col">
            <h3 className="text-lg font-medium text-gray-700">{title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{count}</p>
        </div>
        <Icon className="ml-auto text-gray-400 w-10 h-10"/>
    </div>
  )
}

export default StatCard