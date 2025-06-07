import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Chronicle } from '../../types/chronicle';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useChronicleStore } from '../../store/useChronicleStore';
import { RichTextEditor } from '../../components/RichTextEditor';

interface Props {
    onFinish: () => void;
    supabase: any;
    initial?: Chronicle;
}

export const ChronicleForm: React.FC<Props> = ({ onFinish, supabase, initial }) => {
    const { characters } = useCharacterStore();
    const { addChronicle, updateChronicle } = useChronicleStore();

    const [title, setTitle] = useState(initial?.title || '');
    const [content, setContent] = useState(initial?.content || '');
    const [tags, setTags] = useState<string[]>(initial?.tags || []);
    const [linkedCharacters, setLinkedCharacters] = useState<string[]>(initial?.linked_characters || []);
    const [linkedLocations, setLinkedLocations] = useState<string[]>(initial?.linked_locations || []);

    const handleSubmit = async () => {
        const entry: Chronicle = {
            id: initial?.id || uuidv4(),
            title,
            content,
            tags: tags,
            linked_characters: linkedCharacters,
            linked_locations: linkedLocations,
            created_at: initial?.created_at || new Date().toISOString(),
        };

        const result = initial
            ? await updateChronicle(entry, supabase)
            : await addChronicle(entry, supabase);

        if (!result.error) {
            onFinish();
        } else {
            console.error(result.error.message);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-6">
            <input
                type="text"
                className="w-full border px-3 py-2 rounded"
                placeholder="Заголовок"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <div>
                <div>
                    <label className="block mb-1">Контент:</label>
                    <RichTextEditor content={content} onChange={setContent} />
                </div>
            </div>

            <div>
                <label className="block mb-1">Привязанные персонажи:</label>
                <select
                    multiple
                    value={linkedCharacters}
                    onChange={(e) =>
                        setLinkedCharacters(Array.from(e.target.selectedOptions, (opt) => opt.value))
                    }
                    className="w-full border px-2 py-1 rounded"
                >
                    {characters.map((char) => (
                        <option key={char.id} value={char.id}>
                            {char.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block mb-1">Локации:</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {linkedLocations.map((loc, index) => (
                        <span
                            key={index}
                            className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                            {loc}
                            <button
                                type="button"
                                className="text-red-500 hover:text-red-700"
                                onClick={() =>
                                    setLinkedLocations(linkedLocations.filter((_, i) => i !== index))
                                }
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Введите локацию и нажмите Enter"
                    className="w-full border px-2 py-1 rounded"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = e.currentTarget.value.trim();
                            if (value && !linkedLocations.includes(value)) {
                                setLinkedLocations([...linkedLocations, value]);
                            }
                            e.currentTarget.value = '';
                        }
                    }}
                />
            </div>

            <div>
                <label className="block mb-1">Теги:</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, index) => (
                        <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                            {tag}
                            <button
                                type="button"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => setTags(tags.filter((_, i) => i !== index))}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Введите тег и нажмите Enter"
                    className="w-full border px-2 py-1 rounded"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = e.currentTarget.value.trim();
                            if (value && !tags.includes(value)) {
                                setTags([...tags, value]);
                            }
                            e.currentTarget.value = '';
                        }
                    }}
                />
            </div>

            <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleSubmit}
            >
                {initial ? 'Сохранить изменения' : 'Добавить хронику'}
            </button>
        </div>
    );
};
