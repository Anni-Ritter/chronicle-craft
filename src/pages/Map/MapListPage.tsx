import React, { useEffect, useState } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { MapForm } from '../../features/map/MapForm';
import { useMapStore } from '../../store/useMapStore';
import type { DBMap } from '../../types/DBMap';
import { Modal } from '../../components/Modal';


export const MapListPage: React.FC = () => {
    const supabase = useSupabaseClient();
    const session = useSession();
    const [showForm, setShowForm] = useState(false);
    const { maps, fetchMaps, deleteMap } = useMapStore();
    const [mapToDelete, setMapToDelete] = useState<DBMap | null>(null);

    useEffect(() => {
        if (session?.user?.id) {
            fetchMaps(session.user.id, supabase);
        }
    }, [session]);

    const confirmDelete = async () => {
        if (mapToDelete) {
            await deleteMap(mapToDelete.id, supabase);
            setMapToDelete(null);
        }
    };


    return (
        <>
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Ваши карты</h1>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        {showForm ? 'Отмена' : 'Добавить карту'}
                    </button>
                </div>

                {showForm && (
                    <MapForm
                        userId={session?.user?.id ?? ''}
                        supabase={supabase}
                        onSuccess={() => {
                            setShowForm(false);
                            if (session?.user?.id) { fetchMaps(session.user.id, supabase); }
                        }}
                    />
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {maps.map((map) => (
                        <div
                            key={map.id}
                            className="relative border rounded shadow hover:shadow-lg transition p-4 space-y-2"
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

                            <button
                                onClick={() => setMapToDelete(map)}
                                className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-sm rounded hover:bg-red-600"
                            >
                                Удалить
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <Modal isOpen={!!mapToDelete} onClose={() => setMapToDelete(null)}>
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Удалить карту?</h2>
                    <p className="text-gray-700">
                        Вы уверены, что хотите удалить карту{" "}
                        <span className="font-semibold">«{mapToDelete?.name}»</span>? Это действие нельзя отменить.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={() => setMapToDelete(null)}
                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Удалить
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
