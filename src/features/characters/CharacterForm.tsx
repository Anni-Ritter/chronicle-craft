import { useEffect, useState } from 'react';
import type { Character, ExtraField } from '../../types/character';
import { AvatarUploader } from '../../components/AvatarUploader';
import { supabase } from '../../lib/supabaseClient';
import { ExtraFieldsEditor } from '../../components/ExtraFieldsEditor';
import { v4 as uuidv4 } from 'uuid';
import { DiceStat } from '../../components/DiceStat';

interface CharacterFormProps {
    onFinish: () => void;
    initialCharacter?: Character;
    onSave: (char: Character) => void;
}

export const CharacterForm: React.FC<CharacterFormProps> = ({ onFinish, initialCharacter, onSave }) => {
    const [avatarMode, setAvatarMode] = useState<'url' | 'upload'>(
        initialCharacter?.avatar?.startsWith('http') ? 'url' : 'upload'
    );
    const normalizeExtra = (input: unknown): ExtraField[] => {
        if (Array.isArray(input)) return input;
        if (input && typeof input === 'object') {
            return Object.entries(input).map(([key, value]) => ({
                id: uuidv4(),
                key,
                value: String(value),
            }));
        }
        return [];
    };

    const [extra, setExtra] = useState<ExtraField[]>(
        normalizeExtra(initialCharacter?.extra)
    );

    const [name, setName] = useState(initialCharacter?.name || '');
    const [bio, setBio] = useState(initialCharacter?.bio || '');
    const [avatar, setAvatar] = useState(initialCharacter?.avatar || '');
    const [attributes, setAttributes] = useState<Character['attributes']>({
        strength: initialCharacter?.attributes?.strength || 0,
        intelligence: initialCharacter?.attributes?.intelligence || 0,
        magic: initialCharacter?.attributes?.magic || 0,
        charisma: initialCharacter?.attributes?.charisma || 0,
        dexterity: initialCharacter?.attributes?.dexterity || 0,
        endurance: initialCharacter?.attributes?.endurance || 0,
    });
    const [status, setStatus] = useState(initialCharacter?.status || '');
    const [species, setSpecies] = useState(initialCharacter?.species || '');
    const [gender, setGender] = useState(initialCharacter?.gender || '');
    const [origin, setOrigin] = useState({ name: initialCharacter?.origin.name || '' });
    const [location, setLocation] = useState({ name: initialCharacter?.location.name || '' });
    const [episode, setEpisode] = useState<string[]>(initialCharacter?.episode || []);
    const [userId, setUserId] = useState<string | null>(null);
    const [allChronicles, setAllChronicles] = useState<{ id: string; title: string }[]>([]);
    const [linkedChronicles, setLinkedChronicles] = useState<string[]>(initialCharacter?.linked_chronicles || []);
    useEffect(() => {
        supabase.auth.getUser().then(({ data, error }) => {
            if (!error && data.user) {
                console.log('Current user id:', data.user.id);
                setUserId(data.user.id);
            }
        });
    }, []);

    useEffect(() => {
        const fetchChronicles = async () => {
            const { data, error } = await supabase
                .from('chronicles')
                .select('id, title')
                .eq('user_id', userId);

            if (!error && data) {
                setAllChronicles(data);
            }
        };

        if (userId) fetchChronicles();
    }, [userId]);

    useEffect(() => {
        if (initialCharacter) {
            setName(initialCharacter.name);
            setBio(initialCharacter.bio);
            setAvatar(initialCharacter.avatar || '');
            setAttributes(initialCharacter.attributes);
            setStatus(initialCharacter.status);
            setSpecies(initialCharacter.species);
            setGender(initialCharacter.gender);
            setOrigin(initialCharacter.origin);
            setLocation(initialCharacter.location);
            setEpisode(initialCharacter.episode || []);
        }
    }, [initialCharacter]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || userId === null) return;

        const updatedChar: Character = {
            id: initialCharacter?.id ?? crypto.randomUUID(),
            user_id: userId,
            name,
            bio,
            avatar,
            status,
            species,
            gender,
            origin,
            location,
            episode,
            linked_chronicles: linkedChronicles,
            created_at: initialCharacter?.created_at ?? new Date().toISOString(),
            attributes,
            extra,
        };

        onSave(updatedChar);
        onFinish();
    };

    const rollDiceAnimation = (key: keyof Character['attributes']) => {
        const steps = 10;
        let currentStep = 0;

        const interval = setInterval(() => {
            const randomValue = Math.floor(Math.random() * 12) + 1;

            setAttributes((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    [key]: randomValue,
                };
            });

            currentStep++;
            if (currentStep >= steps) {
                clearInterval(interval);
                const finalValue = Math.floor(Math.random() * 12) + 1;
                setAttributes((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        [key]: finalValue,
                    };
                });
            }
        }, 50);
    };

    const rollAllDice = () => {
        const keys: (keyof Character['attributes'])[] = [
            'strength',
            'intelligence',
            'magic',
            'charisma',
            'dexterity',
            'endurance'
        ];

        keys.forEach((key, index) => {
            setTimeout(() => rollDiceAnimation(key), index * 200);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto overflow-y-scroll max-h-[80vh] no-scrollbar">
            <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 font-bold mb-2">
                    Имя
                </label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
            </div>
            <div className="mb-4">
                <label htmlFor="bio" className="block text-gray-700 font-bold mb-2">
                    Описание
                </label>
                <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">Аватар</label>

                <div className="mb-2 flex gap-4">
                    <button
                        type="button"
                        onClick={() => setAvatarMode('url')}
                        className={`px-3 py-1 rounded border ${avatarMode === 'url' ? 'bg-indigo-500 text-white' : 'bg-white'
                            }`}
                    >
                        🔗 Ссылка
                    </button>
                    <button
                        type="button"
                        onClick={() => setAvatarMode('upload')}
                        className={`px-3 py-1 rounded border ${avatarMode === 'upload' ? 'bg-indigo-500 text-white' : 'bg-white'
                            }`}
                    >
                        📤 Загрузить
                    </button>
                </div>

                {avatarMode === 'url' ? (
                    <div>
                        {avatar && (
                            <img
                                src={avatar}
                                alt="Preview"
                                className="w-32 h-32 object-cover rounded-full border mb-2"
                            />
                        )}
                        <input
                            type="text"
                            value={avatar}
                            onChange={(e) => setAvatar(e.target.value)}
                            placeholder="https://..."
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                ) : (
                    <AvatarUploader onUpload={(url) => setAvatar(url)} initialUrl={avatar} bucket="avatars" />
                )}
            </div>
            <div className="mb-4">
                <label htmlFor="status" className="block text-gray-700 font-bold mb-2">
                    Статус
                </label>
                <input
                    type="text"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-2 border rounded"
                />
            </div>
            <div className="mb-4">
                <label htmlFor="species" className="block text-gray-700 font-bold mb-2">
                    Раса
                </label>
                <input
                    type="text"
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    className="w-full p-2 border rounded"
                />
            </div>
            <div className="mb-4">
                <label htmlFor="gender" className="block text-gray-700 font-bold mb-2">
                    Пол
                </label>
                <input
                    type="text"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2 border rounded"
                />
            </div>
            <div className="mb-4">
                <label htmlFor="origin" className="block text-gray-700 font-bold mb-2">
                    Место рождения:
                </label>
                <input
                    type="origin"
                    value={origin.name}
                    onChange={(e) => setOrigin({ name: e.target.value })}
                    className="w-full p-2 border rounded"
                />
            </div>
            <div className="mb-4">
                <label htmlFor="location" className="block text-gray-700 font-bold mb-2">
                    Место жительства:
                </label>
                <input
                    type="location"
                    value={location.name}
                    onChange={(e) => setLocation({ name: e.target.value })}
                    className="w-full p-2 border rounded"
                />
            </div>
            <div className="mb-4">
                <label htmlFor="attributes" className="block text-gray-700 font-bold mb-2">
                    Атрибуты
                </label>
                <button
                    type="button"
                    onClick={rollAllDice}
                    className="mb-4 bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition"
                >
                    🎲 Бросить все атрибуты
                </button>

                {attributes && (
                    <div className="grid grid-cols-2 gap-4">
                        {([
                            ['strength', 'Сила'],
                            ['intelligence', 'Интеллект'],
                            ['magic', 'Магия'],
                            ['charisma', 'Харизма'],
                            ['dexterity', 'Ловкость'],
                            ['endurance', 'Выносливость'],
                        ] as [keyof Character['attributes'], string][]).map(([key, label]) => (
                            <DiceStat key={key} label={label} value={attributes[key]} />
                        ))}
                    </div>
                )}
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                    Привязанные хроники
                </label>
                <div className="flex flex-col gap-2">
                    {allChronicles.map((chronicle) => (
                        <label key={chronicle.id} className="flex items-center">
                            <input
                                type="checkbox"
                                className="mr-2"
                                checked={linkedChronicles.includes(chronicle.id)}
                                onChange={(e) => {
                                    setLinkedChronicles((prev) =>
                                        e.target.checked
                                            ? [...prev, chronicle.id]
                                            : prev.filter((id) => id !== chronicle.id)
                                    );
                                }}
                            />
                            {chronicle.title}
                        </label>
                    ))}
                </div>
            </div>
            <ExtraFieldsEditor extra={extra} onChange={setExtra} />
            <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            >
                {initialCharacter ? "Сохранить изменения" : "Добавить персонажа"}
            </button>
        </form>
    );
};