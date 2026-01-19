"use client";
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

interface FilterSectionProps {
    title: string;
    count: number;
    searchPlaceholder: string;
    items: any[];
    selectedItems: string[];
    onToggle: (value: string) => void;
    getItemKey: (item: any) => string;
    getItemLabel: (item: any) => string;
}

const FilterSection: React.FC<FilterSectionProps> = ({
    title,
    count,
    searchPlaceholder,
    items,
    selectedItems,
    onToggle,
    getItemKey,
    getItemLabel
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = items.filter(item =>
        getItemLabel(item).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
            >
                <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{title}</h3>
                    {count > 0 && (
                        <span className="bg-black text-white text-xs font-medium px-2 py-0.5 rounded-full">
                            {count}
                        </span>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp size={18} className="text-gray-500" />
                ) : (
                    <ChevronDown size={18} className="text-gray-500" />
                )}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="px-4 pb-4">
                    {/* Search Box */}
                    {items.length > 5 && (
                        <div className="relative mb-3">
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-black transition"
                            />
                            <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                        </div>
                    )}

                    {/* Items List */}
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => {
                                const key = getItemKey(item);
                                const label = getItemLabel(item);
                                return (
                                    <label
                                        key={key}
                                        className="flex items-center cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded transition"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(key)}
                                            onChange={() => onToggle(key)}
                                            className="form-checkbox h-4 w-4 text-black border-gray-300 rounded focus:ring-0 focus:ring-offset-0"
                                        />
                                        <span className="ml-3 text-sm text-gray-700">{label}</span>
                                    </label>
                                );
                            })
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-3">No results found</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterSection;
