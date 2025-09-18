import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useWorldStore } from '../../store/useWorldStore';
import { Button } from '../../components/ChronicleButton';
import { ChevronDown, ChevronUp, Globe2 } from 'lucide-react';
import type { World } from '../../types/world';
import { useCalendarStore } from '../../store/useCalendarStore';
import { CalendarEditorForm } from '../../components/CalendarEditorForm';

interface Props {
    initialWorld?: World;
    onFinish?: () => void;
}

export const WorldForm: React.FC<Props> = ({ initialWorld, onFinish }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [details, setDetails] = useState<World['details']>({});
    const supabase = useSupabaseClient();
    const user = useUser();
    const { addWorld, updateWorld } = useWorldStore();
    const { calendar, setCalendar } = useCalendarStore();
    const emptyCalendar = {
        daysInWeek: 7,
        monthsInYear: 12,
        daysInMonth: [],
        customWeekNames: [],
        customMonthNames: [],
        epochStart: { day: 1, month: 1, year: 0 },
        timeUnitNames: { day: "день", week: "неделя", month: "месяц", year: "год" },
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
    }, [initialWorld]);

    const handleSubmit = async () => {
        if (!user) return;

        if (initialWorld) {
            const worldData: World = {
                ...initialWorld,
                user_id: user.id,
                name,
                description,
                calendar,
                details,
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
                    details,
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
        <form className="bg-[#0e1b12] max-h-[90vh] no-scrollbar overflow-y-auto text-[#e5d9a5] font-lora border border-[#c2a774] rounded-3xl shadow-lg px-3 md:px-6 py-10 max-w-full md:max-w-3xl mx-auto space-y-10">
            <h2 className="text-2xl text-center tracking-wide flex items-center justify-center gap-2">
                <Globe2 /> {initialWorld ? 'Редактировать мир' : 'Новый мир'}
            </h2>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] shadow-md">
                <label className="block mb-2">Название мира</label>
                <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                    placeholder="Введите название"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] shadow-md">
                <label className="block mb-2">Описание</label>
                <textarea
                    className="w-full px-4 py-2 rounded-lg bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                    placeholder="Краткое описание мира"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </section>
            <div>
                <Button
                    onClick={(e) => {
                        e.preventDefault();
                        setShowCalendar(!showCalendar);
                    }}
                    icon={showCalendar ? <ChevronUp /> : <ChevronDown />}
                    className="flex items-center gap-2 flex-row"
                >
                    Календарь мира
                </Button>
                {showCalendar && (
                    <div className="mt-4">
                        <CalendarEditorForm
                            onCancel={() => setShowCalendar(false)}
                            onSave={(data) => {
                                setShowCalendar(false);
                                setCalendar(data);
                            }}
                        />
                    </div>
                )}
            </div>

            {details &&
                <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] shadow-md space-y-6">
                    <h3 className="text-xl font-semibold text-[#e5d9a5]">🌍 География и население</h3>
                    <div>
                        <label className="block mb-2 font-medium">Материки</label>
                        <textarea
                            placeholder="Перечислите континенты через запятую"
                            className="w-full px-4 py-2 rounded bg-[#0e1b12] border border-[#c2a774] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50"
                            value={details.continents?.join(', ') || ''}
                            onChange={(e) =>
                                setDetails({ ...details, continents: e.target.value.split(',').map(s => s.trim()) })
                            }
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">Климатические зоны</label>
                        <textarea
                            placeholder="Например: тропики, пустыни, умеренный климат"
                            className="w-full px-4 py-2 rounded bg-[#0e1b12] border border-[#c2a774] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50"
                            value={details.climateZones?.join(', ') || ''}
                            onChange={(e) =>
                                setDetails({ ...details, climateZones: e.target.value.split(',').map(s => s.trim()) })
                            }
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">Знаковые объекты</label>
                        <textarea
                            placeholder="Например: Гора Солнца, Башня Ветров"
                            className="w-full px-4 py-2 rounded bg-[#0e1b12] border border-[#c2a774] text-[#f5e9c6] placeholder:text-[#f5e9c6]/50"
                            value={details.landmarks?.join(', ') || ''}
                            onChange={(e) =>
                                setDetails({ ...details, landmarks: e.target.value.split(',').map(s => s.trim()) })
                            }
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">Страны</label>
                        {(details.countries || []).map((country, idx) => (
                            <div key={idx} className="border border-[#c2a774] rounded p-3 mb-3 space-y-2 bg-[#0e1b12]">
                                <input
                                    className="w-full px-3 py-1 rounded bg-transparent border border-[#c2a774] text-[#f5e9c6]"
                                    placeholder="Название страны"
                                    value={country.name}
                                    onChange={(e) => {
                                        const updated = [...(details.countries || [])];
                                        updated[idx].name = e.target.value;
                                        setDetails({ ...details, countries: updated });
                                    }}
                                />
                                <input
                                    className="w-full px-3 py-1 rounded bg-transparent border border-[#c2a774] text-[#f5e9c6]"
                                    placeholder="Столица"
                                    value={country.capital || ''}
                                    onChange={(e) => {
                                        const updated = [...(details.countries || [])];
                                        updated[idx].capital = e.target.value;
                                        setDetails({ ...details, countries: updated });
                                    }}
                                />
                                <input
                                    className="w-full px-3 py-1 rounded bg-transparent border border-[#c2a774] text-[#f5e9c6]"
                                    placeholder="Форма правления"
                                    value={country.government || ''}
                                    onChange={(e) => {
                                        const updated = [...(details.countries || [])];
                                        updated[idx].government = e.target.value;
                                        setDetails({ ...details, countries: updated });
                                    }}
                                />
                                <textarea
                                    className="w-full px-3 py-1 rounded bg-transparent border border-[#c2a774] text-[#f5e9c6]"
                                    placeholder="Описание страны"
                                    value={country.description || ''}
                                    onChange={(e) => {
                                        const updated = [...(details.countries || [])];
                                        updated[idx].description = e.target.value;
                                        setDetails({ ...details, countries: updated });
                                    }}
                                />
                            </div>
                        ))}
                        <Button
                            onClick={(e) => {
                                e.preventDefault();
                                setDetails({
                                    ...details,
                                    countries: [...(details.countries || []), { name: '' }],
                                });
                            }}
                            className="mt-2"
                        >
                            + Добавить страну
                        </Button>
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">Расы</label>
                        {(details.races || []).map((race, idx) => (
                            <div key={idx} className="border border-[#c2a774] rounded p-3 mb-3 space-y-2 bg-[#0e1b12]">
                                <input
                                    className="w-full px-3 py-1 rounded bg-transparent border border-[#c2a774] text-[#f5e9c6]"
                                    placeholder="Название расы"
                                    value={race.name}
                                    onChange={(e) => {
                                        const updated = [...(details.races || [])];
                                        updated[idx].name = e.target.value;
                                        setDetails({ ...details, races: updated });
                                    }}
                                />
                                <textarea
                                    className="w-full px-3 py-1 rounded bg-transparent border border-[#c2a774] text-[#f5e9c6]"
                                    placeholder="Описание расы"
                                    value={race.description || ''}
                                    onChange={(e) => {
                                        const updated = [...(details.races || [])];
                                        updated[idx].description = e.target.value;
                                        setDetails({ ...details, races: updated });
                                    }}
                                />
                                <input
                                    className="w-full px-3 py-1 rounded bg-transparent border border-[#c2a774] text-[#f5e9c6]"
                                    placeholder="Область обитания"
                                    value={race.region || ''}
                                    onChange={(e) => {
                                        const updated = [...(details.races || [])];
                                        updated[idx].region = e.target.value;
                                        setDetails({ ...details, races: updated });
                                    }}
                                />
                                <textarea
                                    className="w-full px-3 py-1 rounded bg-transparent border border-[#c2a774] text-[#f5e9c6]"
                                    placeholder="Черты (через запятую)"
                                    value={race.traits?.join(', ') || ''}
                                    onChange={(e) => {
                                        const updated = [...(details.races || [])];
                                        updated[idx].traits = e.target.value.split(',').map(s => s.trim());
                                        setDetails({ ...details, races: updated });
                                    }}
                                />
                            </div>
                        ))}
                        <Button
                            onClick={(e) => {
                                e.preventDefault();
                                setDetails({
                                    ...details,
                                    races: [...(details.races || []), { name: '' }],
                                });
                            }}
                            className="mt-2"
                        >
                            + Добавить расу
                        </Button>
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">Распределение населения</label>
                        <textarea
                            className="w-full px-4 py-2 rounded bg-[#0e1b12] border border-[#c2a774] text-[#f5e9c6]"
                            placeholder="Например: плотно заселённые побережья, редкое население в горах..."
                            value={details.populationDistribution || ''}
                            onChange={(e) => setDetails({ ...details, populationDistribution: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">Языки</label>
                        {(details.languages || []).map((lang, idx) => (
                            <div key={idx} className="border border-[#c2a774] rounded p-3 mb-3 space-y-2 bg-[#0e1b12]">
                                <input
                                    className="w-full px-3 py-1 rounded bg-transparent border border-[#c2a774] text-[#f5e9c6]"
                                    placeholder="Название языка"
                                    value={lang.name}
                                    onChange={(e) => {
                                        const updated = [...(details.languages || [])];
                                        updated[idx].name = e.target.value;
                                        setDetails({ ...details, languages: updated });
                                    }}
                                />
                                <input
                                    className="w-full px-3 py-1 rounded bg-transparent border border-[#c2a774] text-[#f5e9c6]"
                                    placeholder="Письменность"
                                    value={lang.script || ''}
                                    onChange={(e) => {
                                        const updated = [...(details.languages || [])];
                                        updated[idx].script = e.target.value;
                                        setDetails({ ...details, languages: updated });
                                    }}
                                />
                                <input
                                    className="w-full px-3 py-1 rounded bg-transparent border border-[#c2a774] text-[#f5e9c6]"
                                    placeholder="Где используется (через запятую)"
                                    value={lang.spokenIn?.join(', ') || ''}
                                    onChange={(e) => {
                                        const updated = [...(details.languages || [])];
                                        updated[idx].spokenIn = e.target.value.split(',').map(s => s.trim());
                                        setDetails({ ...details, languages: updated });
                                    }}
                                />
                            </div>
                        ))}
                        <Button
                            onClick={(e) => {
                                e.preventDefault();
                                setDetails({
                                    ...details,
                                    languages: [...(details.languages || []), { name: '' }],
                                });
                            }}
                            className="mt-2"
                        >
                            + Добавить язык
                        </Button>
                    </div>
                </section>
            }

            <div className="flex justify-end">
                <Button onClick={handleSubmit} className="font-semibold">
                    {initialWorld ? 'Сохранить' : 'Создать мир'}
                </Button>
            </div>
        </form>
    );
};
