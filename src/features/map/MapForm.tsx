import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Button } from '../../components/ChronicleButton';
import { Map as MapIcon, Image as ImageIcon } from 'lucide-react';
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
            setError('Укажите название карты и выберите файл');
            return;
        }

        if (!worldId) {
            setError('Пожалуйста, выберите мир для этой карты');
            return;
        }

        setLoading(true);
        setError(null);

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

    const existingPreviewUrl =
        initial?.image_path
            ? supabase.storage.from('map').getPublicUrl(initial.image_path).data.publicUrl
            : null;

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (!loading) handleSubmit();
            }}
            className="no-scrollbar text-[#e5d9a5] font-lora rounded-3xl space-y-8"
        >
            <h2 className="text-2xl md:text-3xl text-center tracking-wide text-[#e5d9a5] mb-2 flex flex-row gap-2 items-center justify-center">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1b261a] border border-[#c2a77466] shadow-[0_0_16px_#000]">
                    <MapIcon className="w-5 h-5 text-[#c2a774]" />
                </span>
                {initial ? 'Редактировать карту' : 'Новая карта'}
            </h2>
            <p className="text-center text-sm text-[#c7bc98] max-w-md mx-auto">
                Загрузите изображение и привяжите его к нужному миру — карта появится в разделе мира и карт.
            </p>

            <section className="space-y-4">
                <div>
                    <label className="block font-lora mb-1 text-[#c2a774]">
                        Название карты
                    </label>
                    <input
                        type="text"
                        placeholder="Например, Эльдора или Южные королевства"
                        className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77466]"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block font-lora mb-1 text-[#c2a774]">
                        Регион или территория <span className="text-[#c7bc98] text-xs">(опционально)</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Западные земли, горный хребет, архипелаг..."
                        className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77466]"
                        value={territory}
                        onChange={(e) => setTerritory(e.target.value)}
                    />
                </div>
            </section>

            <section className="shadow-md space-y-5">
                <div className="space-y-2">
                    <label className="block font-lora mb-1 text-[#c2a774]">
                        Файл изображения
                    </label>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <input
                            type="file"
                            accept="image/*"
                            className="text-[#e5d9a5] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:bg-[#c2a774] file:text-[#0e1b12] hover:file:bg-[#d9c084] cursor-pointer max-w-full"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        {initial?.image_path && !file && (
                            <p className="text-xs text-[#c7bc98] italic">
                                Если не выбрать новый файл, останется текущая карта.
                            </p>
                        )}
                    </div>

                    {existingPreviewUrl && (
                        <div className="mt-3 flex items-start gap-3">
                            <div className="mt-1">
                                <ImageIcon className="w-4 h-4 text-[#c2a774]" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-[#c7bc98]">Текущее изображение карты:</p>
                                <div className="overflow-hidden rounded-lg border border-[#2f3d2d] max-w-xs shadow-inner">
                                    <img
                                        src={existingPreviewUrl}
                                        alt={initial?.name}
                                        className="w-full h-28 object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block font-lora mb-1 text-[#c2a774]">Мир</label>
                    <select
                        value={worldId ?? ''}
                        onChange={(e) => setWorldId(e.target.value || null)}
                        className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] focus:outline-none focus:ring-2 focus:ring-[#c2a77466]"
                    >
                        <option value="">— Мир не выбран —</option>
                        {worlds.map((world) => (
                            <option key={world.id} value={world.id}>
                                {world.name}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-[#c7bc98] mt-1">
                        Карта будет отображаться в деталях выбранного мира и в списке карт.
                    </p>
                </div>

                {error && (
                    <p className="text-sm text-[#ff9b9b] font-medium mt-1">
                        {error}
                    </p>
                )}
            </section>

            <div className="flex justify-end pt-2">
                <Button
                    type="submit"
                    icon={<MapIcon className="w-5 h-5" />}
                    className="font-semibold min-w-[190px] justify-center"
                >
                    {loading
                        ? (initial ? 'Сохраняем...' : 'Создаём...')
                        : (initial ? 'Сохранить карту' : 'Создать карту')}
                </Button>
            </div>
        </form>
    );
};
