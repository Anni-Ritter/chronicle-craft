import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobileSheet } from "../hooks/useIsMobileSheet";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
    const isSheet = useIsMobileSheet();

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

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={
                        isSheet
                            ? "fixed inset-0 z-[100] flex items-end justify-center p-0"
                            : "fixed inset-0 z-[100] flex items-center justify-center px-3 py-3 sm:px-6 sm:py-6"
                    }
                    role="dialog"
                    aria-modal="true"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-[#020403]/92 backdrop-blur-md"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    <motion.div
                        className={
                            isSheet
                                ? "relative z-10 flex w-full max-h-[100dvh] flex-col overflow-hidden rounded-t-[1.75rem] border border-b-0 border-[#2a322e] border-t-[#c2a77455] bg-[#080b09] text-[#e5d9a5] font-lora shadow-[0_-12px_48px_rgba(0,0,0,0.85)]"
                                : "relative z-10 my-1 flex w-full max-w-2xl max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border border-[#2f3a34] bg-[#080b09] p-4 sm:my-2 sm:max-h-[calc(100dvh-1.5rem)] sm:p-6 md:p-8 text-[#e5d9a5] font-lora shadow-[0_0_55px_#000]"
                        }
                        initial={
                            isSheet
                                ? { y: "100%", opacity: 1 }
                                : { opacity: 0, scale: 0.92, y: 28 }
                        }
                        animate={
                            isSheet
                                ? { y: 0, opacity: 1 }
                                : { opacity: 1, scale: 1, y: 0 }
                        }
                        exit={
                            isSheet
                                ? { y: "100%", opacity: 1, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }
                                : { opacity: 0, scale: 0.95, y: 16, transition: { duration: 0.2 } }
                        }
                        transition={
                            isSheet
                                ? { type: "spring", stiffness: 400, damping: 36, mass: 0.85 }
                                : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
                        }
                        onClick={(e) => e.stopPropagation()}
                    >
                        {!isSheet && (
                            <div className="pointer-events-none absolute -top-16 -right-10 w-40 h-40 rounded-full bg-[#c2a7741f] blur-3xl" />
                        )}

                        {isSheet && (
                            <div className="relative flex shrink-0 items-center justify-center border-b border-[#2a322e] bg-[#080b09] py-3">
                                <div
                                    className="h-1 w-12 shrink-0 rounded-full bg-[#c7bc98]/45"
                                    aria-hidden
                                />
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className={
                                isSheet
                                    ? "absolute right-2 top-2 z-20 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#c7bc98] transition hover:text-[#f1eac0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c2a774]"
                                    : "absolute z-20 top-3 right-3 flex min-h-10 min-w-10 items-center justify-center rounded-lg text-[#c7bc98] transition hover:text-[#f1eac0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c2a774] sm:min-h-11 sm:min-w-11"
                            }
                            aria-label="Закрыть"
                        >
                            <X size={isSheet ? 24 : 20} />
                        </button>

                        <div
                            className={
                                isSheet
                                    ? "relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-[#080b09] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pt-5"
                                    : "relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#080b09] no-scrollbar"
                            }
                        >
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
