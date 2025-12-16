import React, { useEffect } from 'react'
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import {    Plus, X } from 'lucide-react';
import Input from '../input';

const CustomProperties = ({ control, errors }:any) => {
    const[properties,setProperties] = useState<{label:string,value:string[]}[]>([]);
    const[newValues,setNewValues] = useState<Record<number, string>>({});
    const[newLabel,setNewLabel] = useState("");
    return (
        <div>
            <div className="flex flex-col gap-3">
                <Controller
                    name={`custom_properties`}
                    control={control}
                    render={({ field }) => {
                        // Initialize state from field value on mount
                        useEffect(() => {
                            if (field.value && Array.isArray(field.value) && properties.length === 0) {
                                setProperties(field.value);
                            }
                        }, [field.value]);

                        // Sync state changes to form
                        useEffect(() => {
                            if (properties.length > 0) {
                                field.onChange(properties);
                            }
                        }, [properties]);

                        const addProperty = () => {
                            if (!newLabel.trim()) return;
                                setProperties([...properties, { label: newLabel, value: [] }]);
                                setNewLabel("");
                            };
                        const addValue = (index: number) => {
                            const val = newValues[index];
                            if (!val || !val.trim()) return;
                            const updatedProperties = [...properties];
                            updatedProperties[index].value.push(val);
                            setProperties(updatedProperties);
                            setNewValues({ ...newValues, [index]: "" });
                        };
                        const removeProperty = (index: number) => {
                            setProperties(properties.filter((_, i) => i !== index));
                        }
                        return( 
                            <div className="mt-2">
                                <label className="block font-semibold text-gray-300 mb-1">
                                    Custom Properties
                                </label>
                                <div className="flex flex-col gap-3">
                                    {properties.map((property, index) => (
                                    <div key={index} className="border-gray-700 p-3 rounded-lg bg-gray-900">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white font-medium ">
                                                {property.label}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeProperty(index)}
                                                className=" p-1 rounded-md hover:bg-gray-700 transition "
                                            >
                                                <X size={20} className="text-red-500 "/>
                                            </button>
                                        </div>
                                        {/* Add Value to Property */}
                                        <div className="flex item-center mt-2 gap-2">
                                            <input
                                                type="text"
                                                className="border outlint-none border-gray-700 bg-gray-800 p-2 rounded-md text-white w-full"
                                                placeholder="Enter value"
                                                value={newValues[index] || ""}
                                                onChange={(e) => setNewValues({ ...newValues, [index]: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                className="px-3 py-1 bg-blue-500 text-white rounded-md"
                                                onClick={() => addValue(index)}
                                            >
                                                Add
                                            </button>
                                        </div>

                                        {/* Display Values */}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {property.value.map((value, i) => (
                                                <span key={i}
                                                    className="text-sm text-white bg-gray-700 rounded-md px-2 py-1"
                                                >
                                                    {value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    ))}
                                    {/* Add New Property */}
                                    <div className="flex item-center gap-2 mt-1">
                                        <Input
                                            placeholder='e.g. , Material, Warranty'
                                            value={newLabel}
                                            onChange={(e:any)=>setNewLabel(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="flex item-center gap-1 px-4 py-2  bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
                                            onClick={addProperty}
                                        >
                                            <Plus size={20} />Add
                                        </button>
                                    </div>
                                </div>
                                {
                                    errors.custom_properties && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.custom_properties.message as string}
                                        </p>
                                    )
                                }
                            </div>
                        );
                    }}
                />
            </div>
        </div>
    )
}
export default CustomProperties