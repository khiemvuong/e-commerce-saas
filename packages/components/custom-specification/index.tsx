import React from 'react'
import { Controller, useFieldArray } from 'react-hook-form';
import Input from '../input';
import {  PlusCircle, Trash } from 'lucide-react';

const CustomSpecifications = ({ control, errors }:any) => {
    const { fields,append,remove } = useFieldArray({
        control,
        name: 'custom_specifications'
    });
    return (
        <div>
            <label className="block font-semibold text-gray-300 mb-1">
                Custom Specifications
            </label>
            <div className="flex flex-col gap-3">
                {fields?.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                        <Controller
                            name={`custom_specifications.${index}.name`}
                            control={control}
                            rules={{required:"Specifications name is required"}}
                            render={({ field }) =>(
                                <Input
                                    label={`Specification ${index + 1}`}
                                    placeholder='e.g. , Size, Weight, Material, etc'
                                    className='mb-0'
                                    {...field}
                                />
                            )
                        }
                        />
                        <Controller
                            name={`custom_specifications.${index}.value`}
                            control={control}
                            rules={{required:"Specifications value is required"}}
                            render={({ field }) =>(
                                <Input
                                    label="Value"
                                    placeholder='e.g. , 15 inch, 1.5kg, Cotton, etc'
                                    className='mb-0'
                                    {...field}
                                />
                            )
                        }
                        />
                        <button 
                        type="button" 
                        onClick={() => remove(index)} 
                        className="text-red-500 hover:text-red-700 mt-6">
                            <Trash size={20} />
                        </button>
                    </div>
                ))}
                <button 
                type="button" 
                onClick={() => append({name:'',value:''})} 
                className=" flex item-center gap-2 mt-2 px-4 py-4  bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition">
                    <PlusCircle size={25} /> Add Specification
                </button>
                {errors.custom_specifications && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.custom_specifications.message as string}
                    </p>
                )}
            </div>
        </div>
    )
}

export default CustomSpecifications