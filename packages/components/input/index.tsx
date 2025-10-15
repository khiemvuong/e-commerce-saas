import { forwardRef } from "react";
import React from "react";
interface BaseProps {
    label?: string;
    type?: "text" | "email" | "password" | "number" | "textarea";
    className?: string;
}
type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>;
type Props = InputProps | TextareaProps;

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
    ({
        label, type="text",className, ...props},ref) => {
            return (
                <div className="w-full">
                    {label && (
                        <label className="block mb-1 text-lg font-semibold text-gray-300">
                            {label}
                        </label>
                    )}

                    {type === "textarea" ? (
                        <textarea
                            ref={ref as React.Ref<HTMLTextAreaElement>}
                            className={`w-full px-4 py-2 bg-[#1e1e1e] border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-gray-200 ${className}`}
                            {...(props as TextareaProps)}
                        />
                    ) : (
                        <input
                            ref={ref as React.Ref<HTMLInputElement>}
                            type={type}
                            className={`w-full px-4 py-2 bg-[#1e1e1e] border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-gray-200 ${className}`}
                            {...(props as InputProps)}
                        />
                    )}
                </div>
            )

        }
);

Input.displayName = "Input";

export default Input;