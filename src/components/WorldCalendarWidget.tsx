import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from './Modal';
import { useNavigate } from 'react-router-dom';

interface WorldCalendarWidgetProps {
    calendar: {
        daysInWeek: number;
        monthsInYear: number;
        currentYear?: number;
        daysInMonth?: number[];
        keyDates?: {
            name: string;
            day: number;
            month: number;
            description?: string;
            repeatEachYear?: boolean;
        }[];
        customMonthNames?: string[];
        customWeekNames?: string[];
    };
    initialDate?: string;
    onChange?: (formatted: string) => void;
}

export const WorldCalendarWidget = ({ calendar }: WorldCalendarWidgetProps) => {
    const {
        daysInWeek,
        monthsInYear,
        currentYear = 1,
        daysInMonth = [],
        customMonthNames = [],
        customWeekNames = [],
    } = calendar;

    const [selectedMonth, setSelectedMonth] = useState(0);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [selectedKeyDate, setSelectedKeyDate] = useState<null | {
        name: string;
        day: number;
        month: number;
        description?: string;
        linkedChronicleId?: string;
    }>(null);
    const navigate = useNavigate();

    const monthNames = useMemo(() => {
        return Array.from({ length: monthsInYear }, (_, i) => customMonthNames?.[i] || `Месяц ${i + 1}`);
    }, [customMonthNames, monthsInYear]);

    const dayNames = useMemo(() => {
        return Array.from({ length: daysInWeek }, (_, i) => customWeekNames?.[i] || `День ${i + 1}`);
    }, [customWeekNames, daysInWeek]);

    const daysInThisMonth = daysInMonth[selectedMonth] ?? 30;

    const yearOptions = useMemo(() => {
        const years = [];
        for (let y = currentYear - 200; y <= currentYear + 100; y++) {
            years.push(y);
        }
        return years;
    }, [currentYear]);

    const keyDatesThisMonth = useMemo(() => {
        return (calendar.keyDates || []).filter(
            (d) => d.month === selectedMonth + 1
        );
    }, [calendar.keyDates, selectedMonth]);

    const activeYearRef = useRef<HTMLLIElement | null>(null);

    useEffect(() => {
        if (showYearDropdown && activeYearRef.current) {
            activeYearRef.current.scrollIntoView({ block: 'center' });
        }
    }, [showYearDropdown]);

    return (
        <div className="border border-[#c2a774] rounded-xl p-4 bg-[#182413] text-[#e5d9a5] font-lora w-full max-sm:max-w-sm">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap sm:flex-nowrap">
                <button
                    onClick={() => setSelectedMonth((m) => (m === 0 ? monthsInYear - 1 : m - 1))}
                    className="p-1 hover:bg-[#2f3e29] rounded"
                >
                    <ChevronLeft className="w-5 h-5 text-[#c2a774]" />
                </button>

                <h3 className="text-base sm:text-lg font-garamond text-[#e5d9a5] text-center flex-1">
                    {monthNames[selectedMonth]}{' '}
                    <div className="relative inline-block text-left">
                        <button
                            type="button"
                            onClick={() => setShowYearDropdown((prev) => !prev)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[#e5d9a5] font-lora bg-transparent border-none"
                        >
                            {selectedYear}
                            <span className="text-[#c2a774]">▼</span>
                        </button>

                        {showYearDropdown && (
                            <ul className="absolute z-30 mt-2 max-h-48 overflow-y-auto bg-[#0e1b12] border border-[#c2a774] rounded-xl shadow-lg text-[#f5e9c6] right-0 w-24 no-scrollbar">
                                {yearOptions.map((year) => (
                                    <li
                                        key={year}
                                        ref={year === selectedYear ? activeYearRef : null}
                                        onClick={() => {
                                            setSelectedYear(year);
                                            setShowYearDropdown(false);
                                        }}
                                        className={`px-3 py-1 cursor-pointer hover:bg-[#3a4c3a] ${year === selectedYear ? 'bg-[#3a4c3a]' : ''}`}
                                    >
                                        {year}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </h3>

                <button
                    onClick={() => setSelectedMonth((m) => (m === monthsInYear - 1 ? 0 : m + 1))}
                    className="p-1 hover:bg-[#2f3e29] rounded"
                >
                    <ChevronRight className="w-5 h-5 text-[#c2a774]" />
                </button>
            </div>

            <div className="grid text-xs sm:text-sm" style={{ gridTemplateColumns: `repeat(${daysInWeek}, 1fr)` }}>
                {dayNames.map((day, i) => (
                    <div key={i} className="max-sm:hidden text-center font-medium text-[#e5d9a5]/70 pb-1">
                        {day}
                    </div>
                ))}

                {Array.from({ length: daysInThisMonth }).map((_, dayIdx) => {
                    const day = dayIdx + 1;
                    const keyDate = keyDatesThisMonth.find((d) => d.day === day);

                    return (
                        <div
                            key={dayIdx}
                            className={`relative text-center border rounded p-1 cursor-pointer hover:bg-[#2f3e29] 
                            ${keyDate ? 'border-[#e5d9a5] bg-[#3a4c3a] font-semibold' : 'border-[#c2a77422]'}`}
                            onClick={() => keyDate && setSelectedKeyDate(keyDate)}
                        >
                            <div>{day}</div>
                        </div>
                    );
                })}

                <Modal isOpen={!!selectedKeyDate} onClose={() => setSelectedKeyDate(null)}>
                    {selectedKeyDate && (
                        <div className="space-y-3 px-2 py-1">
                            <h2 className="text-2xl font-garamond">{selectedKeyDate.name}</h2>
                            <p className="mb-2 flex items-center gap-2">
                                <Calendar size={16} />
                                {selectedKeyDate.day}{' '}
                                {calendar.customMonthNames?.[selectedKeyDate.month - 1] ?? `Месяц ${selectedKeyDate.month}`}{' '}
                                {selectedYear}
                            </p>
                            {selectedKeyDate.description && (
                                <p className="text-[#f5e9c6]/80">{selectedKeyDate.description}</p>
                            )}
                            {selectedKeyDate.linkedChronicleId && (
                                <button
                                    className="text-sm mt-3 px-3 py-1 border border-[#c2a774] rounded hover:bg-[#3a4c3a]"
                                    onClick={() => navigate(`/chronicles/${selectedKeyDate.linkedChronicleId}`)}
                                >
                                    Перейти к хронике →
                                </button>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};
