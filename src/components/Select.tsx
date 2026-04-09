import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";
import clsx from "clsx";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobileSheet } from "../hooks/useIsMobileSheet";

interface Option {
    value: string;
    label: string;
}

interface SelectProps {
    value: string | null;
    options: Option[];
    placeholder?: string;
    onChange: (value: string | null) => void;
    className?: string;
    icon?: ReactNode;
    label?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
}

export const Select = ({
    value,
    options,
    onChange,
    placeholder = "Выбрать...",
    className = "",
    icon,
    searchable = false,
    searchPlaceholder = "Поиск..."
}: SelectProps) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const desktopDropdownRef = useRef<HTMLDivElement>(null);
    const isMobileSheet = useIsMobileSheet();
    const [desktopDropdownStyle, setDesktopDropdownStyle] = useState<{
        top: number;
        left: number;
        width: number;
        maxHeight: number;
    } | null>(null);

    const updateDesktopDropdownPosition = () => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const viewportPadding = 8;
        const availableHeight = Math.max(
            180,
            window.innerHeight - rect.bottom - viewportPadding
        );
        setDesktopDropdownStyle({
            top: rect.bottom + 6,
            left: rect.left,
            width: rect.width,
            maxHeight: Math.min(280, availableHeight),
        });
    };

    useEffect(() => {
        if (!open || isMobileSheet) return;
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isInsideTrigger = !!ref.current?.contains(target);
            const isInsideDesktopDropdown = !!desktopDropdownRef.current?.contains(target);
            if (!isInsideTrigger && !isInsideDesktopDropdown) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, isMobileSheet]);

    useEffect(() => {
        if (!open || isMobileSheet) return;
        updateDesktopDropdownPosition();
        const handlePositionUpdate = () => updateDesktopDropdownPosition();
        window.addEventListener("resize", handlePositionUpdate);
        window.addEventListener("scroll", handlePositionUpdate, true);
        return () => {
            window.removeEventListener("resize", handlePositionUpdate);
            window.removeEventListener("scroll", handlePositionUpdate, true);
        };
    }, [open, isMobileSheet]);

    useEffect(() => {
        if (open && isMobileSheet) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }
        return () => document.body.classList.remove("overflow-hidden");
    }, [open, isMobileSheet]);

    useEffect(() => {
        if (!open && search) {
            setSearch("");
        }
    }, [open, search]);

    const selected = options.find((o) => o.value === value);
    const filteredOptions = searchable
        ? options.filter((option) => option.label.toLowerCase().includes(search.trim().toLowerCase()))
        : options;

    const triggerClasses = clsx(
        "flex w-full items-center justify-between gap-2 rounded-xl border border-[#3a4a34] bg-[#0e1b12]/90 px-3 py-3 text-left text-[#e5d9a5] shadow-inner transition",
        "hover:border-[#c2a77466] focus:border-[#c2a774] focus:outline-none focus:ring-2 focus:ring-[#c2a774]/30",
        "touch-manipulation min-h-[52px] lg:min-h-0 lg:py-2.5",
        open && "border-[#c2a77488] ring-2 ring-[#c2a774]/25"
    );

    const optionBtn = (
        optValue: string | null,
        optLabel: string,
        isActive: boolean,
        onPick: () => void
    ) => (
        <button
            key={optValue ?? "__all__"}
            type="button"
            role="option"
            aria-selected={isActive}
            onClick={onPick}
            className={clsx(
                "flex w-full min-h-[52px] items-center gap-3 border-b border-[#3a4a34]/60 px-4 py-3 text-left text-[15px] transition last:border-b-0 lg:min-h-0 lg:py-2.5 lg:text-base",
                isActive
                    ? "bg-[#c2a774]/15 text-[#f4ecd0]"
                    : "text-[#e5d9a5] active:bg-[#1b261a]"
            )}
        >
            <span className="min-w-0 flex-1 truncate">{optLabel}</span>
            {isActive && <Check className="h-5 w-5 shrink-0 text-[#c2a774]" strokeWidth={2.2} />}
        </button>
    );

    const listInner = (
        <>
            {optionBtn(null, placeholder, value === null, () => {
                onChange(null);
                setOpen(false);
            })}
            {filteredOptions.map((option) =>
                optionBtn(
                    option.value,
                    option.label,
                    value === option.value,
                    () => {
                        onChange(option.value);
                        setOpen(false);
                    }
                )
            )}
            {searchable && filteredOptions.length === 0 && (
                <div className="px-4 py-3 text-sm text-[#c7bc98]">Ничего не найдено</div>
            )}
        </>
    );

    return (
        <div ref={ref} className={clsx("relative font-lora text-base", className)}>
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="listbox"
                onClick={() => setOpen(!open)}
                className={triggerClasses}
            >
                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    {icon && <span className="shrink-0 opacity-90 [&_svg]:block">{icon}</span>}
                    <span className="truncate text-[15px] lg:text-base">
                        {selected?.label ?? placeholder}
                    </span>
                </span>
                <ChevronDown
                    size={20}
                    className={clsx(
                        "shrink-0 text-[#c2a774] transition-transform duration-200",
                        open && "rotate-180"
                    )}
                    aria-hidden
                />
            </button>

            {open && !isMobileSheet && desktopDropdownStyle &&
                createPortal(
                    <div
                        ref={desktopDropdownRef}
                        className="z-[220] overflow-y-auto overscroll-contain rounded-xl border border-[#2f3a34] bg-[#080b09] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
                        role="listbox"
                        style={{
                            position: "fixed",
                            top: desktopDropdownStyle.top,
                            left: desktopDropdownStyle.left,
                            width: desktopDropdownStyle.width,
                            maxHeight: desktopDropdownStyle.maxHeight,
                        }}
                    >
                        {searchable && (
                            <div className="border-b border-[#2f3a34] px-3 py-2">
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="w-full rounded-lg border border-[#3a4a34] bg-[#0e1b12]/80 px-3 py-2 text-sm text-[#e5d9a5] focus:border-[#c2a774] focus:outline-none"
                                />
                            </div>
                        )}
                        {listInner}
                    </div>,
                    document.body
                )}

            {isMobileSheet &&
                createPortal(
                    <AnimatePresence>
                        {open && (
                            <>
                                <motion.button
                                    type="button"
                                    aria-label="Закрыть список"
                                    className="fixed inset-0 z-[210] bg-[#020403]/90 backdrop-blur-sm"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setOpen(false)}
                                />
                                <motion.div
                                    role="listbox"
                                    className="fixed inset-x-0 bottom-0 z-[220] flex max-h-[min(72dvh,520px)] flex-col overflow-hidden rounded-t-[1.25rem] border border-b-0 border-[#2a322e] border-t-[#c2a77455] bg-[#080b09] shadow-[0_-16px_48px_rgba(0,0,0,0.85)]"
                                    style={{
                                        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
                                    }}
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "100%" }}
                                    transition={{ type: "spring", stiffness: 400, damping: 38 }}
                                >
                                    <div className="flex shrink-0 flex-col items-center border-b border-[#3a4a34]/80 py-2">
                                        <div className="h-1 w-12 rounded-full bg-[#c7bc98]/35" aria-hidden />
                                    </div>
                                    <p className="shrink-0 px-4 pb-2 pt-1 text-center text-sm font-garamond font-semibold text-[#e5d9a5]">
                                        {placeholder}
                                    </p>
                                    {searchable && (
                                        <div className="shrink-0 border-b border-[#2f3a34] px-4 pb-2">
                                            <input
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                placeholder={searchPlaceholder}
                                                className="w-full rounded-lg border border-[#3a4a34] bg-[#0e1b12]/80 px-3 py-2 text-sm text-[#e5d9a5] focus:border-[#c2a774] focus:outline-none"
                                            />
                                        </div>
                                    )}
                                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                                        {listInner}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    );
};
