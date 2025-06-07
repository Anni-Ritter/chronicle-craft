import React, { useEffect, useState } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { MapForm } from '../../features/map/MapForm';
import type { DBMap } from '../../types/DBMap';


export const MapListPage: React.FC = () => {
    const supabase = useSupabaseClient();
    const session = useSession();
    const [maps, setMaps] = useState<DBMap[]>([]);
    const [showForm, setShowForm] = useState(false);

    const fetchMaps = async () => {
        if (!session?.user?.id) return;

        const { data, error } = await supabase
            .from('maps')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (!error && data) setMaps(data as DBMap[]);
    };

    useEffect(() => {
        fetchMaps();
    }, [session]);

    return (
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
                        fetchMaps();
                    }}
                />
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {maps.map((map) => (
                    <a
                        key={map.id}
                        href={`/maps/${map.id}`}
                        className="block border rounded shadow hover:shadow-lg transition p-4 space-y-2"
                    >
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
                ))}
            </div>
        </div>
    );
};
