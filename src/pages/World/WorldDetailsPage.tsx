import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWorldStore } from '../../store/useWorldStore';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useChronicleStore } from '../../store/useChronicleStore';
import { useMapStore } from '../../store/useMapStore';
import { Globe2, BookMarked, MapPinned, Users, Pencil } from 'lucide-react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { WorldCalendarWidget } from '../../components/WorldCalendarWidget';
import { WorldForm } from '../../features/world/WorldForm';
import { Modal } from '../../components/Modal';
import { formatEventDate } from '../../lib/formatEventDate';
import { Button } from '../../components/ChronicleButton';

export const WorldDetailsPage = () => {
    const { id } = useParams();
    const supabase = useSupabaseClient();
    const session = useSession();
    const { worlds, fetchWorlds } = useWorldStore();

    const world = worlds.find(w => w.id === id);

    const { characters, fetchCharacters } = useCharacterStore();
    const { chronicles, fetchChronicles } = useChronicleStore();
    const { maps, fetchMaps } = useMapStore();

    const [editModalOpen, setEditModalOpen] = useState(false);

    useEffect(() => {
        if (!id || !session?.user?.id) return;

        fetchWorlds(session.user.id, supabase);
        fetchCharacters(session.user.id, supabase, id);
        fetchChronicles(supabase, id);
        fetchMaps(session.user.id, supabase, id);
    }, [id, session?.user?.id]);

    if (!world) return (
        <div className="text-center text-[#c2a774] font-lora mt-10">
            Мир не найден 😢
            <br />
            <Link to="/" className="underline mt-2 block">← Вернуться</Link>
        </div>
    );

    return (
        <div className="max-w-[1440px] mx-auto p-4 pt-10 space-y-10 font-lora text-[#e5d9a5]">
            <section className="space-y-4 border-b border-[#c2a774] pb-6">
                <div className='flex flex-col md:flex-row md:items-center justify-between w-full'>
                    <h1 className="text-4xl font-garamond flex items-center gap-2 mb-10">
                        <Globe2 /> {world.name}
                    </h1>
                    <Button
                        onClick={() => setEditModalOpen(true)}
                        icon={<Pencil size={16} />}
                        className='text-sm'
                    >
                        Редактировать
                    </Button>
                </div>
                <p className="text-[#e5d9a5]/70">{world.description}</p>
                {world.calendar && (
                    <div>
                        <WorldCalendarWidget calendar={world.calendar} />
                    </div>
                )}
            </section>
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
                <WorldForm
                    initialWorld={world}
                    onFinish={async () => {
                        await fetchWorlds(session!.user!.id, supabase);
                        setEditModalOpen(false);
                    }}
                />
            </Modal>
            <section className="space-y-4">
                <h2 className="text-2xl font-garamond flex items-center gap-2">
                    <Users /> Персонажи
                </h2>
                {characters.length === 0 ? (
                    <p className="italic text-[#e5d9a5]/50">Нет персонажей</p>
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {characters.map((c) => (
                            <li key={c.id} className="bg-[#223120] border border-[#c2a774] rounded-xl p-4 shadow-md hover:shadow-lg transition">
                                <Link to={`/character/${c.id}`} className="flex items-center gap-4">
                                    {c.avatar && (
                                        <img src={c.avatar} alt={c.name} className="w-14 h-14 object-cover rounded-full border border-[#c2a774]" />
                                    )}
                                    <div>
                                        <h3 className="text-lg font-semibold text-[#e5d9a5]">{c.name}</h3>
                                        {c.status && (
                                            <p className="text-sm text-[#c7bc98] italic">{c.status}</p>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-garamond flex items-center gap-2">
                    <BookMarked /> Хроники
                </h2>
                {chronicles.length === 0 ? (
                    <p className="italic text-[#e5d9a5]/50">Нет хроник</p>
                ) : (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {chronicles.map((chronicle) => {
                            const moodEmoji = chronicle.mood?.split(' ')[0] || '';
                            return (
                                <li key={chronicle.id} className="bg-[#223120] border border-[#c2a774] rounded-xl p-4 shadow-md hover:shadow-lg transition">
                                    <Link to={`/chronicles/${chronicle.id}`} className="text-[#e5d9a5] font-semibold flex items-start gap-2 hover:underline">
                                        <span className="text-xl">{moodEmoji}</span>
                                        <span>
                                            {chronicle.title}{' '}
                                            ({formatEventDate(chronicle.event_date)})
                                        </span>
                                    </Link>
                                    <div
                                        dangerouslySetInnerHTML={{ __html: chronicle.content }}
                                        className="mt-2 text-sm text-[#c7bc98] italic line-clamp-3"
                                    />
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-garamond flex items-center gap-2">
                    <MapPinned /> Карты
                </h2>
                {maps.length === 0 ? (
                    <p className="italic text-[#e5d9a5]/50">Нет карт</p>
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {maps.map((map) => (
                            <li key={map.id} className="bg-[#223120] border border-[#c2a774] rounded-xl p-4 shadow-md hover:shadow-lg transition">
                                <Link to={`/maps/${map.id}`} className="block space-y-2">
                                    <img
                                        src={supabase.storage.from('map').getPublicUrl(map.image_path).data.publicUrl}
                                        alt={map.name}
                                        className="w-full h-40 object-cover rounded"
                                    />
                                    <div>
                                        <h3 className="text-lg font-semibold text-[#e5d9a5]">{map.name}</h3>
                                        <p className="text-sm text-[#c7bc98] italic">{map.territory}</p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};
