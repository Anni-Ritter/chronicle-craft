import React from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import classNames from 'classnames';

interface IFloatingAlertProps {
    type: 'success' | 'error';
    message: string;
    onClose?: () => void;
    className?: string;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const FloatingAlert: React.FC<IFloatingAlertProps> = ({
    type,
    message,
    onClose,
    className,
    position = 'top-right',
}) => {
    const icon = type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />;

    const positionClasses = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
    };
    return (
        <div
            className={classNames(
                'fixed z-50 flex items-start gap-3 max-w-sm w-full px-4 py-3 rounded-xl shadow-lg border font-lora animate-fade-in-up',
                type === 'success'
                    ? 'bg-[#1e2d1c] text-[#a7e3a1] border-[#4e9a5f]'
                    : 'bg-[#2e1a1a] text-[#f3a1a1] border-[#a94444]',
                positionClasses[position],
                className
            )}
        >
            <div className="mt-[2px]">{icon}</div>
            <div className="flex-1 text-sm">{message}</div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="text-inherit hover:text-[#c2a774]"
                    aria-label="Закрыть уведомление"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};
