import { CircleX } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }

        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, [isOpen]);
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed overflow-auto no-scrollbar inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 py-6 max-sm:px-0">
            <div className="relative bg-[#1a2218] border border-[#c2a774] rounded-2xl shadow-xl p-6 max-sm:p-2 w-full max-w-2xl animate-fade-in text-[#e5d9a5] font-serif">
                <button
                    onClick={onClose}
                    className="absolute top-0 right-0 md:top-3 md:right-3 px-3 py-1 text-[#c7bc98] hover:text-[#f1eac0] text-xl transition"
                    aria-label="Закрыть"
                >
                    <CircleX size={36} className="bg-[#1a2218] rounded-full" />
                </button>
                {children}
            </div>
        </div>,
        document.body
    );
};