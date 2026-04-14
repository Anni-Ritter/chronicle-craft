import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useWorldStore } from '../../store/useWorldStore';
import { Button } from '../../components/ChronicleButton';
import { ChevronDown, ChevronUp, Globe2, Map, Users, Languages, Sparkles, Plus, Trash2 } from 'lucide-react';
import type { World } from '../../types/world';
import { useCalendarStore } from '../../store/useCalendarStore';
import { CalendarEditorForm } from '../../components/CalendarEditorForm';
import { StorageImageUploader } from '../../components/StorageImageUploader';

interface WorldFormProps {
    initialWorld?: World;
    onFinish?: () => void;
}

export const WorldForm = ({ initialWorld, onFinish }: WorldFormProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [details, setDetails] = useState<World['details']>({});
    const supabase = useSupabaseClient();
    const user = useUser();
    const { addWorld, updateWorld } = useWorldStore();
    const { calendar, setCalendar } = useCalendarStore();

    const textToArr = (str?: string | null) =>
        (str ?? '')
            .split(/[,\n]+/)
            .map(s => s.trim())
            .filter(Boolean);

    const arrToText = (arr?: string[] | null) =>
        arr && arr.length ? arr.join(', ') : '';

    const emptyCalendar = {
        daysInWeek: 7,
        monthsInYear: 12,
        daysInMonth: [],
        customWeekNames: [],
        customMonthNames: [],
        epochStart: { day: 1, month: 1, year: 0 },
        timeUnitNames: { day: 'день', week: 'неделя', month: 'месяц', year: 'год' },
        phases: [],
        keyDates: [],
    };

    const resetCalendar = () => setCalendar(emptyCalendar);

    useEffect(() => {
        if (initialWorld) {
            setName(initialWorld.name);
            setDescription(initialWorld.description || '');
            if (initialWorld.details) setDetails(initialWorld.details);
            if (initialWorld.calendar) setCalendar(initialWorld.calendar);
        } else {
            resetCalendar();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialWorld]);

    const processDetailsBeforeSave = (): World['details'] => {
        const d: any = details || {};

        return {
            ...d,

            continents: textToArr(d.continentsText),
            climateZones: textToArr(d.climateZonesText),
            landmarks: textToArr(d.landmarksText),

            races: (d.races || []).map((r: any) => ({
                ...r,
                traits: textToArr(r.traitsText ?? arrToText(r.traits)),
            })),

            languages: (d.languages || []).map((l: any) => ({
                ...l,
                spokenIn: textToArr(l.spokenInText ?? arrToText(l.spokenIn)),
            })),

            myths: textToArr(d.mythsText),
            laws: textToArr(d.lawsText),
            planesOfExistence: textToArr(d.planesOfExistenceText),
            magicalPhenomena: textToArr(d.magicalPhenomenaText),
            corruptionZones: textToArr(d.corruptionZonesText),
            themes: textToArr(d.themesText),
            inspirationSources: textToArr(d.inspirationSourcesText),

            countries: (d.countries || []).map((c: any) => ({
                ...c,
                alliances: textToArr(c.alliancesText ?? arrToText(c.alliances)),
                enemies: textToArr(c.enemiesText ?? arrToText(c.enemies)),
            })),

            religions: (d.religions || []).map((r: any) => ({
                ...r,
                rituals: textToArr(r.ritualsText ?? arrToText(r.rituals)),
                influence: textToArr(r.influenceText ?? arrToText(r.influence)),
            })),

            magicSystem: d.magicSystem
                ? {
                    source: d.magicSystem.source ?? '',
                    types: textToArr(
                        d.magicSystem.typesText ?? arrToText(d.magicSystem.types)
                    ),
                    accessibility: d.magicSystem.accessibility ?? '',
                    limitations: d.magicSystem.limitations,
                }
                : undefined,

            visualStyle: d.visualStyle
                ? {
                    architecture: d.visualStyle.architecture,
                    clothing: d.visualStyle.clothing,
                    colors: textToArr(
                        d.visualStyle.colorsText ?? arrToText(d.visualStyle.colors)
                    ),
                }
                : undefined,
        };
    };

    const handleSubmit = async () => {
        if (!user) return;

        const processedDetails = processDetailsBeforeSave();

        if (initialWorld) {
            const worldData: World = {
                ...initialWorld,
                user_id: user.id,
                name,
                description,
                calendar,
                details: processedDetails,
                id: initialWorld.id,
                created_at: initialWorld.created_at,
            };

            await updateWorld(worldData, supabase);
        } else {
            await addWorld(
                {
                    user_id: user.id,
                    name,
                    description,
                    calendar,
                    details: processedDetails,
                },
                supabase
            );
            resetCalendar();
        }

        if (onFinish) onFinish();
        setName('');
        setDescription('');
    };

    return (
        <form className="relative no-scrollbar overflow-x-hidden text-[#e5d9a5] font-lora shadow-lg max-w-full md:max-w-4xl mx-auto space-y-10">
            <header className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl tracking-wide flex items-center justify-center gap-2">
                    <Globe2 className="w-6 h-6 text-[#c2a774]" />
                    {initialWorld ? 'Редактировать мир' : 'Новый мир'}
                </h2>
                <p className="text-sm text-[#c7bc98] max-w-xl mx-auto">
                    Задай имя, атмосферу и структуру своему миру, а потом дополни его календарём и деталями.
                </p>
            </header>

            <section className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-[#e5d9a5]">
                    <Sparkles className="w-5 h-5 text-[#c2a774]" />
                    Основная информация
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm text-[#c2a774]">Название мира</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455]"
                            placeholder="Название мира"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm text-[#c2a774]">Описание</label>
                        <textarea
                            className="w-full px-4 py-3 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455] resize-none"
                            placeholder="Кратко опиши настроение мира, его особенности, магию, конфликты..."
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-[#e5d9a5]">
                            <Map className="w-5 h-5 text-[#c2a774]" />
                            Календарь мира
                        </h3>
                        <p className="text-xs text-[#c7bc98] max-w-md">
                            Настрой фэнтезийный календарь: длину месяцев, названия дней, ключевые даты и циклы.
                        </p>
                    </div>

                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            setShowCalendar((prev) => !prev);
                        }}
                        icon={showCalendar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        className="flex items-center gap-2 text-sm"
                    >
                        {showCalendar ? 'Скрыть календарь' : 'Открыть редактор'}
                    </Button>
                </div>

                {showCalendar && (
                    <div className="mt-4 rounded-2xl overflow-hidden">
                        <CalendarEditorForm />
                    </div>
                )}
            </section>

            {details && (
                <>
                    <section className="space-y-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold text-[#e5d9a5] flex items-center gap-2">
                                <Globe2 className="w-5 h-5 text-[#c2a774]" />
                                География и население
                            </h3>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-[#c2a774]">Материки</label>
                                <textarea
                                    placeholder="Перечисли континенты (через запятую или с новой строки)"
                                    className="w-full h-full px-4 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455] resize-none"
                                    value={details.continentsText ?? arrToText(details.continents)}
                                    onChange={(e) =>
                                        setDetails({ ...details, continentsText: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2 mt-4">
                                <label className="block text-sm font-medium text-[#c2a774]">Климатические зоны</label>
                                <textarea
                                    placeholder="Например: тропики, пустыни, умеренный климат"
                                    className="w-full h-full px-4 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455] resize-none"
                                    value={details.climateZonesText ?? arrToText(details.climateZones)}
                                    onChange={(e) =>
                                        setDetails({ ...details, climateZonesText: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2 mt-4">
                                <label className="block text-sm font-medium text-[#c2a774]">Знаковые объекты</label>
                                <textarea
                                    placeholder="Например: Гора Солнца, Башня Ветров"
                                    className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455] resize-none"
                                    value={details.landmarksText ?? arrToText(details.landmarks)}
                                    onChange={(e) =>
                                        setDetails({ ...details, landmarksText: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-lg font-semibold flex items-center gap-2 text-[#e5d9a5]">
                                    <Map className="w-5 h-5 text-[#c2a774]" />
                                    Страны
                                </h4>
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setDetails({
                                            ...details,
                                            countries: [...(details.countries || []), { name: '' }],
                                        });
                                    }}
                                    className="!min-h-8 !w-8 !px-0 !py-0 !border-0 !bg-transparent !text-[#c2a774] !shadow-none hover:!bg-transparent hover:!text-[#e5d9a5]"
                                    icon={<Plus size={16} />}
                                />
                            </div>

                            {(details.countries || []).map((country: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="border border-[#c2a77455] rounded-2xl p-4 space-y-2 bg-[#0e1b12] shadow-inner"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs text-[#c7bc98]">Страна #{idx + 1}</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const updated = (details.countries || []).filter((_, i) => i !== idx);
                                                setDetails({ ...details, countries: updated });
                                            }}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-red-300 transition hover:text-red-200"
                                            aria-label="Удалить страну"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Название страны"
                                        value={country.name}
                                        onChange={(e) => {
                                            const updated = [...(details.countries || [])];
                                            updated[idx] = { ...updated[idx], name: e.target.value };
                                            setDetails({ ...details, countries: updated });
                                        }}
                                    />
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Столица"
                                        value={country.capital || ''}
                                        onChange={(e) => {
                                            const updated = [...(details.countries || [])];
                                            updated[idx] = { ...updated[idx], capital: e.target.value };
                                            setDetails({ ...details, countries: updated });
                                        }}
                                    />
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Форма правления"
                                        value={country.government || ''}
                                        onChange={(e) => {
                                            const updated = [...(details.countries || [])];
                                            updated[idx] = { ...updated[idx], government: e.target.value };
                                            setDetails({ ...details, countries: updated });
                                        }}
                                    />
                                    <textarea
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                        placeholder="Описание страны"
                                        value={country.description || ''}
                                        onChange={(e) => {
                                            const updated = [...(details.countries || [])];
                                            updated[idx] = { ...updated[idx], description: e.target.value };
                                            setDetails({ ...details, countries: updated });
                                        }}
                                    />

                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Союзы (через запятую или с новой строки)"
                                        value={country.alliancesText ?? arrToText(country.alliances)}
                                        onChange={(e) => {
                                            const updated = [...(details.countries || [])];
                                            updated[idx] = { ...updated[idx], alliancesText: e.target.value };
                                            setDetails({ ...details, countries: updated });
                                        }}
                                    />
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Враги (через запятую или с новой строки)"
                                        value={country.enemiesText ?? arrToText(country.enemies)}
                                        onChange={(e) => {
                                            const updated = [...(details.countries || [])];
                                            updated[idx] = { ...updated[idx], enemiesText: e.target.value };
                                            setDetails({ ...details, countries: updated });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-lg font-semibold flex items-center gap-2 text-[#e5d9a5]">
                                    <Users className="w-5 h-5 text-[#c2a774]" />
                                    Расы
                                </h4>
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setDetails({
                                            ...details,
                                            races: [...(details.races || []), { name: '' }],
                                        });
                                    }}
                                    className="!min-h-8 !w-8 !px-0 !py-0 !border-0 !bg-transparent !text-[#c2a774] !shadow-none hover:!bg-transparent hover:!text-[#e5d9a5]"
                                    icon={<Plus size={16} />}
                                />
                            </div>

                            {(details.races || []).map((race: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="border border-[#c2a77455] rounded-2xl p-4 space-y-2 bg-[#0e1b12] shadow-inner"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs text-[#c7bc98]">Раса #{idx + 1}</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const updated = (details.races || []).filter((_, i) => i !== idx);
                                                setDetails({ ...details, races: updated });
                                            }}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-red-300 transition hover:text-red-200"
                                            aria-label="Удалить расу"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Название расы"
                                        value={race.name}
                                        onChange={(e) => {
                                            const updated = [...(details.races || [])];
                                            updated[idx] = { ...updated[idx], name: e.target.value };
                                            setDetails({ ...details, races: updated });
                                        }}
                                    />
                                    <textarea
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                        placeholder="Описание расы"
                                        value={race.description || ''}
                                        onChange={(e) => {
                                            const updated = [...(details.races || [])];
                                            updated[idx] = { ...updated[idx], description: e.target.value };
                                            setDetails({ ...details, races: updated });
                                        }}
                                    />
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Область обитания"
                                        value={race.region || ''}
                                        onChange={(e) => {
                                            const updated = [...(details.races || [])];
                                            updated[idx] = { ...updated[idx], region: e.target.value };
                                            setDetails({ ...details, races: updated });
                                        }}
                                    />
                                    <textarea
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                        placeholder="Черты (через запятую или с новой строки)"
                                        value={race.traitsText ?? arrToText(race.traits)}
                                        onChange={(e) => {
                                            const updated = [...(details.races || [])];
                                            updated[idx] = { ...updated[idx], traitsText: e.target.value };
                                            setDetails({ ...details, races: updated });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <label className="block mb-1 text-sm font-medium text-[#c2a774]">
                                Распределение населения
                            </label>
                            <textarea
                                className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455] resize-none"
                                placeholder="Например: густонаселённые побережья, редкие поселения в горах..."
                                value={details.populationDistribution || ''}
                                onChange={(e) => setDetails({ ...details, populationDistribution: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-lg font-semibold flex items_center gap-2 text-[#e5d9a5]">
                                    <Languages className="w-5 h-5 text-[#c2a774]" />
                                    Языки
                                </h4>
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setDetails({
                                            ...details,
                                            languages: [...(details.languages || []), { name: '' }],
                                        });
                                    }}
                                    className="!min-h-8 !w-8 !px-0 !py-0 !border-0 !bg-transparent !text-[#c2a774] !shadow-none hover:!bg-transparent hover:!text-[#e5d9a5]"
                                    icon={<Plus size={16} />}
                                />
                            </div>

                            {(details.languages || []).map((lang: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="border border-[#c2a77455] rounded-2xl p-4 space-y-2 bg-[#0e1b12] shadow-inner"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs text-[#c7bc98]">Язык #{idx + 1}</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const updated = (details.languages || []).filter((_, i) => i !== idx);
                                                setDetails({ ...details, languages: updated });
                                            }}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-red-300 transition hover:text-red-200"
                                            aria-label="Удалить язык"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Название языка"
                                        value={lang.name}
                                        onChange={(e) => {
                                            const updated = [...(details.languages || [])];
                                            updated[idx] = { ...updated[idx], name: e.target.value };
                                            setDetails({ ...details, languages: updated });
                                        }}
                                    />
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Письменность (алфавит, руны и т.п.)"
                                        value={lang.script || ''}
                                        onChange={(e) => {
                                            const updated = [...(details.languages || [])];
                                            updated[idx] = { ...updated[idx], script: e.target.value };
                                            setDetails({ ...details, languages: updated });
                                        }}
                                    />
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Где используется (через запятую или с новой строки)"
                                        value={lang.spokenInText ?? arrToText(lang.spokenIn)}
                                        onChange={(e) => {
                                            const updated = [...(details.languages || [])];
                                            updated[idx] = { ...updated[idx], spokenInText: e.target.value };
                                            setDetails({ ...details, languages: updated });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-xl font-semibold text-[#e5d9a5] flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#c2a774]" />
                            Мифология и религии
                        </h3>

                        <div className="space-y-2">
                            <label className="block mb-1 text-sm font-medium text-[#c2a774]">
                                Мифы и легенды
                            </label>
                            <textarea
                                className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455] resize-none"
                                placeholder="Короткие записи мифов, легенд и сказаний..."
                                value={details.mythsText ?? arrToText(details.myths)}
                                onChange={(e) => setDetails({ ...details, mythsText: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-lg font-semibold flex items-center gap-2 text-[#e5d9a5]">
                                    Пантеон богов
                                </h4>
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setDetails({
                                            ...details,
                                            pantheon: [...(details.pantheon || []), { name: '', domain: '' }],
                                        });
                                    }}
                                    className="!min-h-8 !w-8 !px-0 !py-0 !border-0 !bg-transparent !text-[#c2a774] !shadow-none hover:!bg-transparent hover:!text-[#e5d9a5]"
                                    icon={<Plus size={16} />}
                                />
                            </div>

                            {(details.pantheon || []).map((god: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="border border-[#c2a77455] rounded-2xl p-4 space-y-2 bg-[#0e1b12] shadow-inner"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs text-[#c7bc98]">Божество #{idx + 1}</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const updated = (details.pantheon || []).filter((_, i) => i !== idx);
                                                setDetails({ ...details, pantheon: updated });
                                            }}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-red-300 transition hover:text-red-200"
                                            aria-label="Удалить божество"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Имя божества"
                                        value={god.name}
                                        onChange={(e) => {
                                            const updated = [...(details.pantheon || [])];
                                            updated[idx] = { ...updated[idx], name: e.target.value };
                                            setDetails({ ...details, pantheon: updated });
                                        }}
                                    />
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Сфера влияния (война, мудрость, море...)"
                                        value={god.domain || ''}
                                        onChange={(e) => {
                                            const updated = [...(details.pantheon || [])];
                                            updated[idx] = { ...updated[idx], domain: e.target.value };
                                            setDetails({ ...details, pantheon: updated });
                                        }}
                                    />
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Символ (меч, змея, солнце...)"
                                        value={god.symbol || ''}
                                        onChange={(e) => {
                                            const updated = [...(details.pantheon || [])];
                                            updated[idx] = { ...updated[idx], symbol: e.target.value };
                                            setDetails({ ...details, pantheon: updated });
                                        }}
                                    />
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Моральное выравнивание (добрый, злой, нейтральный...)"
                                        value={god.alignment || ''}
                                        onChange={(e) => {
                                            const updated = [...(details.pantheon || [])];
                                            updated[idx] = { ...updated[idx], alignment: e.target.value };
                                            setDetails({ ...details, pantheon: updated });
                                        }}
                                    />
                                    <textarea
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                        placeholder="Описание, легенды, отношения с другими богами..."
                                        value={god.description || ''}
                                        onChange={(e) => {
                                            const updated = [...(details.pantheon || [])];
                                            updated[idx] = { ...updated[idx], description: e.target.value };
                                            setDetails({ ...details, pantheon: updated });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-lg font-semibold flex items-center gap-2 text-[#e5d9a5]">
                                    Религии и культы
                                </h4>
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setDetails({
                                            ...details,
                                            religions: [...(details.religions || []), { name: '', beliefs: '' }],
                                        });
                                    }}
                                    className="!min-h-8 !w-8 !px-0 !py-0 !border-0 !bg-transparent !text-[#c2a774] !shadow-none hover:!bg-transparent hover:!text-[#e5d9a5]"
                                    icon={<Plus size={16} />}
                                />
                            </div>

                            {(details.religions || []).map((rel: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="border border-[#c2a77455] rounded-2xl p-4 space-y-2 bg-[#0e1b12] shadow-inner"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs text-[#c7bc98]">Религия #{idx + 1}</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const updated = (details.religions || []).filter((_, i) => i !== idx);
                                                setDetails({ ...details, religions: updated });
                                            }}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-red-300 transition hover:text-red-200"
                                            aria-label="Удалить религию"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Название религии"
                                        value={rel.name}
                                        onChange={(e) => {
                                            const updated = [...(details.religions || [])];
                                            updated[idx] = { ...updated[idx], name: e.target.value };
                                            setDetails({ ...details, religions: updated });
                                        }}
                                    />
                                    <textarea
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                        placeholder="Основные верования"
                                        value={rel.beliefs || ''}
                                        onChange={(e) => {
                                            const updated = [...(details.religions || [])];
                                            updated[idx] = { ...updated[idx], beliefs: e.target.value };
                                            setDetails({ ...details, religions: updated });
                                        }}
                                    />
                                    <textarea
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                        placeholder="Обряды и ритуалы (через запятую или с новой строки)"
                                        value={rel.ritualsText ?? arrToText(rel.rituals)}
                                        onChange={(e) => {
                                            const updated = [...(details.religions || [])];
                                            updated[idx] = { ...updated[idx], ritualsText: e.target.value };
                                            setDetails({ ...details, religions: updated });
                                        }}
                                    />
                                    <textarea
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                        placeholder="На что влияет религия (страны, касты, сферы жизни)"
                                        value={rel.influenceText ?? arrToText(rel.influence)}
                                        onChange={(e) => {
                                            const updated = [...(details.religions || [])];
                                            updated[idx] = { ...updated[idx], influenceText: e.target.value };
                                            setDetails({ ...details, religions: updated });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-xl font-semibold text-[#e5d9a5] flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#c2a774]" />
                            Магия и артефакты
                        </h3>
                        <div className="space-y-2">
                            <label className="block mb-1 text-sm font-medium text-[#c2a774]">
                                Система магии
                            </label>
                            <div className="space-y-2 border border-[#3a4a34] rounded-2xl p-4 bg-[#0e1b12]">
                                <input
                                    className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                    placeholder="Источник силы (эфир, духи, кровь, ритуалы...)"
                                    value={details.magicSystem?.source || ''}
                                    onChange={(e) =>
                                        setDetails({
                                            ...details,
                                            magicSystem: {
                                                ...(details.magicSystem || {}),
                                                source: e.target.value,
                                            },
                                        })
                                    }
                                />
                                <textarea
                                    className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                    placeholder="Типы магии (школы, направления, элементы...)"
                                    value={
                                        details.magicSystem?.typesText ??
                                        arrToText(details.magicSystem?.types)
                                    }
                                    onChange={(e) =>
                                        setDetails({
                                            ...details,
                                            magicSystem: {
                                                ...(details.magicSystem || {}),
                                                typesText: e.target.value,
                                            },
                                        })
                                    }
                                />
                                <textarea
                                    className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                    placeholder="Кто может использовать магию"
                                    value={details.magicSystem?.accessibility || ''}
                                    onChange={(e) =>
                                        setDetails({
                                            ...details,
                                            magicSystem: {
                                                ...(details.magicSystem || {}),
                                                accessibility: e.target.value,
                                            },
                                        })
                                    }
                                />
                                <textarea
                                    className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                    placeholder="Ограничения, цена, побочные эффекты"
                                    value={details.magicSystem?.limitations || ''}
                                    onChange={(e) =>
                                        setDetails({
                                            ...details,
                                            magicSystem: {
                                                ...(details.magicSystem || {}),
                                                limitations: e.target.value,
                                            },
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-lg font-semibold flex items-center gap-2 text-[#e5d9a5]">
                                    Магические артефакты
                                </h4>
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setDetails({
                                            ...details,
                                            artifacts: [...(details.artifacts || []), { name: '', power: '' }],
                                        });
                                    }}
                                    className="!min-h-8 !w-8 !px-0 !py-0 !border-0 !bg-transparent !text-[#c2a774] !shadow-none hover:!bg-transparent hover:!text-[#e5d9a5]"
                                    icon={<Plus size={16} />}
                                />
                            </div>

                            {(details.artifacts || []).map((art: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="border border-[#c2a77455] rounded-2xl p-4 space-y-2 bg-[#0e1b12] shadow-inner"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs text-[#c7bc98]">Артефакт #{idx + 1}</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const updated = (details.artifacts || []).filter((_, i) => i !== idx);
                                                setDetails({ ...details, artifacts: updated });
                                            }}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-red-300 transition hover:text-red-200"
                                            aria-label="Удалить артефакт"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Название артефакта"
                                        value={art.name}
                                        onChange={(e) => {
                                            const updated = [...(details.artifacts || [])];
                                            updated[idx] = { ...updated[idx], name: e.target.value };
                                            setDetails({ ...details, artifacts: updated });
                                        }}
                                    />
                                    <textarea
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                        placeholder="Сила / эффект артефакта"
                                        value={art.power || ''}
                                        onChange={(e) => {
                                            const updated = [...(details.artifacts || [])];
                                            updated[idx] = { ...updated[idx], power: e.target.value };
                                            setDetails({ ...details, artifacts: updated });
                                        }}
                                    />
                                    <textarea
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                        placeholder="История артефакта"
                                        value={art.history || ''}
                                        onChange={(e) => {
                                            const updated = [...(details.artifacts || [])];
                                            updated[idx] = { ...updated[idx], history: e.target.value };
                                            setDetails({ ...details, artifacts: updated });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-xl font-semibold text-[#e5d9a5] flex items-center gap-2">
                            Общество и экономика
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block mb-1 text-sm font-medium text-[#c2a774]">
                                    Уровень технологии
                                </label>
                                <input
                                    className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                    placeholder="Например: средневековье, стимпанк, космоопера..."
                                    value={details.technologyLevel || ''}
                                    onChange={(e) =>
                                        setDetails({ ...details, technologyLevel: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block mb-1 text-sm font-medium text-[#c2a774]">
                                    Соотношение технологий и магии
                                </label>
                                <input
                                    className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                    placeholder="Магия вытеснила технологии, сосуществуют, в конфликте..."
                                    value={details.techVsMagic || ''}
                                    onChange={(e) =>
                                        setDetails({ ...details, techVsMagic: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block mb-1 text-sm font-medium text-[#c2a774]">
                                Социальная иерархия
                            </label>
                            <textarea
                                className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455] resize-none"
                                placeholder="Касты, классы, роли — кто выше, кто ниже, как устроено общество"
                                value={details.socialHierarchy || ''}
                                onChange={(e) =>
                                    setDetails({ ...details, socialHierarchy: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block mb-1 text-sm font-medium text-[#c2a774]">
                                Экономика
                            </label>
                            <textarea
                                className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455] resize-none"
                                placeholder="Какие ресурсы важны, торговые пути, города-торговцы..."
                                value={details.economy || ''}
                                onChange={(e) => setDetails({ ...details, economy: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-lg font-semibold flex items-center gap-2 text-[#e5d9a5]">
                                    Валюты
                                </h4>
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setDetails({
                                            ...details,
                                            currencies: [...(details.currencies || []), { name: '', symbol: '' }],
                                        });
                                    }}
                                    className="!min-h-8 !w-8 !px-0 !py-0 !border-0 !bg-transparent !text-[#c2a774] !shadow-none hover:!bg-transparent hover:!text-[#e5d9a5]"
                                    icon={<Plus size={16} />}
                                />
                            </div>

                            {(details.currencies || []).map((cur: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="border border-[#c2a77455] rounded-2xl p-4 space-y-2 bg-[#0e1b12] shadow-inner"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs text-[#c7bc98]">Валюта #{idx + 1}</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const updated = (details.currencies || []).filter((_, i) => i !== idx);
                                                setDetails({ ...details, currencies: updated });
                                            }}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-red-300 transition hover:text-red-200"
                                            aria-label="Удалить валюту"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Название валюты"
                                        value={cur.name}
                                        onChange={(e) => {
                                            const updated = [...(details.currencies || [])];
                                            updated[idx] = { ...updated[idx], name: e.target.value };
                                            setDetails({ ...details, currencies: updated });
                                        }}
                                    />
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Символ (знак)"
                                        value={cur.symbol}
                                        onChange={(e) => {
                                            const updated = [...(details.currencies || [])];
                                            updated[idx] = { ...updated[idx], symbol: e.target.value };
                                            setDetails({ ...details, currencies: updated });
                                        }}
                                    />
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Отношение к другим валютам (опционально)"
                                        value={cur.valueRelative || ''}
                                        onChange={(e) => {
                                            const updated = [...(details.currencies || [])];
                                            updated[idx] = { ...updated[idx], valueRelative: e.target.value };
                                            setDetails({ ...details, currencies: updated });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <label className="block mb-1 text-sm font-medium text-[#c2a774]">
                                Ключевые законы мира
                            </label>
                            <textarea
                                className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455] resize-none"
                                placeholder="Основные законы, табу, кодексы (через запятую или с новой строки)"
                                value={details.lawsText ?? arrToText(details.laws)}
                                onChange={(e) => setDetails({ ...details, lawsText: e.target.value })}
                            />
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-xl font-semibold text-[#e5d9a5] flex items-center gap-2">
                            Фракции, планы бытия и мотивы мира
                        </h3>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-lg font-semibold flex items-center gap-2 text-[#e5d9a5]">
                                    Организации и фракции
                                </h4>
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setDetails({
                                            ...details,
                                            organizations: [
                                                ...(details.organizations || []),
                                                { name: '', type: '' },
                                            ],
                                        });
                                    }}
                                    className="!min-h-8 !w-8 !px-0 !py-0 !border-0 !bg-transparent !text-[#c2a774] !shadow-none hover:!bg-transparent hover:!text-[#e5d9a5]"
                                    icon={<Plus size={16} />}
                                />
                            </div>

                            {(details.organizations || []).map((org: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="border border-[#c2a77455] rounded-2xl p-4 space-y-2 bg-[#0e1b12] shadow-inner"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs text-[#c7bc98]">Организация #{idx + 1}</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const updated = (details.organizations || []).filter((_, i) => i !== idx);
                                                setDetails({ ...details, organizations: updated });
                                            }}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-red-300 transition hover:text-red-200"
                                            aria-label="Удалить организацию"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Название"
                                        value={org.name}
                                        onChange={(e) => {
                                            const updated = [...(details.organizations || [])];
                                            updated[idx] = { ...updated[idx], name: e.target.value };
                                            setDetails({ ...details, organizations: updated });
                                        }}
                                    />
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                        placeholder="Тип (гильдия, клан, орден, культ...)"
                                        value={org.type}
                                        onChange={(e) => {
                                            const updated = [...(details.organizations || [])];
                                            updated[idx] = { ...updated[idx], type: e.target.value };
                                            setDetails({ ...details, organizations: updated });
                                        }}
                                    />
                                    <textarea
                                        className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                        placeholder="Влияние на общество, цели, методы"
                                        value={org.influence || ''}
                                        onChange={(e) => {
                                            const updated = [...(details.organizations || [])];
                                            updated[idx] = { ...updated[idx], influence: e.target.value };
                                            setDetails({ ...details, organizations: updated });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <label className="block mb-1 text-sm font-medium text-[#c2a774]">
                                Планы бытия и иные измерения
                            </label>
                            <textarea
                                className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455] resize-none"
                                placeholder="Астральный план, преисподняя, мир духов и т.п."
                                value={details.planesOfExistenceText ?? arrToText(details.planesOfExistence)}
                                onChange={(e) =>
                                    setDetails({
                                        ...details,
                                        planesOfExistenceText: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block mb-1 text-sm font-medium text-[#c2a774]">
                                Магические феномены
                            </label>
                            <textarea
                                className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455] resize-none"
                                placeholder="Кометы, искажения, магические бури, разломы реальности..."
                                value={details.magicalPhenomenaText ?? arrToText(details.magicalPhenomena)}
                                onChange={(e) =>
                                    setDetails({
                                        ...details,
                                        magicalPhenomenaText: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block mb-1 text-sm font-medium text-[#c2a774]">
                                Зоны порчи / тьмы / хаоса
                            </label>
                            <textarea
                                className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455] resize-none"
                                placeholder="Опасные регионы, заражённые территории..."
                                value={details.corruptionZonesText ?? arrToText(details.corruptionZones)}
                                onChange={(e) =>
                                    setDetails({
                                        ...details,
                                        corruptionZonesText: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block mb-1 text-sm font-medium text-[#c2a774]">
                                    Темы и мотивы мира
                                </label>
                                <textarea
                                    className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455] resize-none"
                                    placeholder="Упадок, возрождение, тайна, революция..."
                                    value={details.themesText ?? arrToText(details.themes)}
                                    onChange={(e) =>
                                        setDetails({
                                            ...details,
                                            themesText: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block mb-1 text-sm font-medium text-[#c2a774]">
                                    Источники вдохновения
                                </label>
                                <textarea
                                    className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77455] resize-none"
                                    placeholder="Книги, игры, культуры, исторические периоды..."
                                    value={details.inspirationSourcesText ?? arrToText(details.inspirationSources)}
                                    onChange={(e) =>
                                        setDetails({
                                            ...details,
                                            inspirationSourcesText: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-xl font-semibold text-[#e5d9a5] flex items-center gap-2">
                            Визуальный стиль и карта мира
                        </h3>

                        <div className="space-y-2">
                            <label className="block mb-1 text-sm font-medium text-[#c2a774]">
                                Ссылка на карту мира
                            </label>
                            <StorageImageUploader
                                bucket="map"
                                pathPrefix={user?.id}
                                initialUrl={details.worldMapImage || undefined}
                                onUpload={(url) => setDetails({ ...details, worldMapImage: url })}
                                emptyLabel="Загрузить изображение карты"
                                previewClassName="h-44 w-full rounded-xl object-cover border border-[#3a4a34]"
                            />
                            <input
                                className="w-full px-3 py-2 rounded-xl bg-[#0e1b12] border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455]"
                                placeholder="...или вставьте URL вручную"
                                value={details.worldMapImage || ''}
                                onChange={(e) =>
                                    setDetails({ ...details, worldMapImage: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-3 border border-[#3a4a34] rounded-2xl p-4 bg-[#0e1b12]">
                            <p className="text-sm font-medium text-[#c2a774] mb-1">
                                Визуальный стиль мира
                            </p>

                            <textarea
                                className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                placeholder="Архитектура: формы, материалы, стиль городов..."
                                value={details.visualStyle?.architecture || ''}
                                onChange={(e) =>
                                    setDetails({
                                        ...details,
                                        visualStyle: {
                                            ...(details.visualStyle || {}),
                                            architecture: e.target.value,
                                        },
                                    })
                                }
                            />

                            <textarea
                                className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                placeholder="Одежда: силуэты, ткани, отличительные детали..."
                                value={details.visualStyle?.clothing || ''}
                                onChange={(e) =>
                                    setDetails({
                                        ...details,
                                        visualStyle: {
                                            ...(details.visualStyle || {}),
                                            clothing: e.target.value,
                                        },
                                    })
                                }
                            />

                            <textarea
                                className="w-full px-3 py-2 rounded-xl bg-transparent border border-[#3a4a34] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-1 focus:ring-[#c2a77455] resize-none"
                                placeholder="Палитра мира: основные цвета, оттенки, настроение"
                                value={
                                    details.visualStyle?.colorsText ??
                                    arrToText(details.visualStyle?.colors)
                                }
                                onChange={(e) =>
                                    setDetails({
                                        ...details,
                                        visualStyle: {
                                            ...(details.visualStyle || {}),
                                            colorsText: e.target.value,
                                        },
                                    })
                                }
                            />
                        </div>
                    </section>
                </>
            )}

            <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] right-3 z-40 sm:right-4">
                <Button
                    onClick={handleSubmit}
                    className="justify-center font-semibold shadow-[0_4px_20px_rgba(194,167,116,0.2)] !text-sm !px-3.5 !py-1.5 !min-h-10"
                >
                    {initialWorld ? 'Сохранить мир' : 'Создать мир'}
                </Button>
            </div>
        </form>
    );
};
