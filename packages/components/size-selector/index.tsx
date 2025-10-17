import { Controller } from "react-hook-form";
const sizes=["XS","S","M","L","XL","XXL","3XL","4XL","5XL"];


const SizeSelector = ({
    control,
    errors,
}:any) => {
    return (
        <div className="mt-2">
            <label className="block font-semibold text-gray-300 mb-1">Sizes</label>
            <Controller
                name="sizes"
                control={control}
                render={({field})=>(
                    <div className="flex gap-2 flex-wrap">
                        {sizes.map((size)=>{
                            const isSelected=(field.value||[]).includes(size);
                            return(
                                <button
                                    type="button"
                                    key={size}
                                    onClick={()=>
                                        field.onChange(
                                            isSelected
                                            ? (field.value||[]).filter((s:string)=>s!==size)
                                            : [...(field.value||[]),size]
                                        )
                                    }
                                    className={`px-3 py-1 border rounded-full text-sm font-medium
                                        ${isSelected
                                            ? 'bg-gray-700 text-white '
                                            : 'text-gray-300 bg-gray-800 border border-[#ffffff6b]'
                                        }`}
                                    >
                                    {size}

                                </button>
                            )
                        })}
                    </div>
                )}
            />
        </div>
    )
};

export default SizeSelector;
