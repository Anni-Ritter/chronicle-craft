import { CircleX } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }

        return () => {
            document.body.classList.remove("overflow-hidden");
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 sm:px-6"
            role="dialog"
            aria-modal="true"
        >
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto no-scrollbar rounded-3xl border border-[#3a4a34] bg-[#050806]/95  shadow-[0_0_55px_#000]  p-4 sm:p-6 md:p-8 text-[#e5d9a5] font-lora animate-[fadeIn_0.18s_ease-out]">

                <div className="pointer-events-none absolute -top-16 -right-10 w-40 h-40 
        rounded-full bg-[#c2a7741f] blur-3xl" />

                <button
                    onClick={onClose}
                    className="absolute z-20 top-3 right-3 flex items-center justify-center rounded-full bg-[#111712]/90 border border-[#3a4a34] text-[#c7bc98] hover:text-[#f1eac0] hover:border-[#c2a774aa] transition focus:outline-none"
                    aria-label="Закрыть"
                >
                    <CircleX size={22} />
                </button>

                <div className="relative z-10">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
