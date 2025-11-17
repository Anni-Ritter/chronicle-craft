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
            linkedChronicleId?: string;
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

    const monthNames = useMemo(
        () =>
            Array.from({ length: monthsInYear }, (_, i) => customMonthNames?.[i] || `Месяц ${i + 1}`),
        [customMonthNames, monthsInYear]
    );

    const dayNames = useMemo(
        () =>
            Array.from({ length: daysInWeek }, (_, i) => customWeekNames?.[i] || `День ${i + 1}`),
        [customWeekNames, daysInWeek]
    );

    const daysInThisMonth = daysInMonth[selectedMonth] ?? 30;

    const yearOptions = useMemo(() => {
        const years: number[] = [];
        for (let y = currentYear - 200; y <= currentYear + 100; y++) {
            years.push(y);
        }
        return years;
    }, [currentYear]);

    const keyDatesThisMonth = useMemo(
        () => (calendar.keyDates || []).filter((d) => d.month === selectedMonth + 1),
        [calendar.keyDates, selectedMonth]
    );

    const activeYearRef = useRef<HTMLLIElement | null>(null);

    useEffect(() => {
        if (showYearDropdown && activeYearRef.current) {
            activeYearRef.current.scrollIntoView({ block: 'center' });
        }
    }, [showYearDropdown]);

    return (
        <div className="w-full max-sm:max-w-sm rounded-2xl bg-[#111712]/95 font-lora text-[#e5d9a5] animate-fade-in-down">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <button
                    type="button"
                    onClick={() =>
                        setSelectedMonth((m) => (m === 0 ? monthsInYear - 1 : m - 1))
                    }
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#3a4a34] bg-[#171f15] hover:bg-[#253421] text-[#c2a774] transition"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center flex-1 min-w-0">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#c7bc98] mb-1">
                        Календарь мира
                    </span>
                    <div className="inline-flex items-center gap-2">
                        <span className="text-sm sm:text-base font-garamond">
                            {monthNames[selectedMonth]}
                        </span>

                        <div className="relative inline-block text-left">
                            <button
                                type="button"
                                onClick={() => setShowYearDropdown((prev) => !prev)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#3a4a34] bg-[#171f15] text-xs sm:text-sm hover:border-[#c2a774aa] hover:bg-[#253421] transition"
                            >
                                {selectedYear}
                                <span className="text-[#c2a774] text-[10px]">▼</span>
                            </button>

                            {showYearDropdown && (
                                <ul className="absolute z-30 mt-2 max-h-48 overflow-y-auto bg-[#0e1b12] border border-[#c2a774] rounded-xl shadow-lg text-[#f5e9c6] right-0 w-24 no-scrollbar text-sm">
                                    {yearOptions.map((year) => (
                                        <li
                                            key={year}
                                            ref={year === selectedYear ? activeYearRef : null}
                                            onClick={() => {
                                                setSelectedYear(year);
                                                setShowYearDropdown(false);
                                            }}
                                            className={`px-3 py-1 cursor-pointer hover:bg-[#3a4c3a] ${year === selectedYear ? 'bg-[#3a4c3a]' : ''
                                                }`}
                                        >
                                            {year}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setSelectedMonth((m) => (m === monthsInYear - 1 ? 0 : m + 1))
                    }
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#3a4a34] bg-[#171f15] hover:bg-[#253421] text-[#c2a774] transition"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div
                className="grid text-[10px] sm:text-xs mt-2 gap-[2px]"
                style={{ gridTemplateColumns: `repeat(${daysInWeek}, 1fr)` }}
            >
                {dayNames.map((day, i) => (
                    <div
                        key={i}
                        className="max-sm:hidden text-center font-medium text-[#e5d9a5]/70 pb-1"
                    >
                        {day}
                    </div>
                ))}

                {Array.from({ length: daysInThisMonth }).map((_, dayIdx) => {
                    const day = dayIdx + 1;
                    const keyDate = keyDatesThisMonth.find((d) => d.day === day);

                    const isKey = Boolean(keyDate);

                    return (
                        <button
                            type="button"
                            key={dayIdx}
                            className={`relative flex items-center justify-center rounded-lg border text-xs sm:text-sm py-1.5 md:py-2 transition-all duration-150
                                ${isKey
                                    ? 'border-[#c2a774] bg-[#273824] text-[#f5e9c6] shadow-[0_0_12px_#c2a77455]'
                                    : 'border-[#3a4a3422] bg-[#141b13] text-[#e5d9a5]/85 hover:border-[#c2a77455] hover:bg-[#1c2817]'
                                }`}
                            onClick={() => {
                                if (keyDate) {
                                    setSelectedKeyDate(keyDate);
                                }
                            }}
                        >
                            <span
                                className={`relative inline-flex items-center justify-center w-7 h-7 rounded-full 
                                    ${isKey
                                        ? 'bg-[#c2a77422] ring-1 ring-[#c2a774aa]'
                                        : 'bg-transparent'
                                    }`}
                            >
                                {day}
                                {isKey && (
                                    <>
                                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#c2a774] shadow-[0_0_8px_#c2a774]" />
                                        <span className="absolute inset-0 rounded-full border border-[#c2a77433] animate-ping opacity-60" />
                                    </>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            <Modal isOpen={!!selectedKeyDate} onClose={() => setSelectedKeyDate(null)}>
                {selectedKeyDate && (
                    <div className="w-full bg-[#0e1b12] border border-[#c2a774] rounded-3xl px-5 py-6 text-[#e5d9a5] font-lora shadow-[0_0_30px_#000] space-y-4">
                        <h2 className="text-xl md:text-2xl font-garamond flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#273824] text-[#c2a774]">
                                ✦
                            </span>
                            <span className="break-words">{selectedKeyDate.name}</span>
                        </h2>

                        <p className="flex items-center gap-2 text-sm md:text-base text-[#c7bc98]">
                            <Calendar size={16} className="text-[#c2a774]" />
                            <span>
                                {selectedKeyDate.day}{' '}
                                {calendar.customMonthNames?.[selectedKeyDate.month - 1] ??
                                    `Месяц ${selectedKeyDate.month}`}{' '}
                                {selectedYear}
                            </span>
                        </p>

                        {selectedKeyDate.description && (
                            <p className="text-sm md:text-[15px] text-[#f5e9c6]/85 leading-relaxed">
                                {selectedKeyDate.description}
                            </p>
                        )}

                        {selectedKeyDate.linkedChronicleId && (
                            <div className="pt-2">
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#c2a774] bg-[#141b13] text-sm md:text-[15px] hover:bg-[#273824] hover:border-[#e5d9a5] transition"
                                    onClick={() =>
                                        navigate(`/chronicles/${selectedKeyDate.linkedChronicleId}`)
                                    }
                                >
                                    Открыть связанную хронику
                                    <span className="text-[#c2a774] text-xs">↗</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};
