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

export const Button: React.FC<ButtonProps> = ({
    onClick,
    children,
    icon,
    className,
    title,
    type = 'button',
    variant = 'default',
}) => {
    const isIconOnly = !children && !!icon;

    const base = 'transition font-lora rounded-xl shadow flex items-center justify-center gap-2';
    const withTextVariants = {
        default: 'bg-[#c2a774] text-[#2d422b] hover:bg-[#e5d9a5] text-[18px] px-4 py-2',
        danger: 'bg-[#7c2d2d] text-white hover:bg-[#a94444] text-[18px] px-4 py-2',
        outline: 'bg-transparent border border-[#c2a774] text-[#c2a774] hover:bg-[#2f3e29] px-4 py-2 text-[18px]',
        ghost: 'bg-transparent text-[#e5d9a5] hover:bg-[#2f3e29] px-3 py-1 text-[16px]',
    };

    const iconVariants = {
        default:
            'p-2 rounded-lg border border-[#c2a774] text-[#c2a774] hover:bg-[#c2a774] hover:text-[#223120]',
        danger:
            'p-2 rounded-lg border border-[#d76f6f] text-[#d76f6f] hover:bg-[#d76f6f] hover:text-white',
        outline: 'p-2 rounded-lg border border-[#c2a774] text-[#c2a774] hover:bg-[#3a4c3a]',
        ghost: 'p-2 text-[#e5d9a5] hover:bg-[#2f3e29]',
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