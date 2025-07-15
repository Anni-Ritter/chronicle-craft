import React, { useEffect, useState } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { MapForm } from '../../features/map/MapForm';
import { useMapStore } from '../../store/useMapStore';
import type { DBMap } from '../../types/DBMap';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/ChronicleButton';
import { Plus, Trash2, Map, Pen } from 'lucide-react';
import { useWorldStore } from '../../store/useWorldStore';
import { useWorldSelectionStore } from '../../store/useWorldSelectionStore';
import { WorldSelector } from '../../components/WorldSelector';

const MAPS_PER_PAGE = 10;

export const MapListPage: React.FC = () => {
    const supabase = useSupabaseClient();
    const session = useSession();
    const [showForm, setShowForm] = useState(false);
    const { maps, fetchMaps, deleteMap } = useMapStore();
    const [mapToDelete, setMapToDelete] = useState<DBMap | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const selectedWorldId = useWorldSelectionStore((s) => s.selectedWorldId);
    const { fetchWorlds } = useWorldStore();
    const [mapToEdit, setMapToEdit] = useState<DBMap | null>(null);

    useEffect(() => {
        if (session?.user?.id) {
            fetchWorlds(session.user.id, supabase);
        }
    }, [session]);
    useEffect(() => {
        if (session?.user?.id) {
            fetchMaps(session.user.id, supabase, selectedWorldId);
        }
    }, [session, selectedWorldId]);

    const confirmDelete = async () => {
        if (mapToDelete) {
            await deleteMap(mapToDelete.id, supabase);
            setMapToDelete(null);
        }
    };

    const filteredMaps = maps;
    const totalPages = Math.ceil(filteredMaps.length / MAPS_PER_PAGE);

    const paginatedMaps = filteredMaps.slice(
        (currentPage - 1) * MAPS_PER_PAGE,
        currentPage * MAPS_PER_PAGE
    );

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="text-[#e5d9a5] font-lora px-2 md:px-4 py-6">
            <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-[#c2a774] pb-4 mb-6">
                    <h1 className="text-3xl flex flex-row gap-2 items-center font-garamond text-[#e5d9a5]">
                        <Map /> Ваши карты
                    </h1>
                    <div className="flex items-center gap-4">
                        <WorldSelector />
                        <Button
                            onClick={() => setShowForm(true)}
                            icon={<Plus size={18} />}
                            className="max-sm:gap-0"
                        >
                            <span className="hidden md:block">Добавить карту</span>
                        </Button>
                    </div>
                </div>

                {maps.length === 0 ? (
                    <div className="text-center text-[#c7bc98] border border-[#d6c5a2] p-8 rounded-xl shadow-inner mt-8">
                        <p className="text-xl font-semibold text-[#e5d9a5] mb-2">Карт пока нет</p>
                        <p className="text-sm mb-4">Создайте свою первую карту, чтобы начать наполнять мир.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedMaps.map((map) => (
                            <div
                                key={map.id}
                                className="relative border border-[#d6c5a2] rounded-lg p-3 shadow-md hover:shadow-lg transition overflow-hidden"
                            >
                                <a href={`/maps/${map.id}`} className="block space-y-2">
                                    <img
                                        src={supabase.storage.from('map').getPublicUrl(map.image_path).data.publicUrl}
                                        alt={map.name}
                                        className="w-full h-40 object-cover rounded"
                                    />
                                    <div>
                                        <h2 className="text-xl font-semibold">{map.name}</h2>
                                        <p className="text-sm text-gray-500">{map.territory}</p>
                                    </div>
                                </a>

                                <Button
                                    variant="outline"
                                    onClick={() => setMapToEdit(map)}
                                    icon={<Pen />}
                                    className="absolute top-2 right-14 bg-[#1e2d1c] text-[#d6c5a2] px-2 py-1 text-sm rounded hover:bg-[#3a4c3a]"
                                >
                                </Button>

                                <Button
                                    variant='danger'
                                    onClick={() => setMapToDelete(map)}
                                    icon={<Trash2 />}
                                    className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-sm rounded hover:bg-red-600"
                                >
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-6 font-lora text-[#e5d9a5]">
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded border border-[#c2a774] hover:bg-[#3a4c3a] disabled:opacity-30"
                    >
                        ⪻
                    </button>
                    {Array.from({ length: totalPages }).map((_, index) => {
                        const isActive = currentPage === index + 1;
                        return (
                            <button
                                key={index}
                                onClick={() => goToPage(index + 1)}
                                className={`px-3 py-1 rounded border font-bold transition ${isActive
                                    ? 'bg-[#c2a774] text-[#2D422B] shadow-md'
                                    : 'border-[#c2a774] hover:bg-[#3a4c3a]'
                                    }`}
                            >
                                {index + 1}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded border border-[#c2a774] hover:bg-[#3a4c3a] disabled:opacity-30"
                    >
                        ⪼
                    </button>
                </div>
            )}
            <Modal isOpen={!!mapToDelete} onClose={() => setMapToDelete(null)}>
                <div className="text-center text-[#c7bc98] font-lora max-sm:p-5">
                    <h2 className="text-xl font-semibold text-[#e5d9a5] mb-4">Удалить карту</h2>
                    <p className="mb-6">
                        Вы уверены, что хотите удалить карту{' '}
                        <strong className="text-[#e5d9a5]">«{mapToDelete?.name}»</strong>? Это действие необратимо.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button
                            variant='outline'
                            onClick={() => setMapToDelete(null)}
                            className='text-base'
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmDelete}
                            className='text-base'
                        >
                            Удалить
                        </Button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
                <MapForm
                    userId={session?.user?.id ?? ''}
                    supabase={supabase}
                    onSuccess={() => {
                        setShowForm(false);
                        if (session?.user?.id) fetchMaps(session.user.id, supabase, selectedWorldId);
                    }}
                />
            </Modal>

            <Modal isOpen={showForm || !!mapToEdit} onClose={() => {
                setShowForm(false);
                setMapToEdit(null);
            }}>
                <MapForm
                    userId={session?.user?.id ?? ''}
                    supabase={supabase}
                    initial={mapToEdit ?? undefined}
                    onSuccess={() => {
                        setShowForm(false);
                        setMapToEdit(null);
                        if (session?.user?.id) fetchMaps(session.user.id, supabase, selectedWorldId);
                    }}
                />
            </Modal>
        </div>
    );
};
