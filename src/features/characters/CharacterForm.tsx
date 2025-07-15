import { useEffect, useState } from 'react';
import type { Character, ExtraField } from '../../types/character';
import { AvatarUploader } from '../../components/AvatarUploader';
import { supabase } from '../../lib/supabaseClient';
import { ExtraFieldsEditor } from '../../components/ExtraFieldsEditor';
import { DiceStat } from '../../components/DiceStat';
import { v4 as uuidv4 } from 'uuid';
import { BookOpen, Link, Upload } from 'lucide-react';
import { RichTextEditor } from '../../components/RichTextEditor';
import { Button } from '../../components/ChronicleButton';
import { useWorldStore } from '../../store/useWorldStore';

interface CharacterFormProps {
    onFinish: () => void;
    initialCharacter?: Character;
    onSave: (char: Character) => void;
}

export const CharacterForm: React.FC<CharacterFormProps> = ({ onFinish, initialCharacter, onSave }) => {
    const [avatarMode, setAvatarMode] = useState<'url' | 'upload'>(initialCharacter?.avatar?.startsWith('http') ? 'url' : 'upload');
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

    const [extra, setExtra] = useState<ExtraField[]>(normalizeExtra(initialCharacter?.extra));
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
    const [age, setAge] = useState(initialCharacter?.age || '');
    const [birthday, setBirthday] = useState(initialCharacter?.birthday || '');
    const [occupation, setOccupation] = useState(initialCharacter?.occupation || '');
    const [affiliation, setAffiliation] = useState(initialCharacter?.affiliation || '');
    const [title, setTitle] = useState(initialCharacter?.title || '');
    const [userId, setUserId] = useState<string | null>(null);
    const [allChronicles, setAllChronicles] = useState<{ id: string; title: string }[]>([]);
    const [linkedChronicles, setLinkedChronicles] = useState<string[]>(initialCharacter?.linked_chronicles || []);
    const { worlds } = useWorldStore();
    const [selectedWorld, setSelectedWorld] = useState<string>(initialCharacter?.world_id || '');
    const [showWorldDropdown, setShowWorldDropdown] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data, error }) => {
            if (!error && data.user) setUserId(data.user.id);
        });
    }, []);

    useEffect(() => {
        if (userId) {
            supabase.from('chronicles').select('id, title').eq('user_id', userId).then(({ data }) => {
                if (data) setAllChronicles(data);
            });
        }
    }, [userId]);

    const fieldMap: Record<
        'status' | 'age' | 'birthday' | 'occupation' | 'affiliation' | 'title' | 'species' | 'gender' | 'origin' | 'location',
        [string | { name: string }, (value: any) => void]
    > = {
        status: [status, setStatus],
        age: [age, setAge],
        birthday: [birthday, setBirthday],
        occupation: [occupation, setOccupation],
        affiliation: [affiliation, setAffiliation],
        title: [title, setTitle],
        species: [species, setSpecies],
        gender: [gender, setGender],
        origin: [origin, setOrigin],
        location: [location, setLocation],
    };

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
            age,
            birthday,
            occupation,
            affiliation,
            title,
            linked_chronicles: linkedChronicles,
            created_at: initialCharacter?.created_at ?? new Date().toISOString(),
            attributes,
            extra,
            world_id: selectedWorld || null,
        };

        onSave(updatedChar);
        onFinish();
    };

    const rollAllDice = () => {
        const keys: (keyof Character['attributes'])[] = [
            'strength', 'intelligence', 'magic', 'charisma', 'dexterity', 'endurance'
        ];
        keys.forEach((key, i) => {
            setTimeout(() => {
                const roll = Math.floor(Math.random() * 12) + 1;
                setAttributes((prev) => ({ ...prev, [key]: roll }));
            }, i * 150);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-[#0e1b12] max-h-[90vh] overflow-y-scroll no-scrollbar border border-[#c2a774] text-[#e5d9a5] font-lora rounded-3xl shadow-lg max-w-full md:max-w-3xl md:mx-auto space-y-10 px-3 md:px-6 py-10">
            <h2 className="text-2xl text-center tracking-wide text-[#e5d9a5] mb-4 flex flex-row gap-2 items-center justify-center"><BookOpen /> Досье персонажа</h2>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] mt-6 shadow-md gap-6">
                <div className='mb-4'>
                    <label className="mb-1 font-lora">Имя</label>
                    <input className="w-full mt-1 px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
                    {(['status', 'age', 'species', 'gender', 'birthday', 'occupation', 'affiliation', 'title', 'origin', 'location'] as const).map((field) => {
                        const labelMap = {
                            status: 'Статус',
                            age: 'Возраст',
                            species: 'Раса',
                            gender: 'Пол',
                            birthday: 'День рождения',
                            occupation: 'Профессия',
                            affiliation: 'Афилиация',
                            title: 'Звание',
                            origin: 'Родина',
                            location: 'Жилище',
                        } as const;

                        const [value, setter] = fieldMap[field];
                        const stringValue = typeof value === 'string' ? value : value.name;

                        return (
                            <div key={field}>
                                <label className="block mb-1 font-lora">{labelMap[field]}</label>
                                <input
                                    className="w-full px-4 py-2 mt-1 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                                    value={stringValue}
                                    onChange={(e) =>
                                        setter(typeof value === 'string' ? e.target.value : { name: e.target.value })
                                    }
                                />
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] mt-6 shadow-md">
                <label className="block mb-1 font-lora">Биография</label>
                <RichTextEditor content={bio} onChange={setBio} />
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] mt-6 shadow-md space-y-4">
                <label>Аватар</label>
                <div className="flex gap-3 max-sm:flex-col max-sm:items-start">
                    <Button type="button" onClick={() => setAvatarMode('url')} className={`text-sm ${avatarMode === 'url' ? 'bg-[#c2a774] text-[#26381f]' : 'bg-[#0e1b12] text-[#e5d9a5] hover:text-[#26381f]'}`} icon={<Link />}>Ссылка</Button>
                    <Button type="button" onClick={() => setAvatarMode('upload')} className={`text-sm ${avatarMode === 'upload' ? 'bg-[#c2a774] text-[#26381f]' : 'bg-[#0e1b12] text-[#e5d9a5] hover:text-[#26381f]'}`} icon={<Upload />}>Загрузить</Button>
                </div>
                {avatarMode === 'url' ? (
                    <>
                        {avatar && <img src={avatar} alt="avatar preview" className="w-32 h-32 object-cover rounded-full border border-[#c2a774]" />}
                        <input className="w-full px-4 py-2 mt-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774]" value={avatar} onChange={(e) => setAvatar(e.target.value)} />
                    </>
                ) : (
                    <AvatarUploader onUpload={setAvatar} initialUrl={avatar} bucket="avatars" />
                )}
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] mt-6 shadow-md relative">
                <label className="block mb-2 font-lora">Выберите мир:</label>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowWorldDropdown((prev) => !prev)}
                        className="w-full px-4 py-2 bg-[#0e1b12] border border-[#c2a774] text-[#f5e9c6] rounded-xl flex justify-between items-center"
                    >
                        {selectedWorld
                            ? worlds.find((w) => w.id === selectedWorld)?.name
                            : '— Мир не выбран —'}
                        <span className="ml-2 text-[#c2a774]">▼</span>
                    </button>

                    {showWorldDropdown && (
                        <ul className="absolute left-0 mt-2 min-w-full bg-[#0e1b12] border border-[#c2a774] rounded-xl shadow-lg text-[#f5e9c6] z-30 overflow-hidden">
                            <li
                                className="px-4 py-2 hover:bg-[#3a4c3a] cursor-pointer"
                                onClick={() => {
                                    setSelectedWorld('');
                                    setShowWorldDropdown(false);
                                }}
                            >
                                — Мир не выбран —
                            </li>
                            {worlds.map((world) => (
                                <li
                                    key={world.id}
                                    onClick={() => {
                                        setSelectedWorld(world.id);
                                        setShowWorldDropdown(false);
                                    }}
                                    className={`px-4 py-2 cursor-pointer hover:bg-[#3a4c3a] ${selectedWorld === world.id ? 'bg-[#3a4c3a]' : ''
                                        }`}
                                >
                                    {world.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] mt-6 shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-lora text-[#e5d9a5]">Атрибуты</h3>
                    <Button
                        type="button"
                        onClick={rollAllDice}
                        className='text-sm'
                    >
                        🎲 Бросить всё
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {Object.entries({ strength: 'Сила', intelligence: 'Интеллект', magic: 'Магия', charisma: 'Харизма', dexterity: 'Ловкость', endurance: 'Выносливость' }).map(([key, label]) => (
                        <DiceStat key={key} label={label} value={attributes[key as keyof Character['attributes']]} />
                    ))}
                </div>
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] mt-6 shadow-md">
                <label className="block mb-2 font-lora text-[#e5d9a5]">Привязанные хроники</label>
                <div className="space-y-1">
                    {allChronicles.map((c) => (
                        <label key={c.id} className="flex items-center gap-2">
                            <input type="checkbox" checked={linkedChronicles.includes(c.id)} onChange={(e) => setLinkedChronicles((prev) => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} className="accent-[#c2a774]" />
                            <span className='font-lora text-[#f5e9c6]'>{c.title}</span>
                        </label>
                    ))}
                </div>
            </section>

            <ExtraFieldsEditor extra={extra} onChange={setExtra} />

            <div className="flex justify-end">
                <Button
                    onClick={handleSubmit}
                    className="font-semibold"
                >
                    {initialCharacter ? 'Сохранить изменения' : 'Добавить персонажа'}
                </Button>
            </div>
        </form>
    );
};
