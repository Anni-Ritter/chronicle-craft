import { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useWorldStore } from '../../store/useWorldStore';
import { useWorldSelectionStore } from '../../store/useWorldSelectionStore';
import { Button } from '../../components/ChronicleButton';
import { Modal } from '../../components/Modal';
import { Globe2, Pencil, PlusCircle, Trash2 } from 'lucide-react';
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
        <div className="max-w-[1440px] mx-auto mt-10 px-2 md:px-4 space-y-10">
            <div className="flex justify-between items-center border-b border-[#c2a774] pb-4">
                <h2 className="text-3xl flex items-center gap-2 font-garamond text-[#e5d9a5]">
                    <Globe2 /> Миры
                </h2>
                <Button
                    icon={<PlusCircle size={18} />}
                    onClick={() => setModalOpen(true)}
                    className="max-sm:gap-0"
                >
                    <span className="hidden md:block">Новый мир</span>
                </Button>
            </div>

            {worlds.length === 0 ? (
                <div className="text-center text-[#e5d9a5]/70 font-lora italic">
                    У вас пока нет созданных миров.
                </div>
            ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-[#e5d9a5] font-lora">
                    {worlds.map((world: World) => (
                        <li
                            key={world.id}
                            onClick={() => {
                                navigate(`/worlds/${world.id}`);
                            }}
                            className={`
                                group relative bg-[#223120] border border-[#c2a774] rounded-2xl p-4 shadow-md 
                                hover:shadow-[0_0_25px_#c2a77480] transition cursor-pointer
                                ${selectedWorldId === world.id ? 'ring-2 ring-[#c2a774]' : ''}
                            `}
                        >
                            <div className="absolute inset-0 rounded-2xl border border-[#c2a77433] pointer-events-none" />

                            <div className="flex justify-between items-start gap-2">
                                <div className="space-y-2 pr-2">
                                    <h3 className="text-xl sm:text-2xl font-semibold font-lora group-hover:drop-shadow-[0_0_4px_#e5d9a5aa]">
                                        {world.name}
                                    </h3>
                                    {world.description && (
                                        <p className="text-sm text-[#e5d9a5]/70 line-clamp-4">
                                            {world.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 items-end z-10">
                                    <Button
                                        onClick={(e) => handleEdit(e, world)}
                                        icon={<Pencil size={18} />}
                                        title="Редактировать"
                                    >
                                    </Button>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingWorld(world);
                                        }}
                                        icon={<Trash2 size={18} />}
                                        title="Удалить"
                                        variant="danger"
                                    >
                                    </Button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
                <WorldForm
                    initialWorld={editingWorld ?? undefined}
                    onFinish={() => {
                        setModalOpen(false);
                        setEditingWorld(null);
                    }}
                />
            </Modal>


            <Modal isOpen={!!deletingWorld} onClose={() => setDeletingWorld(null)}>
                <div className="text-center text-[#c7bc98] font-lora">
                    <h2 className="text-xl font-semibold text-[#e5d9a5] mb-4">Удалить мир</h2>
                    <p className="mb-6">
                        Вы уверены, что хотите удалить <strong>{deletingWorld?.name}</strong>? Это действие необратимо.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button variant="outline" onClick={() => setDeletingWorld(null)}>
                            Отмена
                        </Button>
                        <Button variant="danger" onClick={handleDelete}>
                            Удалить
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
