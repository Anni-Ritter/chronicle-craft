import { CircleQuestionMark, Dices, Plus, Trash2 } from "lucide-react";
import { useCalendarStore } from "../store/useCalendarStore";
import { Button } from "./ChronicleButton";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";

interface NumericInputProps {
    value: number | undefined;
    onCommit: (value: number) => void;
    className: string;
    placeholder?: string;
    min?: number;
}

const NumericInput = ({ value, onCommit, className, placeholder, min }: NumericInputProps) => {
    const [inputValue, setInputValue] = useState(
        value === undefined || Number.isNaN(value) ? "" : String(value)
    );
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (isFocused) return;
        setInputValue(value === undefined || Number.isNaN(value) ? "" : String(value));
    }, [value, isFocused]);

    const commit = (raw: string) => {
        if (raw.trim() === "") {
            setInputValue(value === undefined || Number.isNaN(value) ? "" : String(value));
            return;
        }

        const parsed = Number(raw);
        if (Number.isNaN(parsed)) {
            setInputValue(value === undefined || Number.isNaN(value) ? "" : String(value));
            return;
        }

        const next = Math.round(parsed);
        const clamped = min !== undefined ? Math.max(min, next) : next;
        onCommit(clamped);
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            className={className}
            placeholder={placeholder}
            value={inputValue}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => {
                const raw = e.target.value;
                if (/^-?\d*$/.test(raw)) {
                    setInputValue(raw);
                }
            }}
            onBlur={() => {
                setIsFocused(false);
                commit(inputValue);
            }}
        />
    );
};

