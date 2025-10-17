import React from 'react'
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Plus } from 'lucide-react';
const defaultColors = [
    "#000000", //Black
    "#FFFFFF", //White
    "#FF0000",//Red
    "#00FF00", //Green
    "#0000FF",//Blue
    "#FFFF00",//Yellow
    "#FF00FF",//Magenta
    "#00FFFF",//Cyan
    ];



const ColorSelector = ({control, errors}:any) => {
    const [customColors, setCustomColors] = useState<string[]>([]);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [newColor, setNewColor] = useState("#000000");
    return (
        <div className="mt-2">
            <label className='block font-semibold text-gray-300 mb-1'>
                Colors
            </label>
            <Controller
                name='colors'
                control={control}
                render={({field}) => (
                        <div className="flex flex-wrap gap-2 border-white/20 border p-3 rounded-xl bg-gray-900">
                            {[...defaultColors, ...customColors].map((color) => {
                                const isSelected = field.value?.includes(color);
                                const isLightColor = ["#FFFFFF","#FFFF00","#00FFFF"].includes(color);
                                return (
                                    <button
                                        type='button'
                                        key={color}
                                        className={`w-7 h-7 p-2 rounded-md my-1 flex items-center  justify-center border-2 transition ${isSelected ? 'scale-110 border-white' : 'border-transparent'} ${isLightColor ? 'border-gray-600' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => {
                                            if (isSelected) {
                                                field.onChange(field.value.filter((c: string) => c !== color));
                                            } else {
                                                field.onChange([...field.value || [], color]);
                                            }
                                        }}
                                    />
                                );
                            })}

                            {/* Add Custom Color Button */}
                            <button
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            type="button" 
                            className='w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-500 bg-gray-800 hover:bg-gray-700 transition'>
                                <Plus size={16} color='white'/>
                            </button>
                            
                            {/* Color Picker Modal */}
                            {showColorPicker && (
                            <div className="relative flex item-center gap-2">
                                <input
                                    type="color"
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    className="w-10 h-10 p-0 border-0 cursor-pointer"
                                />
                                <button
                                    onClick={() => {
                                        setCustomColors([...customColors, newColor]);
                                        setShowColorPicker(false);
                                    }}
                                    type="button"
                                    className="px-3 py-1 bg-gray-700 text-white rounded-md  text-sm hover:bg-gray-500 transition">
                                    Add
                                </button>
                            </div>
                            )}
                        </div>
                )}
            />       
        </div>
    )
}

export default ColorSelector