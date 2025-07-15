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
            <div className="flex justify-end">
                <Button onClick={handleSubmit} className="font-semibold">
                    {initialWorld ? 'Сохранить' : 'Создать мир'}
                </Button>
            </div>
        </form>
    );
};
