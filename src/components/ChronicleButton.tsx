import { type ReactNode } from 'react';
import classNames from 'classnames';
import { twMerge } from 'tailwind-merge';

interface ButtonProps {
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    children?: ReactNode;
    icon?: ReactNode;
    className?: string;
    title?: string;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'default' | 'danger' | 'outline' | 'ghost';
}

export const Button = ({
    onClick,
    children,
    icon,
    className,
    title,
    type = 'button',
    variant = 'default',
}: ButtonProps) => {
    const isIconOnly = !children && !!icon;

    const base =
        'transition font-lora rounded-xl shadow flex items-center justify-center gap-2 touch-manipulation select-none active:opacity-90 max-lg:active:scale-[0.98] lg:active:scale-100';
    const withTextVariants = {
        default:
            'bg-[#c2a774] text-[#2d422b] hover:bg-[#e5d9a5] text-[15px] px-3.5 py-1.5 min-h-10 rounded-[12px]',
        danger:
            'bg-[#7c2d2d] text-white hover:bg-[#a94444] text-[15px] px-3.5 py-1.5 min-h-10 rounded-[12px]',
        outline:
            'bg-transparent border border-[#c2a774] text-[#c2a774] hover:bg-[#2f3e29] px-3.5 py-1.5 text-[15px] min-h-10 rounded-[12px]',
        ghost:
            'bg-transparent text-[#e5d9a5] hover:bg-[#2f3e29] px-3 py-1 text-[16px] max-lg:min-h-[48px] max-lg:px-4 max-lg:rounded-[14px]',
    };

    const iconVariants = {
        default:
            'min-h-11 min-w-11 p-0 rounded-xl border border-[#c2a774] text-[#c2a774] hover:bg-[#c2a774] hover:text-[#223120] lg:min-h-0 lg:min-w-0 lg:p-2 lg:rounded-lg',
        danger:
            'min-h-11 min-w-11 p-0 rounded-xl border border-[#d76f6f] text-[#d76f6f] hover:bg-[#d76f6f] hover:text-white lg:min-h-0 lg:min-w-0 lg:p-2 lg:rounded-lg',
        outline:
            'min-h-11 min-w-11 p-0 rounded-xl border border-[#c2a774] text-[#c2a774] hover:bg-[#3a4c3a] lg:min-h-0 lg:min-w-0 lg:p-2 lg:rounded-lg',
        ghost:
            'min-h-11 min-w-11 p-0 rounded-xl text-[#e5d9a5] hover:bg-[#2f3e29] lg:min-h-0 lg:min-w-0 lg:p-2 lg:rounded-lg',
    };

    return (
        <button
            type={type}
            title={title}
            onClick={onClick}
            className={twMerge(classNames(
                base,
                isIconOnly ? iconVariants[variant] : withTextVariants[variant],
                className
            ))}
        >
            {icon}
            {children && <span>{children}</span>}
        </button>
    );
};