export const CalendarEditorForm = () => {
    const { calendar, updateField } = useCalendarStore();
    const supabase = useSupabaseClient();

    const getRandomColor = () => {
        return `#${Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0")}`;
    };

    const handleGenerateWeekNames = async () => {
        const { data, error } = await supabase.functions.invoke("generate-calendar-part", {
            body: {
                text: `Придумай ${calendar.daysInWeek} уникальных названий дней недели в фэнтезийном мире. Только список, без нумерации.`,
            },
        });

        if (error) {
            console.error("Ошибка генерации:", error);
            return;
        }

        const names = (data?.result || "")
            .split("\n")
            .map((name: string) => name.trim())
            .filter((name: string) => name.length > 0);

        updateField("customWeekNames", names.slice(0, calendar.daysInWeek));
    };

    const handleGenerateMonthNames = async () => {
        const { data, error } = await supabase.functions.invoke("generate-calendar-part", {
            body: {
                text: `Придумай ${calendar.monthsInYear} названий месяцев в фэнтезийном стиле. Только список, без нумерации.`,
            },
        });

        if (error) {
            console.error("Ошибка генерации месяцев:", error);
            return;
        }

        const names = (data?.result || "")
            .split("\n")
            .map((name: string) => name.trim())
            .filter((name: string) => name.length > 0);

        updateField("customMonthNames", names.slice(0, calendar.monthsInYear));
    };

    const handleGenerateTimeUnits = async () => {
        const { data, error } = await supabase.functions.invoke("generate-calendar-part", {
            body: {
                text: `Придумай фэнтезийные названия для единиц времени: день, неделя, месяц, год. Ответь списком в том же порядке.`,
            },
        });

        if (error) {
            console.error("Ошибка генерации единиц времени:", error);
            return;
        }

        const lines = (data?.result || "")
            .split("\n")
            .map((l: string) => l.trim())
            .filter(Boolean);

        updateField("timeUnitNames", {
            day: lines[0] || "",
            week: lines[1] || "",
            month: lines[2] || "",
            year: lines[3] || "",
        });
    };

    const handleArrayChange = (
        key: "customWeekNames" | "customMonthNames",
        index: number,
        value: string
    ) => {
        const newArray = [...(calendar[key] || [])];
        newArray[index] = value;
        updateField(key, newArray);
    };

    const handleUnitChange = (unit: "day" | "week" | "month" | "year", value: string) => {
        updateField("timeUnitNames", { ...calendar.timeUnitNames, [unit]: value });
    };

    const handleEpochStartChange = (key: "day" | "month" | "year", value: number) => {
        updateField(
            "epochStart",
            { ...calendar.epochStart, [key]: value } as { day: number; month: number; year: number }
        );
    };

    const updatePhases = (index: number, key: string, value: string | number) => {
        const updated = [...(calendar.phases || [])];
        updated[index] = { ...updated[index], [key]: value };
        updateField("phases", updated);
    };

    const removePhase = (index: number) => {
        const updated = [...(calendar.phases || [])];
        updated.splice(index, 1);
        updateField("phases", updated);
    };

    const addPhase = () => {
        updateField("phases", [
            ...(calendar.phases || []),
            { name: "", fromDay: 1, toDay: 1, color: getRandomColor() },
        ]);
    };

    const updateKeyDate = (index: number, key: string, value: string | number) => {
        const updated = [...(calendar.keyDates || [])];
        updated[index] = { ...updated[index], [key]: value };
        updateField("keyDates", updated);
    };

    const removeKeyDate = (index: number) => {
        const updated = [...(calendar.keyDates || [])];
        updated.splice(index, 1);
        updateField("keyDates", updated);
    };

    const addKeyDate = () => {
        updateField("keyDates", [
            ...(calendar.keyDates || []),
            { name: "", day: 1, month: 1, description: "" },
        ]);
    };

    return (
        <div className="text-[#e5d9a5] font-lora space-y-8">
            <div className="flex flex-col items-center gap-1 mb-2">
                <h2 className="text-2xl md:text-3xl text-center tracking-wide font-garamond flex items-center gap-2">
                    Редактор календаря
                </h2>
                <p className="text-xs md:text-sm text-[#c7bc98] text-center max-w-xl">
                    Настрой свой мир: длина года, названия месяцев, магические фазы и ключевые даты.
                </p>
            </div>

            <section className="bg-[#1a2419] rounded-2xl p-4 md:p-5 border border-[#c2a77455] shadow-[0_0_24px_#000]/60 space-y-4">
                <h3 className="text-lg font-garamond flex items-center gap-2 text-[#e5d9a5]">
                    Основы цикла
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block text-sm space-y-1">
                        <span className="text-[#c2a774]">Дней в неделе</span>
                        <NumericInput
                            min={1}
                            className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                            value={calendar.daysInWeek}
                            onCommit={(value) => updateField("daysInWeek", value)}
                        />
                    </label>
                    <label className="block text-sm space-y-1">
                        <span className="text-[#c2a774]">Месяцев в году</span>
                        <NumericInput
                            min={1}
                            className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                            value={calendar.monthsInYear}
                            onCommit={(value) => updateField("monthsInYear", value)}
                        />
                    </label>
                </div>
            </section>

            <section className="bg-[#1a2419] rounded-2xl p-4 md:p-5 border border-[#c2a77455] shadow-[0_0_24px_#000]/60 space-y-3">
                <h3 className="text-lg font-garamond text-[#e5d9a5]">Точка отсчёта</h3>
                <div className="space-y-1 text-sm">
                    <label className="text-[#c2a774]">Текущий год</label>
                    <NumericInput
                        placeholder="Год (например, 1 или 2025)"
                        className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                        value={calendar.currentYear ? Number(calendar.currentYear) : undefined}
                        onCommit={(value) => updateField("currentYear", value)}
                    />
                </div>
            </section>

            <section className="bg-[#1a2419] rounded-2xl p-4 md:p-5 border border-[#c2a77455] shadow-[0_0_24px_#000]/60 space-y-3">
                <h3 className="text-lg font-garamond text-[#e5d9a5]">
                    Длина месяцев
                </h3>
                <p className="text-xs text-[#c7bc98] mb-1">
                    Для каждого месяца укажи количество дней. Можно сделать месяцы разной длины.
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                    {Array.from({ length: calendar.monthsInYear }).map((_, i) => (
                        <NumericInput
                            key={i}
                            min={1}
                            className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                            placeholder={`Дней в месяце ${i + 1}`}
                            value={calendar.daysInMonth?.[i]}
                            onCommit={(value) => {
                                const updated = [...(calendar.daysInMonth || [])];
                                updated[i] = value;
                                updateField("daysInMonth", updated);
                            }}
                        />
                    ))}
                </div>
            </section>

            <section className="bg-[#1a2419] rounded-2xl p-4 md:p-5 border border-[#c2a77455] shadow-[0_0_24px_#000]/60 space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-garamond text-[#e5d9a5]">
                            Названия дней недели
                        </h3>
                        <p className="text-xs text-[#c7bc98] max-w-md">
                            Можно придумать свои или доверить генерацию магическому кубику.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        type="button"
                        className="gap-2 text-xs md:text-sm"
                        icon={<Dices size={16} />}
                        onClick={handleGenerateWeekNames}
                    >
                        Сгенерировать
                    </Button>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                    {Array.from({ length: calendar.daysInWeek }).map((_, i) => (
                        <input
                            key={i}
                            className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                            placeholder={`День ${i + 1}`}
                            value={calendar.customWeekNames?.[i] || ""}
                            onChange={(e) => handleArrayChange("customWeekNames", i, e.target.value)}
                        />
                    ))}
                </div>
            </section>

            <section className="bg-[#1a2419] rounded-2xl p-4 md:p-5 border border-[#c2a77455] shadow-[0_0_24px_#000]/60 space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-garamond text-[#e5d9a5]">
                            Названия месяцев
                        </h3>
                        <p className="text-xs text-[#c7bc98] max-w-md">
                            Месяцы могут намекать на сезоны, божеств или магические события.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        type="button"
                        icon={<Dices size={16} />}
                        className="text-xs md:text-sm"
                        onClick={handleGenerateMonthNames}
                    >
                        Сгенерировать
                    </Button>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                    {Array.from({ length: calendar.monthsInYear }).map((_, i) => (
                        <input
                            key={i}
                            className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                            placeholder={`Месяц ${i + 1}`}
                            value={calendar.customMonthNames?.[i] || ""}
                            onChange={(e) => handleArrayChange("customMonthNames", i, e.target.value)}
                        />
                    ))}
                </div>
            </section>

            <section className="bg-[#1a2419] rounded-2xl p-4 md:p-5 border border-[#c2a77455] shadow-[0_0_24px_#000]/60 space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-garamond text-[#e5d9a5]">
                            Единицы времени
                        </h3>
                        <p className="text-xs text-[#c7bc98] max-w-md">
                            Как в твоём мире сами жители называют день, неделю, месяц и год?
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        icon={<Dices size={16} />}
                        type="button"
                        className="text-xs md:text-sm"
                        onClick={handleGenerateTimeUnits}
                    >
                        Сгенерировать
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(["day", "week", "month", "year"] as const).map((unit) => (
                        <div key={unit}>
                            <label className="text-xs mb-1 block text-[#c2a774]">
                                {unit === "day" && 'Название для "дня"'}
                                {unit === "week" && 'Название для "недели"'}
                                {unit === "month" && 'Название для "месяца"'}
                                {unit === "year" && 'Название для "года"'}
                            </label>
                            <input
                                className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                                placeholder={unit}
                                value={calendar.timeUnitNames?.[unit] || ""}
                                onChange={(e) => handleUnitChange(unit, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-[#1a2419] rounded-2xl p-4 md:p-5 border border-[#c2a77455] shadow-[0_0_24px_#000]/60 space-y-3">
                <h3 className="text-lg font-garamond text-[#e5d9a5]">
                    Начало эпохи
                </h3>
                <p className="text-xs text-[#c7bc98]">
                    С какой даты начинается летоисчисление? Можно указать легендарное событие
                    в лоре и привязать всё к нему.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <NumericInput
                        min={1}
                        placeholder="День"
                        className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                        value={calendar.epochStart?.day}
                        onCommit={(value) => handleEpochStartChange("day", value)}
                    />
                    <NumericInput
                        min={1}
                        placeholder="Месяц"
                        className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                        value={calendar.epochStart?.month}
                        onCommit={(value) => handleEpochStartChange("month", value)}
                    />
                    <NumericInput
                        placeholder="Год"
                        className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                        value={calendar.epochStart?.year}
                        onCommit={(value) => handleEpochStartChange("year", value)}
                    />
                </div>
            </section>

            <section className="bg-[#1a2419] rounded-2xl p-4 md:p-5 border border-[#c2a77455] shadow-[0_0_24px_#000]/60 space-y-4">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-garamond text-[#e5d9a5]">Фазы</h3>
                            <span className="relative group">
                                <span className="text-[#c2a774] cursor-help">
                                    <CircleQuestionMark className="w-4 h-4" />
                                </span>
                                <span className="absolute z-10 w-64 text-xs text-left invisible group-hover:visible bg-[#1f2b1f] text-[#f5e9c6] border border-[#c2a774] px-3 py-2 rounded-xl shadow-md top-6 left-0">
                                    Фазы — это уникальные периоды в течение месяца (например, фазы
                                    луны, сезоны, магические шторма). Им можно задать цвет и диапазон
                                    дней.
                                </span>
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={async () => {
                                const { data, error } = await supabase.functions.invoke(
                                    "generate-calendar-part",
                                    {
                                        body: {
                                            text: `Придумай ${calendar.phases?.length || 0} названий фаз, связанных с природными или магическими циклами (луна, сезоны, магия и т.п.). Только список, без нумерации.`,
                                        },
                                    }
                                );

                                if (error) {
                                    console.error("Ошибка генерации фаз:", error);
                                    return;
                                }

                                const names = (data?.result || "")
                                    .split("\n")
                                    .map((s: string) => s.trim())
                                    .filter(Boolean);

                                const updated = (calendar.phases || []).map((phase, i) => ({
                                    ...phase,
                                    name: names[i] || phase.name,
                                    color: phase.color || getRandomColor(),
                                }));

                                updateField("phases", updated);
                            }}
                            icon={<Dices size={16} />}
                            className="gap-2 mt-1 text-xs md:text-sm"
                        >
                            Сгенерировать названия
                        </Button>
                    </div>

                    <div className="ml-auto flex">
                        <Button
                            onClick={addPhase}
                            className="!min-h-8 !w-8 !px-0 !py-0 !border-0 !bg-transparent !text-[#c2a774] !shadow-none hover:!bg-transparent hover:!text-[#e5d9a5]"
                            icon={<Plus size={16} />}
                        />
                    </div>
                </div>

                {(calendar.phases || []).map((phase, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-[#3a4a34] bg-[#111b14] px-4 md:px-5 py-4 md:py-5 space-y-4"
                    >
                        <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-7 h-7 rounded-full border border-[#c2a774aa] shadow-[0_0_10px_rgba(0,0,0,0.6)]"
                                    style={{ background: phase.color || "#c2a774" }}
                                />
                                <span className="text-xs text-[#c7bc98]">
                                    Цвет фазы — для визуализации в календаре и лоре.
                                </span>
                            </div>
                            <Button
                                variant="danger"
                                type="button"
                                onClick={() => removePhase(i)}
                                icon={<Trash2 size={14} />}
                                className="shrink-0 !min-h-8 !w-8 !px-0 !py-0 !border-0 !bg-transparent !shadow-none hover:!bg-transparent"
                                aria-label="Удалить фазу"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                                <label className="text-xs mb-1 block text-[#c2a774]">
                                    Название
                                </label>
                                <input
                                    className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                                    placeholder="Например, Кровавая Луна"
                                    value={phase.name}
                                    onChange={(e) => updatePhases(i, "name", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs mb-1 block text-[#c2a774]">
                                    Цвет (hex)
                                </label>
                                <input
                                    className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none"
                                    placeholder="#ffaa00"
                                    value={phase.color || ""}
                                    onChange={(e) => updatePhases(i, "color", e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs mb-1 block text-[#c2a774]">
                                        С дня
                                    </label>
                                    <NumericInput
                                        min={1}
                                        className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                                        value={phase.fromDay}
                                        onCommit={(value) => updatePhases(i, "fromDay", value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs mb-1 block text-[#c2a774]">
                                        До дня
                                    </label>
                                    <NumericInput
                                        min={1}
                                        className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                                        value={phase.toDay}
                                        onCommit={(value) => updatePhases(i, "toDay", value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            <section className="bg-[#1a2419] rounded-2xl p-4 md:p-5 border border-[#c2a77455] shadow-[0_0_24px_#000]/60 space-y-4">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-garamond text-[#e5d9a5]">
                                Ключевые даты
                            </h3>
                            <span className="relative group">
                                <span className="text-[#c2a774] cursor-help">
                                    <CircleQuestionMark className="w-4 h-4" />
                                </span>
                                <span className="absolute z-10 w-64 text-xs text-left invisible group-hover:visible bg-[#1f2b1f] text-[#f5e9c6] border border-[#c2a774] px-3 py-2 rounded-xl shadow-md top-6 left-0">
                                    Важные точки истории: праздники, катастрофы, коронации,
                                    годовщины. Можно указать описание, день и месяц.
                                </span>
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={async () => {
                                const { data, error } = await supabase.functions.invoke(
                                    "generate-calendar-part",
                                    {
                                        body: {
                                            text: `Придумай ${calendar.keyDates?.length || 0} названий и описаний для ключевых событий в фэнтезийном мире. Ответь списком в формате "Название — Краткое описание".`,
                                        },
                                    }
                                );

                                if (error) {
                                    console.error("Ошибка генерации описаний дат:", error);
                                    return;
                                }

                                const entries = (data?.result || "")
                                    .split("\n")
                                    .map((s: string) => s.trim())
                                    .filter(Boolean);

                                const updated = (calendar.keyDates || []).map((d, i) => {
                                    const [name, desc] = entries[i]?.split("—") ?? [];
                                    return {
                                        ...d,
                                        name: name?.trim() || d.name,
                                        description: desc?.trim() || d.description,
                                    };
                                });

                                updateField("keyDates", updated);
                            }}
                            className="gap-2 mt-1 text-xs md:text-sm"
                            icon={<Dices size={16} />}
                        >
                            Сгенерировать описания
                        </Button>
                    </div>

                    <div className="ml-auto flex">
                        <Button
                            onClick={addKeyDate}
                            className="!min-h-8 !w-8 !px-0 !py-0 !border-0 !bg-transparent !text-[#c2a774] !shadow-none hover:!bg-transparent hover:!text-[#e5d9a5]"
                            icon={<Plus size={16} />}
                        />
                    </div>
                </div>

                {(calendar.keyDates || []).map((date, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-[#3a4a34] bg-[#111b14] px-4 md:px-5 py-4 md:py-5 space-y-3"
                    >
                        <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                            <span className="text-xs text-[#c7bc98]">Событие #{i + 1}</span>
                            <Button
                                variant="danger"
                                type="button"
                                onClick={() => removeKeyDate(i)}
                                icon={<Trash2 size={14} />}
                                className="shrink-0 !min-h-8 !w-8 !px-0 !py-0 !border-0 !bg-transparent !shadow-none hover:!bg-transparent"
                                aria-label="Удалить событие"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                                <label className="text-xs mb-1 block text-[#c2a774]">
                                    Название
                                </label>
                                <input
                                    className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                                    placeholder="Например, День Первого Восхождения"
                                    value={date.name}
                                    onChange={(e) => updateKeyDate(i, "name", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs mb-1 block text-[#c2a774]">
                                    День
                                </label>
                                <NumericInput
                                    min={1}
                                    className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                                    value={date.day}
                                    onCommit={(value) => updateKeyDate(i, "day", value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs mb-1 block text-[#c2a774]">
                                    Месяц
                                </label>
                                <NumericInput
                                    min={1}
                                    className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                                    value={date.month}
                                    onCommit={(value) => updateKeyDate(i, "month", value)}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-xs mb-1 block text-[#c2a774]">
                                    Описание
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-xl resize-none bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                                    placeholder="Короткая легенда, что произошло в этот день"
                                    value={date.description || ""}
                                    onChange={(e) =>
                                        updateKeyDate(i, "description", e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </section>

        </div>
    );
};