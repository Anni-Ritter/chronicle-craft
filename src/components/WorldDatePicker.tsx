import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface Props {
    calendar: {
        currentYear?: number;
        daysInWeek: number;
        monthsInYear: number;
        daysInMonth?: number[];
        customMonthNames?: string[];
        customWeekNames?: string[];
    };
    initialDate?: string;
    onChange: (formatted: string) => void;
}

export const WorldDatePicker: React.FC<Props> = ({ calendar, initialDate, onChange }) => {
    const { daysInWeek, monthsInYear, currentYear = 1, daysInMonth = [], customMonthNames = [], customWeekNames = [] } = calendar;
    const parseInitialDate = (raw?: string) => {
        if (!raw) return { d: 1, m: 0, y: currentYear };

        const parts = raw.split('|');
        if (parts.length !== 3) return { d: 1, m: 0, y: currentYear };

        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);

        return {
            d: isNaN(d) ? 1 : d,
            m: isNaN(m) ? 0 : m,
            y: isNaN(y) ? currentYear : y,
        };
    };

    const { d, m, y } = parseInitialDate(initialDate);

    const [day, setDay] = useState(d);
    const [month, setMonth] = useState(m);
    const [year, setYear] = useState(y);
    const [isOpen, setIsOpen] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const pickerRef = useRef<HTMLDivElement | null>(null);
    const activeYearRef = useRef<HTMLLIElement | null>(null);
    const days = daysInMonth[month] ?? 30;
    const monthName = customMonthNames?.[month] ?? `Месяц ${month + 1}`;

    const yearOptions = useMemo(() => {
        const years = [];
        for (let y = currentYear - 200; y <= currentYear + 100; y++) {
            years.push(y);
        }
        return years;
    }, [currentYear]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (showYearDropdown && activeYearRef.current) {
            activeYearRef.current.scrollIntoView({ block: 'center' });
        }
    }, [showYearDropdown]);

    const handleSelect = (d: number) => {
        setDay(d);
        const formatted = `${String(d).padStart(2, '0')}|${String(month + 1).padStart(2, '0')}|${year}`;
        onChange(formatted);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={pickerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-4 py-2 rounded-xl bg-[#0e1b12] border border-[#c2a774] text-[#f5e9c6]"
            >
                <span>{`${day} ${monthName} ${year}`}</span>
                <CalendarIcon size={18} className="text-[#c2a774]" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 p-3 w-[270px] bg-[#182413] border border-[#c2a774] rounded-xl shadow-lg text-[#e5d9a5] font-lora">
                    <div className="flex justify-between items-center mb-2">
                        <button type="button" onClick={() => setMonth((prev) => (prev === 0 ? monthsInYear - 1 : prev - 1))}>
                            <ChevronLeft size={18} />
                        </button>
                        <div className="text-lg flex items-center gap-2">
                            {monthName}
                            <div className="relative inline-block">
                                <button
                                    type="button"
                                    onClick={() => setShowYearDropdown((prev) => !prev)}
                                    className="text-sm border-none px-1 py-0.5 rounded hover:bg-[#3a4c3a]"
                                >
                                    {year} <span className="ml-1 text-[#c2a774]">▼</span>
                                </button>
                                {showYearDropdown && (
                                    <ul className="absolute z-30 mt-1 max-h-40 overflow-y-auto no-scrollbar bg-[#0e1b12] border border-[#c2a774] rounded shadow-lg text-[#f5e9c6] right-0 w-20">
                                        {yearOptions.map((yOption) => (
                                            <li
                                                key={yOption}
                                                ref={yOption === year ? activeYearRef : null}
                                                onClick={() => {
                                                    setYear(yOption);
                                                    setShowYearDropdown(false);
                                                }}
                                                className={`px-2 py-1 text-sm cursor-pointer hover:bg-[#3a4c3a] ${yOption === year ? 'bg-[#3a4c3a]' : ''}`}
                                            >
                                                {yOption}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <button type="button" onClick={() => setMonth((prev) => (prev === monthsInYear - 1 ? 0 : prev + 1))}>
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="grid" style={{ gridTemplateColumns: `repeat(${daysInWeek}, 1fr)` }}>
                        {customWeekNames.length === daysInWeek &&
                            customWeekNames.map((d, i) => (
                                <div key={i} className="max-sm:hidden text-center text-xs text-[#e5d9a5]/70 pb-1">
                                    {d}
                                </div>
                            ))}
                    </div>

                    <div className="grid" style={{ gridTemplateColumns: `repeat(${daysInWeek}, 1fr)` }}>
                        {Array.from({ length: days }).map((_, idx) => {
                            const d = idx + 1;
                            return (
                                <div
                                    key={d}
                                    className={`text-center p-2 rounded cursor-pointer text-sm
                    ${d === day ? 'bg-[#c2a774] text-[#0e1b12]' : 'hover:bg-[#3a4c3a]'}`}
                                    onClick={() => handleSelect(d)}
                                >
                                    {d}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
