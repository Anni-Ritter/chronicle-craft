import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Button } from '../../components/ChronicleButton';
import { Map } from 'lucide-react';

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
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}
            className="bg-[#0e1b12]  overflow-y-auto no-scrollbar border border-[#c2a774] text-[#e5d9a5] font-lora rounded-3xl shadow-lg px-3 md:px-6 py-10 space-y-10"
        >
            <h2 className="text-2xl text-center tracking-wide text-[#e5d9a5] mb-4 flex flex-row gap-2 items-center justify-center">
                <Map /> Новая карта
            </h2>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] shadow-md space-y-4">
                <div>
                    <label className="block font-lora mb-1 text-[#c2a774]">Название карты</label>
                    <input
                        type="text"
                        placeholder="Например, Эльдора"
                        className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block font-lora mb-1 text-[#c2a774]">Регион или территория (необязательно)</label>
                    <input
                        type="text"
                        placeholder="Западные земли, горы и т.д."
                        className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                        value={territory}
                        onChange={(e) => setTerritory(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block font-lora mb-1 text-[#c2a774]">Файл изображения</label>
                    <input
                        type="file"
                        accept="image/*"
                        className="text-[#e5d9a5] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:bg-[#c2a774] file:text-[#0e1b12] hover:file:bg-[#d9c084]"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-500 font-medium">{error}</p>
                )}
            </section>

            <div className="flex justify-end">
                <Button type="submit" icon={<Map />}>
                    {loading ? 'Загрузка...' : 'Создать карту'}
                </Button>
            </div>
        </form>
    );
};
