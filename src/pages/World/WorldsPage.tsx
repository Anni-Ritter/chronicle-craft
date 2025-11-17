import { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useWorldStore } from '../../store/useWorldStore';
import { useWorldSelectionStore } from '../../store/useWorldSelectionStore';
import { Button } from '../../components/ChronicleButton';
import { Modal } from '../../components/Modal';
import { Globe2, Pencil, PlusCircle, Trash2, Sparkles } from 'lucide-react';
import type { World } from '../../types/world';
import { WorldForm } from '../../features/world/WorldForm';
import { useNavigate } from 'react-router-dom';

export const WorldsPage = () => {
    const session = useSession();
    const supabase = useSupabaseClient();
    const { worlds, fetchWorlds, removeWorld } = useWorldStore();
    const { selectedWorldId } = useWorldSelectionStore();
    const navigate = useNavigate();

    const [isModalOpen, setModalOpen] = useState(false);
    const [editingWorld, setEditingWorld] = useState<World | null>(null);
    const [deletingWorld, setDeletingWorld] = useState<World | null>(null);

    useEffect(() => {
        if (session?.user?.id) {
            fetchWorlds(session.user.id, supabase);
        }
    }, [session]);

    const handleEdit = (e: React.MouseEvent, world: World) => {
        e.stopPropagation();
        setEditingWorld(world);
        setModalOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingWorld) return;
        await removeWorld(deletingWorld.id, supabase);
        setDeletingWorld(null);
    };

    return (
        <div className="max-w-[1440px] mx-auto mt-10 px-2 md:px-4 space-y-8 md:space-y-10">
            <div className="flex flex-col gap-3 border-b border-[#c2a774]/70 pb-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl flex items-center gap-2 font-garamond text-[#e5d9a5]">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1b261a] border border-[#c2a77466] shadow-[0_0_18px_#000] text-[#c2a774]">
                            <Globe2 className="w-5 h-5" />
                        </span>
                        Миры
                    </h2>
                    <p className="text-sm text-[#c7bc98] font-lora max-w-lg">
                        Собери свои вселенные, их правила и историю в одном месте.
                    </p>
                </div>

                <Button
                    icon={<PlusCircle size={18} />}
                    onClick={() => {
                        setEditingWorld(null);
                        setModalOpen(true);
                    }}
                    className="self-start md:self-auto max-sm:gap-0"
                >
                    <span className="hidden md:block">Новый мир</span>
                    <span className="md:hidden">Создать</span>
                </Button>
            </div>

            {worlds.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-[#e5d9a5]/80 font-lora gap-4 mt-10">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-[#c2a77466] bg-[#151e16] shadow-[0_0_24px_#000]">
                        <Sparkles className="w-7 h-7 text-[#c2a774]" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-base md:text-lg italic">
                            У вас пока нет созданных миров.
                        </p>
                        <p className="text-xs text-[#c7bc98]">
                            Начните с одного — а дальше вселенная сама разрастётся.
                        </p>
                    </div>
                    <Button
                        icon={<PlusCircle size={18} />}
                        onClick={() => {
                            setEditingWorld(null);
                            setModalOpen(true);
                        }}
                        className="mt-2"
                    >
                        Создать первый мир
                    </Button>
                </div>
            ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-[#e5d9a5] font-lora">
                    {worlds.map((world: World, index) => {
                        const isActive = selectedWorldId === world.id;

                        return (
                            <li
                                key={world.id}
                                onClick={() => {
                                    navigate(`/worlds/${world.id}`);
                                }}
                                className={`
                                    group relative overflow-hidden rounded-2xl border border-[#3a4a34] 
                                    bg-gradient-to-br from-[#161f16] via-[#1f2b1f] to-[#131a13]
                                    shadow-[0_0_24px_rgba(0,0,0,0.8)]
                                    cursor-pointer transition-all duration-300
                                    hover:-translate-y-1 hover:shadow-[0_0_28px_#c2a77455]
                                    ${isActive ? 'ring-2 ring-[#c2a774] ring-offset-2 ring-offset-[#050807]' : ''}
                                    opacity-0 animate-fade-in-down
                                `}
                                style={{ animationDelay: `${index * 70}ms` }}
                            >
                                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_0%_0%,rgba(194,167,116,0.18),transparent_55%)] opacity-70 group-hover:opacity-100 transition-opacity" />

                                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#c2a774] to-transparent opacity-60" />

                                <div className="relative z-10 p-4 sm:p-5 flex flex-col h-full gap-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-2 pr-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-xl sm:text-2xl font-semibold font-lora group-hover:drop-shadow-[0_0_6px_#e5d9a5aa]">
                                                    {world.name}
                                                </h3>
                                                {isActive && (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-[#c2a774aa] bg-[#1e281b] px-2 py-0.5 text-[11px] uppercase tracking-wide text-[#e5d9a5]">
                                                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c2a774] animate-pulse" />
                                                        Активный мир
                                                    </span>
                                                )}
                                                {world.calendar && (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-[#44553e] bg-[#182216] px-2 py-0.5 text-[11px] text-[#c7bc98]">
                                                        ⏳ Свой календарь
                                                    </span>
                                                )}
                                            </div>

                                            {world.description && (
                                                <p className="text-sm text-[#e5d9a5]/75 line-clamp-4 leading-relaxed">
                                                    {world.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2 items-end shrink-0">
                                            <Button
                                                onClick={(e) => handleEdit(e, world)}
                                                icon={<Pencil size={16} />}
                                                title="Редактировать"
                                                className="h-8 w-8 p-0 flex items-center justify-center text-xs bg-[#1b261b]"
                                            >
                                            </Button>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeletingWorld(world);
                                                }}
                                                icon={<Trash2 size={16} />}
                                                title="Удалить"
                                                variant="danger"
                                                className="h-8 w-8 p-0 flex items-center justify-center text-xs"
                                            >
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <Modal isOpen={isModalOpen} onClose={() => {
                setModalOpen(false);
                setEditingWorld(null);
            }}>
                <WorldForm
                    initialWorld={editingWorld ?? undefined}
                    onFinish={() => {
                        setModalOpen(false);
                        setEditingWorld(null);
                    }}
                />
            </Modal>

            <Modal isOpen={!!deletingWorld} onClose={() => setDeletingWorld(null)}>
                <div className="p-6 sm:p-7 text-[#e5d9a5] font-lora">
                    <h2 className="text-xl sm:text-2xl font-garamond text-center mb-3 flex items-center justify-center gap-2">
                        <Trash2 className="w-5 h-5 text-[#e88]" />
                        Удалить мир?
                    </h2>
                    <p className="text-sm text-center text-[#c7bc98] mb-6">
                        Вы уверены, что хотите удалить{' '}
                        <span className="text-[#e5d9a5] font-semibold">
                            {deletingWorld?.name}
                        </span>
                        ? <br className="hidden sm:block" />
                        <span className="text-[#e88]">Это действие необратимо.</span>
                    </p>
                    <div className="flex justify-center gap-3 sm:gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setDeletingWorld(null)}
                            className="min-w-[110px] max-sm:text-sm"
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            className="min-w-[110px] max-sm:text-sm"
                            icon={<Trash2 className="w-4 h-4" />}
                        >
                            Удалить
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
