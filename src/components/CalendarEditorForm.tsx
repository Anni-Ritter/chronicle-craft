import { CircleQuestionMark, Dices, Plus, Save, Trash2 } from "lucide-react";
import { useCalendarStore } from "../store/useCalendarStore";
import { Button } from "./ChronicleButton";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

interface Props {
    onSave: (calendar: any) => void;
    onCancel: () => void;
}

export const CalendarEditorForm: React.FC<Props> = ({ onSave }) => {
    const { calendar, updateField } = useCalendarStore();
    const supabase = useSupabaseClient();
    const getRandomColor = () => {
        return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    };

    const handleGenerateWeekNames = async () => {
        const { data, error } = await supabase.functions.invoke('generate-calendar-part', {
            body: {
                text: `Придумай ${calendar.daysInWeek} уникальных названий дней недели в фэнтезийном мире. Только список, без нумерации.`
            }
        });

        if (error) {
            console.error('Ошибка генерации:', error);
            return;
        }

        const names = (data?.result || '')
            .split('\n')
            .map((name: string) => name.trim())
            .filter((name: string) => name.length > 0);

        updateField('customWeekNames', names.slice(0, calendar.daysInWeek));
    };

    const handleGenerateMonthNames = async () => {
        const { data, error } = await supabase.functions.invoke('generate-calendar-part', {
            body: {
                text: `Придумай ${calendar.monthsInYear} названий месяцев в фэнтезийном стиле. Только список, без нумерации.`
            }
        });

        if (error) {
            console.error('Ошибка генерации месяцев:', error);
            return;
        }

        const names = (data?.result || '')
            .split('\n')
            .map((name: string) => name.trim())
            .filter((name: string) => name.length > 0);

        updateField('customMonthNames', names.slice(0, calendar.monthsInYear));
    };

    const handleGenerateTimeUnits = async () => {
        const { data, error } = await supabase.functions.invoke('generate-calendar-part', {
            body: {
                text: `Придумай фэнтезийные названия для единиц времени: день, неделя, месяц, год. Ответь списком в том же порядке.`
            }
        });

        if (error) {
            console.error('Ошибка генерации единиц времени:', error);
            return;
        }

        const lines = (data?.result || '').split('\n').map((l: string) => l.trim()).filter(Boolean);

        updateField('timeUnitNames', {
            day: lines[0] || '',
            week: lines[1] || '',
            month: lines[2] || '',
            year: lines[3] || ''
        });
    };

    const handleArrayChange = (key: 'customWeekNames' | 'customMonthNames', index: number, value: string) => {
        const newArray = [...(calendar[key] || [])];
        newArray[index] = value;
        updateField(key, newArray);
    };

    const handleUnitChange = (unit: 'day' | 'week' | 'month' | 'year', value: string) => {
        updateField('timeUnitNames', { ...calendar.timeUnitNames, [unit]: value });
    };

    const handleEpochStartChange = (key: 'day' | 'month' | 'year', value: number) => {
        updateField('epochStart', { ...calendar.epochStart, [key]: value } as { day: number; month: number; year: number });
    };

    const updatePhases = (index: number, key: string, value: any) => {
        const updated = [...(calendar.phases || [])];
        updated[index] = { ...updated[index], [key]: value };
        updateField('phases', updated);
    };

    const removePhase = (index: number) => {
        const updated = [...(calendar.phases || [])];
        updated.splice(index, 1);
        updateField('phases', updated);
    };

    const addPhase = () => {
        updateField('phases', [...(calendar.phases || []), { name: '', fromDay: 1, toDay: 1 }]);
    };

    const updateKeyDate = (index: number, key: string, value: any) => {
        const updated = [...(calendar.keyDates || [])];
        updated[index] = { ...updated[index], [key]: value };
        updateField('keyDates', updated);
    };

    const removeKeyDate = (index: number) => {
        const updated = [...(calendar.keyDates || [])];
        updated.splice(index, 1);
        updateField('keyDates', updated);
    };

    const addKeyDate = () => {
        updateField('keyDates', [...(calendar.keyDates || []), { name: '', day: 1, month: 1 }]);
    };

    return (
        <div className="text-[#e5d9a5] font-lora px-3 py-5 md:py-10 space-y-10">
            <h2 className="text-2xl text-center tracking-wide">Редактор календаря</h2>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] shadow-md space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                        <span className="block mb-1">Дней в неделе</span>
                        <input
                            type="number"
                            className="w-full px-4 py-2 rounded-lg bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                            value={calendar.daysInWeek}
                            onChange={(e) => updateField('daysInWeek', +e.target.value)}
                        />
                    </label>
                    <label className="block">
                        <span className="block mb-1">Месяцев в году</span>
                        <input
                            type="number"
                            className="w-full px-4 py-2 rounded-lg bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                            value={calendar.monthsInYear}
                            onChange={(e) => updateField('monthsInYear', +e.target.value)}
                        />
                    </label>
                </div>
            </section>
            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] shadow-md">
                <label className="block mb-2">Текущий год:</label>
                <input
                    type="number"
                    placeholder="Год (например, 1 или 2025)"
                    className="w-full px-4 py-2 rounded-lg bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                    value={calendar.currentYear ? Number(calendar.currentYear) : ''}
                    onChange={(e) => updateField('currentYear', +e.target.value)}
                />
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] shadow-md">
                <label className="block mb-2">Количество дней в каждом месяце:</label>
                <div className="grid gap-2">
                    {Array.from({ length: calendar.monthsInYear }).map((_, i) => (
                        <input
                            key={i}
                            type="number"
                            min={1}
                            className="w-full px-4 py-2 rounded-lg bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                            placeholder={`Дней в месяце ${i + 1}`}
                            value={calendar.daysInMonth?.[i] ? Number(calendar.daysInMonth[i]) : ''}
                            onChange={(e) => {
                                const updated = [...(calendar.daysInMonth || [])];
                                updated[i] = +e.target.value;
                                updateField('daysInMonth', updated);
                            }}
                        />
                    ))}
                </div>
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] shadow-md">
                <label className="block mb-2">Названия дней недели:</label>
                <Button
                    variant="ghost"
                    type="button"
                    className="gap-2 mb-4 text-sm"
                    icon={<Dices size={16} />}
                    onClick={handleGenerateWeekNames}
                >
                    Сгенерировать
                </Button>
                <div className="grid gap-2">
                    {Array.from({ length: calendar.daysInWeek }).map((_, i) => (
                        <input
                            key={i}
                            className="w-full px-4 py-2 rounded-lg bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                            placeholder={`День ${i + 1}`}
                            value={calendar.customWeekNames?.[i] || ''}
                            onChange={(e) => handleArrayChange('customWeekNames', i, e.target.value)}
                        />
                    ))}
                </div>
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] shadow-md">
                <label className="block mb-2">Названия месяцев:</label>
                <Button
                    variant="ghost"
                    type="button"
                    icon={<Dices size={16} />}
                    className="mb-4 text-sm"
                    onClick={handleGenerateMonthNames}
                >
                    Сгенерировать
                </Button>
                <div className="grid gap-2">
                    {Array.from({ length: calendar.monthsInYear }).map((_, i) => (
                        <input
                            key={i}
                            className="w-full px-4 py-2 rounded-lg bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                            placeholder={`Месяц ${i + 1}`}
                            value={calendar.customMonthNames?.[i] || ''}
                            onChange={(e) => handleArrayChange('customMonthNames', i, e.target.value)}
                        />
                    ))}
                </div>
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] shadow-md">
                <label className="block mb-2">Единицы измерения:</label>
                <Button
                    variant="ghost"
                    icon={<Dices size={16} />}
                    type="button"
                    className="flex items-center gap-2 mb-4 text-sm"
                    onClick={handleGenerateTimeUnits}
                >
                    Сгенерировать
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(['day', 'week', 'month', 'year'] as const).map((unit) => (
                        <div key={unit}>
                            <label className="text-sm block mb-1 text-[#c2a774]">
                                {unit === 'day' && 'Название для "дня"'}
                                {unit === 'week' && 'Название для "недели"'}
                                {unit === 'month' && 'Название для "месяца"'}
                                {unit === 'year' && 'Название для "года"'}
                            </label>
                            <input
                                key={unit}
                                className="w-full px-4 py-2 rounded-lg bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                                placeholder={unit}
                                value={calendar.timeUnitNames?.[unit] || ''}
                                onChange={(e) => handleUnitChange(unit, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] shadow-md">
                <label className="block mb-2">Начало эпохи:</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="number"
                        placeholder="День"
                        className="w-full px-4 py-2 rounded-lg bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                        value={calendar.epochStart?.day || ''}
                        onChange={(e) => handleEpochStartChange('day', +e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Месяц"
                        className="w-full px-4 py-2 rounded-lg bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                        value={calendar.epochStart?.month || ''}
                        onChange={(e) => handleEpochStartChange('month', +e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Год"
                        className="w-full px-4 py-2 rounded-lg bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                        value={calendar.epochStart?.year || ''}
                        onChange={(e) => handleEpochStartChange('year', +e.target.value)}
                    />
                </div>
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] shadow-md space-y-4">

                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <label className="block mb-1 text-[#c2a774]">Фазы</label>
                            <span className="relative group">
                                <span className="text-[#c2a774] cursor-help"><CircleQuestionMark /></span>
                                <span className="absolute z-10 w-64 text-sm text-left invisible group-hover:visible bg-[#1f2b1f] text-[#f5e9c6] border border-[#c2a774] px-3 py-2 rounded-xl shadow-md top-6 left-0">
                                    Фазы — это уникальные периоды в течение месяца (например, фазы луны, времена года и т.д.), которые задаются по дням. Можно указать цвет и описание.
                                </span>
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={async () => {
                                const { data, error } = await supabase.functions.invoke('generate-calendar-part', {
                                    body: {
                                        text: `Придумай ${calendar.phases?.length || 0} названий фаз, связанных с природными циклами (луна, сезоны, магия и т.п.). Только список, без нумерации.`
                                    }
                                });

                                if (error) {
                                    console.error('Ошибка генерации фаз:', error);
                                    return;
                                }

                                const names = (data?.result || '').split('\n').map((s: string) => s.trim()).filter(Boolean);

                                const updated = (calendar.phases || []).map((phase, i) => ({
                                    ...phase,
                                    name: names[i] || phase.name,
                                    color: phase.color || getRandomColor(),
                                }));

                                updateField('phases', updated);
                            }}
                            icon={<Dices size={16} />}
                            className="gap-2 mb-4 text-sm"
                        >
                            Сгенерировать названия
                        </Button>
                    </div>
                    <Button onClick={addPhase} className="max-sm:hidden text-base" icon={<Plus size={16} />}>Добавить</Button>
                    <Button onClick={addPhase} className="md:hidden" icon={<Plus size={16} />}></Button>
                </div>

                {(calendar.phases || []).map((phase, i) => (
                    <div
                        key={i}
                        className="relative border border-[#c2a774] rounded-2xl bg-[#1a2a1a] px-5 py-6 shadow-inner hover:shadow-lg transition-all"
                    >
                        <Button
                            variant="danger"
                            type="button"
                            onClick={() => removePhase(i)}
                            icon={<Trash2 size={16} />}
                            className="absolute top-3 right-3 p-1 opacity-70 hover:opacity-100 transition"
                        />

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-sm mb-1 block text-[#c2a774]">Название</label>
                                <input
                                    className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77466]"
                                    placeholder="Название"
                                    value={phase.name}
                                    onChange={(e) => updatePhases(i, 'name', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-sm mb-1 block text-[#c2a774]">Цвет (hex)</label>
                                <input
                                    className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50 focus:outline-none"
                                    placeholder="#ffaa00"
                                    value={phase.color || ''}
                                    onChange={(e) => updatePhases(i, 'color', e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-sm mb-1 block text-[#c2a774]">С дня</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                                        value={phase.fromDay}
                                        onChange={(e) => updatePhases(i, 'fromDay', +e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm mb-1 block text-[#c2a774]">До дня</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                                        value={phase.toDay}
                                        onChange={(e) => updatePhases(i, 'toDay', +e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] shadow-md space-y-4">

                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <label className="block mb-1 text-[#c2a774]">Ключевые даты</label>
                            <span className="relative group">
                                <span className="text-[#c2a774] cursor-help"><CircleQuestionMark /></span>
                                <span className="absolute z-10 w-64 text-sm text-left invisible group-hover:visible bg-[#1f2b1f] text-[#f5e9c6] border border-[#c2a774] px-3 py-2 rounded-xl shadow-md top-6 left-0">
                                    Ключевые даты — это важные события в мире: праздники, катастрофы, годовщины. Можно указать описание, день и месяц, а также привязать к хронике.
                                </span>
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={async () => {
                                const { data, error } = await supabase.functions.invoke('generate-calendar-part', {
                                    body: {
                                        text: `Придумай ${calendar.keyDates?.length || 0} названий и описаний для ключевых событий в фэнтезийном мире. Ответь списком в формате "Название — Краткое описание".`
                                    }
                                });

                                if (error) {
                                    console.error('Ошибка генерации описаний дат:', error);
                                    return;
                                }

                                const entries = (data?.result || '').split('\n').map((s: string) => s.trim()).filter(Boolean);
                                const updated = (calendar.keyDates || []).map((d, i) => {
                                    const [name, desc] = entries[i]?.split('—') ?? [];
                                    return {
                                        ...d,
                                        name: name?.trim() || d.name,
                                        description: desc?.trim() || d.description
                                    };
                                });

                                updateField('keyDates', updated);
                            }}
                            className="gap-2 mb-4 text-sm"
                            icon={<Dices size={16} />}
                        >
                            Сгенерировать описания
                        </Button>
                    </div>
                    <Button onClick={addKeyDate} className="max-sm:hidden text-base" icon={<Plus size={16} />}>Добавить</Button>
                    <Button onClick={addKeyDate} className="md:hidden" icon={<Plus size={16} />}></Button>
                </div>

                {(calendar.keyDates || []).map((date, i) => (
                    <div
                        key={i}
                        className="relative border border-[#c2a774] rounded-2xl bg-[#1a2a1a] px-5 py-6 shadow-inner hover:shadow-lg transition-all"
                    >
                        <Button
                            variant="danger"
                            type="button"
                            onClick={() => removeKeyDate(i)}
                            icon={<Trash2 size={16} />}
                            className="absolute top-3 right-3 opacity-70 p-1 hover:opacity-100 transition"
                        />

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-sm mb-1 block text-[#c2a774]">Название</label>
                                <input
                                    className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                                    placeholder="Название"
                                    value={date.name}
                                    onChange={(e) => updateKeyDate(i, 'name', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-sm mb-1 block text-[#c2a774]">День</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                                    value={date.day}
                                    onChange={(e) => updateKeyDate(i, 'day', +e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-sm mb-1 block text-[#c2a774]">Месяц</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                                    value={date.month}
                                    onChange={(e) => updateKeyDate(i, 'month', +e.target.value)}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="text-sm mb-1 block text-[#c2a774]">Описание</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-xl resize-none bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                                    placeholder="Описание"
                                    value={date.description || ''}
                                    onChange={(e) => updateKeyDate(i, 'description', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => onSave(calendar)} icon={<Save size={20} className="max-sm:w-4 max-sm:h-4" />} className="gap-2 mb-4 max-sm:text-sm">Сохранить календарь</Button>
            </div>
        </div>
    );
};
