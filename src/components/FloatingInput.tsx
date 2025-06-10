import React, { useId, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
    label,
    error,
    className,
    ...props
}) => {
    const id = useId();
    const hasValue = !!props.value || !!props.defaultValue;

    return (
        <div className="relative w-full">
            <input
                id={id}
                {...props}
                placeholder=" "
                className={clsx(
                    'peer w-full border rounded px-3 pt-5 pb-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                    error ? 'border-red-500' : 'border-gray-300',
                    className
                )}
            />
            <label
                htmlFor={id}
                className={clsx(
                    'absolute left-3 text-gray-500 text-sm transition-all pointer-events-none',
                    'peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm',
                    'peer-focus:top-[-8px] peer-focus:text-xs peer-focus:text-indigo-500',
                    hasValue ? 'top-[-8px] bg-white rounded-full px-2 py-[2px] text-xs' : 'top-2.5'
                )}
            >
                {label}
            </label>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};
