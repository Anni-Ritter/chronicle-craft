import { useEffect, useState } from 'react';
import { SmilePlus, Trash2 } from 'lucide-react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from '../../components/ChronicleButton';
import { StorageImageUploader } from '../../components/StorageImageUploader';
import { useRoleplayStore } from '../../store/useRoleplayStore';

interface CharacterEmotionsManagerProps {
    characterId: string;
    /** Чужой персонаж: только просмотр списка эмоций */
    readOnly?: boolean;
}

export const CharacterEmotionsManager = ({ characterId, readOnly = false }: CharacterEmotionsManagerProps) => {
    const supabase = useSupabaseClient();
    const [name, setName] = useState('');
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isDefault, setIsDefault] = useState(false);

    const {
        emotionsByCharacter,
        getCharacterEmotions,
        createCharacterEmotion,
        deleteCharacterEmotion,
    } = useRoleplayStore();

    useEffect(() => {
        if (!characterId) return;
        getCharacterEmotions(characterId, supabase);
    }, [characterId, supabase, getCharacterEmotions]);

    const emotions = emotionsByCharacter[characterId] ?? [];

    return (
        <section className="rounded-2xl border border-[#3a4a34] bg-[#141f16]/90 p-4 sm:p-5 space-y-4">
            <h2 className="text-lg md:text-xl font-garamond font-bold text-[#e5d9a5]">Сеты эмоций</h2>

            {!readOnly ? (
            <div className="space-y-2 rounded-xl border border-[#2f3a34] bg-[#0f1712] p-3">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Название эмоции (например: Злость)"
                    className="w-full rounded-xl border border-[#3a4a34] bg-[#0e1b12]/80 px-3 py-2 text-[#e5d9a5] focus:border-[#c2a774] focus:outline-none"
                />
                <StorageImageUploader
                    bucket="character-assets"
                    pathPrefix={`emotions/${characterId}`}
                    onUpload={setImageUrl}
                    initialUrl={imageUrl || undefined}
                    emptyLabel="Загрузить изображение эмоции"
                    previewClassName="h-24 w-full rounded-xl object-cover border border-[#3a4a34]"
                />
                <label className="flex items-center gap-2 text-sm text-[#c7bc98]">
                    <input
                        type="checkbox"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="accent-[#c2a774]"
                    />
                    Использовать как эмоцию по умолчанию
                </label>
                <Button
                    className="w-full"
                    icon={<SmilePlus size={16} />}
                    onClick={async () => {
                        if (!name.trim()) return;
                        await createCharacterEmotion(
                            {
                                character_id: characterId,
                                name: name.trim(),
                                image_url: imageUrl || null,
                                thumbnail_url: imageUrl || null,
                                sort_order: emotions.length,
                                is_default: isDefault,
                            },
                            supabase
                        );
                        setName('');
                        setImageUrl('');
                        setIsDefault(false);
                    }}
                >
                    Добавить эмоцию
                </Button>
            </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
                {emotions.map((emotion) => (
                    <div key={emotion.id} className="rounded-xl border border-[#2f3a34] bg-[#0f1712] p-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-[#f3e7c8] font-semibold">{emotion.name}</p>
                                <p className="text-xs text-[#c7bc98]">{emotion.is_default ? 'По умолчанию' : 'Обычная'}</p>
                            </div>
                            {!readOnly ? (
                            <button
                                type="button"
                                onClick={async () => {
                                    await deleteCharacterEmotion(emotion.id, characterId, supabase);
                                }}
                                className="text-[#d98f8f] hover:text-[#f2b1b1]"
                                aria-label="Удалить эмоцию"
                            >
                                <Trash2 size={16} />
                            </button>
                            ) : null}
                        </div>
                        {emotion.image_url && (
                            <img src={emotion.image_url} alt={emotion.name} className="mt-2 h-24 w-full rounded-lg object-cover" />
                        )}
                    </div>
                ))}
                {emotions.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[#3a4a34] bg-[#111712] p-3 text-sm text-[#c7bc98]">
                        Для этого персонажа эмоции ещё не добавлены.
                    </div>
                )}
            </div>
        </section>
    );
};
