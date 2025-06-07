import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { SupabaseClient } from '@supabase/supabase-js';

interface Props {
    userId: string;
    supabase: SupabaseClient;
    onSuccess: () => void;
}

export const MapForm: React.FC<Props> = ({ userId, supabase, onSuccess }) => {
    const [name, setName] = useState('');
    const [territory, setTerritory] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!file || !name) {
            setError('Укажите имя и выберите файл');
            return;
        }

        setLoading(true);
        const ext = file.name.split('.').pop();
        const filename = `${uuidv4()}.${ext}`;
        const filepath = `${userId}/${filename}`;

        const { error: uploadError } = await supabase.storage
            .from('map')
            .upload(filepath, file);

        if (uploadError) {
            setError(uploadError.message);
            setLoading(false);
            return;
        }

        const { error: insertError } = await supabase.from('maps').insert({
            name,
            territory,
            user_id: userId,
            image_path: filepath,
        });

        if (insertError) {
            setError(insertError.message);
        } else {
            onSuccess();
            setName('');
            setTerritory('');
            setFile(null);
            setError(null);
        }

        setLoading(false);
    };
    return (
        <div className="space-y-3">
            <input
                type="text"
                placeholder="Название карты"
                className="w-full border px-3 py-2 rounded"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Регион или территория (необязательно)"
                className="w-full border px-3 py-2 rounded"
                value={territory}
                onChange={(e) => setTerritory(e.target.value)}
            />
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                disabled={loading}
                onClick={handleSubmit}
            >
                {loading ? 'Загрузка...' : 'Создать карту'}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
    );
};
