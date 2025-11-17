import { useEffect, useState } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { MapForm } from '../../features/map/MapForm';
import { useMapStore } from '../../store/useMapStore';
import type { DBMap } from '../../types/DBMap';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/ChronicleButton';
import { Plus, Trash2, Map as MapIcon, Pen, Sparkles } from 'lucide-react';
import { useWorldStore } from '../../store/useWorldStore';
import { useWorldSelectionStore } from '../../store/useWorldSelectionStore';
import { WorldSelector } from '../../components/WorldSelector';
import { Link } from 'react-router-dom';

const MAPS_PER_PAGE = 10;

export const MapListPage = () => {
    const supabase = useSupabaseClient();
    const session = useSession();

    const { maps, fetchMaps, deleteMap } = useMapStore();
    const { fetchWorlds } = useWorldStore();
    const selectedWorldId = useWorldSelectionStore((s) => s.selectedWorldId);

    const [showFormModal, setShowFormModal] = useState(false);
    const [mapToDelete, setMapToDelete] = useState<DBMap | null>(null);
    const [mapToEdit, setMapToEdit] = useState<DBMap | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

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

    const filteredMaps = maps; // тут потом можно будет навесить доп. фильтры
    const totalPages = Math.ceil(filteredMaps.length / MAPS_PER_PAGE) || 1;

    const paginatedMaps = filteredMaps.slice(
        (currentPage - 1) * MAPS_PER_PAGE,
        currentPage * MAPS_PER_PAGE
    );

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const isFormOpen = showFormModal || !!mapToEdit;

    return (
        <div className="text-[#e5d9a5] font-lora px-2 md:px-4 py-8 md:py-10 max-w-[1440px] mx-auto space-y-8 md:space-y-10">
            <div className="flex flex-col gap-4 border-b border-[#c2a774]/70 pb-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl flex flex-row gap-2 items-center font-garamond text-[#e5d9a5]">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1b261a] border border-[#c2a77466] shadow-[0_0_18px_#000] text-[#c2a774]">
                            <MapIcon className="w-5 h-5" />
                        </span>
                        Ваши карты
                    </h1>
                    <p className="text-sm text-[#c7bc98] max-w-xl">
                        Храни карты городов, континентов и забытых земель — все привязано к выбранному миру.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                    <WorldSelector />
                    <Button
                        onClick={() => {
                            setMapToEdit(null);
                            setShowFormModal(true);
                        }}
                        icon={<Plus size={18} />}
                        className="max-sm:gap-0"
                    >
                        <span className="hidden md:block">Добавить карту</span>
                        <span className="md:hidden">Создать</span>
                    </Button>
                </div>
            </div>

            {maps.length === 0 ? (
                <div className="mt-10 flex flex-col items-center justify-center text-center text-[#c7bc98]">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-[#c2a77466] bg-[#151e16] shadow-[0_0_24px_#000] mb-4">
                        <Sparkles className="w-7 h-7 text-[#c2a774]" />
                    </div>
                    <p className="text-xl font-semibold text-[#e5d9a5] mb-1">
                        Карт пока нет
                    </p>
                    <p className="text-sm mb-4 max-w-sm">
                        Создайте свою первую карту, чтобы начать визуально собирать мир.
                    </p>
                    <Button
                        onClick={() => {
                            setMapToEdit(null);
                            setShowFormModal(true);
                        }}
                        icon={<Plus size={18} />}
                    >
                        Добавить карту
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedMaps.map((map, index) => (
                            <div
                                key={map.id}
                                className="relative group overflow-hidden rounded-2xl border border-[#3a4a34] bg-gradient-to-br from-[#151e16] via-[#202a1f] to-[#111711] shadow-[0_0_24px_rgba(0,0,0,0.85)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_28px_#c2a77455] opacity-0 animate-fade-in-down"
                                style={{ animationDelay: `${index * 70}ms` }}
                            >
                                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_0%_0%,rgba(194,167,116,0.20),transparent_55%)] opacity-80 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 p-3 sm:p-4 flex flex-col gap-3 h-full">
                                    <Link
                                        to={`/maps/${map.id}`}
                                        className="block overflow-hidden rounded-xl border border-[#2f3d2d] shadow-inner"
                                    >
                                        <img
                                            src={
                                                supabase.storage
                                                    .from('map')
                                                    .getPublicUrl(map.image_path).data.publicUrl
                                            }
                                            alt={map.name}
                                            className="w-full h-40 object-cover transform transition-transform duration-500 group-hover:scale-[1.03]"
                                        />
                                    </Link>

                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1 pr-1">
                                            <h2 className="text-lg sm:text-xl font-semibold text-[#e5d9a5] font-lora group-hover:drop-shadow-[0_0_4px_#e5d9a5aa]">
                                                {map.name}
                                            </h2>
                                            {map.territory && (
                                                <p className="text-xs sm:text-sm text-[#c7bc98] italic">
                                                    {map.territory}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2 items-end shrink-0">
                                            <Button
                                                variant="outline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    setMapToEdit(map);
                                                    setShowFormModal(true);
                                                }}
                                                icon={<Pen className="w-4 h-4" />}
                                                className="h-8 w-8 p-0 flex items-center justify-center bg-[#1c2618]/70 hover:bg-[#263320] border-[#c2a77488]"
                                                title="Редактировать"
                                            >
                                            </Button>

                                            <Button
                                                variant="danger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    setMapToDelete(map);
                                                }}
                                                icon={<Trash2 className="w-4 h-4" />}
                                                className="h-8 w-8 p-0 flex items-center justify-center text-xs"
                                                title="Удалить"
                                            >
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 pt-2 font-lora text-[#e5d9a5]">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded border border-[#c2a774] hover:bg-[#3a4c3a] disabled:opacity-30 disabled:hover:bg-transparent transition"
                            >
                                ⪻
                            </button>
                            {Array.from({ length: totalPages }).map((_, index) => {
                                const isActive = currentPage === index + 1;
                                return (
                                    <button
                                        key={index}
                                        onClick={() => goToPage(index + 1)}
                                        className={`px-3 py-1 rounded border font-bold text-sm transition ${isActive
                                                ? 'bg-[#c2a774] text-[#2D422B] shadow-md border-[#c2a774]'
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
                                className="px-3 py-1 rounded border border-[#c2a774] hover:bg-[#3a4c3a] disabled:opacity-30 disabled:hover:bg-transparent transition"
                            >
                                ⪼
                            </button>
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={!!mapToDelete} onClose={() => setMapToDelete(null)}>
                <div className="p-6 sm:p-7 text-center text-[#c7bc98] font-lora">
                    <h2 className="text-xl font-semibold text-[#e5d9a5] mb-3">
                        Удалить карту
                    </h2>
                    <p className="mb-6 text-sm">
                        Вы уверены, что хотите удалить карту{' '}
                        <strong className="text-[#e5d9a5]">«{mapToDelete?.name}»</strong>?<br />
                        <span className="text-[#e88]">Это действие необратимо.</span>
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setMapToDelete(null)}
                            className="text-base max-sm:text-sm"
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmDelete}
                            className="text-base max-sm:text-sm"
                            icon={<Trash2 className="w-4 h-4" />}
                        >
                            Удалить
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isFormOpen}
                onClose={() => {
                    setShowFormModal(false);
                    setMapToEdit(null);
                }}
            >
                <MapForm
                    userId={session?.user?.id ?? ''}
                    supabase={supabase}
                    initial={mapToEdit ?? undefined}
                    onSuccess={() => {
                        setShowFormModal(false);
                        setMapToEdit(null);
                        if (session?.user?.id) {
                            fetchMaps(session.user.id, supabase, selectedWorldId);
                        }
                    }}
                />
            </Modal>
        </div>
    );
};
