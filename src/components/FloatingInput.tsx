import React, { useId, useState, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
    label,
    error,
    className,
    type = 'text',
    ...props
}) => {
    const id = useId();
    const hasValue = !!props.value || !!props.defaultValue;
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';
    const actualType = isPassword && showPassword ? 'text' : type;
    return (
        <div className="relative w-full">
            <input
                id={id}
                {...props}
                type={actualType}
                readOnly={props.readOnly}
                placeholder=" "
                className={clsx(
                    'peer w-full border rounded px-3 pt-4 pb-3 bg-[#0e1b12] text-[#d6c5a2] max-sm:text-sm',
                    'focus:outline-none focus:ring-1 focus:ring-[#d6c5a2] focus:border-[#c2a774]',
                    error ? 'border-red-500' : 'border-[#c2a774]',
                    props.readOnly && 'opacity-80 cursor-default',
                    className
                )}
            />
            <label
                htmlFor={id}
                className={clsx(
                    'absolute left-3 text-sm transition-all pointer-events-none',
                    'peer-placeholder-shown:top-[15px] peer-placeholder-shown:bg-transparent peer-placeholder-shown:px-1 peer-placeholder-shown:text-sm',
                    'peer-focus:top-[-10px] peer-focus:text-xs peer-focus:px-2 peer-focus:bg-[#0e1b12] peer-focus:border peer-focus:border-[#c2a774] peer-focus:rounded-lg',
                    hasValue
                        ? 'top-[-10px] px-2 bg-[#0e1b12] border border-[#c2a774] rounded-lg text-xs'
                        : 'top-2.5',
                    'text-[#d6c5a2]'
                )}
            >
                {label}
            </label>
            {isPassword && !props.readOnly && (
                <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c2a774] hover:text-[#e5d9a5]"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            )}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};
