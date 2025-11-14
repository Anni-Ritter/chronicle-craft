import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Button } from '../../components/ChronicleButton';
import { Map } from 'lucide-react';
import { useWorldStore } from '../../store/useWorldStore';
import { useWorldSelectionStore } from '../../store/useWorldSelectionStore';
import type { DBMap } from '../../types/DBMap';

interface MapFormProps {
    userId: string;
    supabase: SupabaseClient;
    onSuccess: () => void;
    initial?: DBMap;
}

export const MapForm = ({ userId, supabase, onSuccess, initial }: MapFormProps) => {
    const [name, setName] = useState(initial?.name || '');
    const [territory, setTerritory] = useState(initial?.territory || '');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { worlds } = useWorldStore();
    const selectedWorldId = useWorldSelectionStore((s) => s.selectedWorldId);
    const [worldId, setWorldId] = useState<string | null>(
        initial?.world_id ?? selectedWorldId ?? null
    );

    const handleSubmit = async () => {
        if (!name || (!file && !initial)) {
            setError('Укажите имя и выберите файл');
            return;
        }

        if (!worldId) {
            setError('Пожалуйста, выберите мир');
            return;
        }

        setLoading(true);

        let imagePath = initial?.image_path ?? null;

        if (file) {
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

            imagePath = filepath;
        }

        if (initial) {
            const { error: updateError } = await supabase
                .from('maps')
                .update({
                    name,
                    territory,
                    world_id: worldId,
                    image_path: imagePath,
                })
                .eq('id', initial.id);

            if (updateError) {
                setError(updateError.message);
            } else {
                onSuccess();
            }

            setLoading(false);
            return;
        }

        const { error: insertError } = await supabase.from('maps').insert({
            name,
            territory,
            user_id: userId,
            image_path: imagePath,
            world_id: worldId,
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
                <Map /> {initial ? 'Редактировать карту' : 'Новая карта'}
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

                <div>
                    <label className="block font-lora mb-1 text-[#c2a774]">Мир</label>
                    <select
                        value={worldId ?? ''}
                        onChange={(e) => setWorldId(e.target.value || null)}
                        className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774]"
                    >
                        <option value="">— Мир не выбран —</option>
                        {worlds.map((world) => (
                            <option key={world.id} value={world.id}>
                                {world.name}
                            </option>
                        ))}
                    </select>
                </div>

                {error && (
                    <p className="text-sm text-red-500 font-medium">{error}</p>
                )}

                {initial?.image_path && !file && (
                    <p className="text-sm text-[#c7bc98] italic mt-1">Будет использован уже загруженный файл</p>
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
