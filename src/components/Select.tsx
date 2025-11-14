import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

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
}

export const Select = ({
    value,
    options,
    onChange,
    placeholder = "Выбрать...",
    className = "",
}: SelectProps) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selected = options.find((o) => o.value === value);

    return (
        <div ref={ref} className={clsx("relative text-base font-lora", className)}>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex justify-between items-center px-4 py-2 rounded-lg bg-[#d6c5a2] text-[#0e1b12] border border-[#0e1b12] hover:bg-[#e5d9a5] transition"
            >
                <span>{selected?.label || placeholder}</span>
                <ChevronDown size={16} />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 min-w-[10rem] w-max no-scrollbar max-h-60 overflow-auto rounded-lg border border-[#0e1b12] bg-[#d6c5a2] shadow-lg">
                    <div className="py-1">
                        <div
                            onClick={() => {
                                onChange(null);
                                setOpen(false);
                            }}
                            className="px-4 py-2 cursor-pointer hover:bg-[#c2a774] text-[#0e1b12]"
                        >
                            {placeholder}
                        </div>
                        {options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                                className={clsx(
                                    "px-4 py-2 cursor-pointer transition text-[#0e1b12]",
                                    value === option.value
                                        ? "bg-[#c2a774]"
                                        : "hover:bg-[#c2a774]"
                                )}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
