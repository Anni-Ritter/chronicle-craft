import { useEffect, useState } from 'react';
import type { Character, ExtraField } from '../../types/character';
import { AvatarUploader } from '../../components/AvatarUploader';
import { supabase } from '../../lib/supabaseClient';
import { ExtraFieldsEditor } from '../../components/ExtraFieldsEditor';
import { DiceStat } from '../../components/DiceStat';
import { v4 as uuidv4 } from 'uuid';
import { BookOpen, ChevronDown, Globe2, LinkIcon, Sparkles, Upload } from 'lucide-react';
import { RichTextEditor } from '../../components/RichTextEditor';
import { Button } from '../../components/ChronicleButton';
import { useWorldStore } from '../../store/useWorldStore';

interface CharacterFormProps {
    onFinish: () => void;
    initialCharacter?: Character;
    onSave: (char: Character) => void;
}

export const CharacterForm = ({ onFinish, initialCharacter, onSave }: CharacterFormProps) => {
    const [avatarMode, setAvatarMode] = useState<"url" | "upload">(
        initialCharacter?.avatar?.startsWith("http") ? "url" : "upload"
    );

    const normalizeExtra = (input: unknown): ExtraField[] => {
        if (Array.isArray(input)) return input;
        if (input && typeof input === "object") {
            return Object.entries(input).map(([key, value]) => ({
                id: uuidv4(),
                key,
                value: String(value),
            }));
        }
        return [];
    };

    const [extra, setExtra] = useState<ExtraField[]>(normalizeExtra(initialCharacter?.extra));
    const [name, setName] = useState(initialCharacter?.name || "");
    const [bio, setBio] = useState(initialCharacter?.bio || "");
    const [avatar, setAvatar] = useState(initialCharacter?.avatar || "");
    const [attributes, setAttributes] = useState<Character["attributes"]>({
        strength: initialCharacter?.attributes?.strength || 0,
        intelligence: initialCharacter?.attributes?.intelligence || 0,
        magic: initialCharacter?.attributes?.magic || 0,
        charisma: initialCharacter?.attributes?.charisma || 0,
        dexterity: initialCharacter?.attributes?.dexterity || 0,
        endurance: initialCharacter?.attributes?.endurance || 0,
    });
    const [status, setStatus] = useState(initialCharacter?.status || "");
    const [species, setSpecies] = useState(initialCharacter?.species || "");
    const [gender, setGender] = useState(initialCharacter?.gender || "");
    const [origin, setOrigin] = useState({ name: initialCharacter?.origin?.name || "" });
    const [location, setLocation] = useState({ name: initialCharacter?.location?.name || "" });
    const [age, setAge] = useState(initialCharacter?.age || "");
    const [birthday, setBirthday] = useState(initialCharacter?.birthday || "");
    const [occupation, setOccupation] = useState(initialCharacter?.occupation || "");
    const [affiliation, setAffiliation] = useState(initialCharacter?.affiliation || "");
    const [title, setTitle] = useState(initialCharacter?.title || "");
    const [userId, setUserId] = useState<string | null>(null);
    const [allChronicles, setAllChronicles] = useState<{ id: string; title: string }[]>([]);
    const [linkedChronicles, setLinkedChronicles] = useState<string[]>(
        initialCharacter?.linked_chronicles || []
    );
    const { worlds } = useWorldStore();
    const [selectedWorld, setSelectedWorld] = useState<string>(initialCharacter?.world_id || "");
    const [showWorldDropdown, setShowWorldDropdown] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data, error }) => {
            if (!error && data.user) setUserId(data.user.id);
        });
    }, []);

    useEffect(() => {
        if (userId) {
            supabase
                .from("chronicles")
                .select("id, title")
                .eq("user_id", userId)
                .then(({ data }) => {
                    if (data) setAllChronicles(data);
                });
        }
    }, [userId]);

    const fieldMap: Record<
        | "status"
        | "age"
        | "birthday"
        | "occupation"
        | "affiliation"
        | "title"
        | "species"
        | "gender"
        | "origin"
        | "location",
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

    const handleSubmit = async (e: React.FormEvent) => {
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

        try {
            await onSave(updatedChar);
            onFinish();
        } catch (error) {
            console.error("Ошибка при сохранении персонажа:", error);
        }
    };

    const rollAllDice = () => {
        const keys: (keyof Character["attributes"])[] = [
            "strength",
            "intelligence",
            "magic",
            "charisma",
            "dexterity",
            "endurance",
        ];
        keys.forEach((key, i) => {
            setTimeout(() => {
                const roll = Math.floor(Math.random() * 12) + 1;
                setAttributes((prev) => ({ ...prev, [key]: roll }));
            }, i * 150);
        });
    };

    const labelMap = {
        status: "Статус",
        age: "Возраст",
        species: "Раса",
        gender: "Пол",
        birthday: "День рождения",
        occupation: "Профессия",
        affiliation: "Афилиация",
        title: "Звание",
        origin: "Родина",
        location: "Жилище",
    } as const;

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-3xl mx-auto space-y-8 text-[#e5d9a5] font-lora"
        >
            <header className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3a4a34] bg-[#101712]/80 text-[11px] uppercase tracking-[0.18em] text-[#c7bc98]">
                    <Sparkles size={14} className="text-[#c2a774]" />
                    <span>{initialCharacter ? "редактирование персонажа" : "новый персонаж"}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-garamond font-bold tracking-wide flex items-center justify-center gap-2">
                    <BookOpen size={22} className="text-[#c2a774]" />
                    Досье персонажа
                </h2>
                <p className="text-xs md:text-sm text-[#c7bc98]">
                    Заполните основные данные, атрибуты и привязанные хроники, чтобы персонаж органично
                    вошёл в ваш мир.
                </p>
            </header>

            <section className="bg-[#141f16]/90 rounded-2xl border border-[#3a4a34] p-4 md:p-5 shadow-[0_0_25px_#00000066] space-y-5">
                <div className="grid md:grid-cols-[1.1fr_1.2fr] gap-5">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm mb-1 text-[#f1eac0] font-semibold">
                                Имя персонажа
                            </label>
                            <input
                                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-[#0b1510] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/45 focus:border-[#c2a774aa] focus:outline-none focus:ring-2 focus:ring-[#c2a77433] text-[15px]"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Вэлл Сиренн, Наэне Асаори..."
                            />
                        </div>

                        <div>
                            <label className="mb-1 text-sm text-[#f1eac0] font-semibold flex items-center gap-2">
                                <Globe2 size={16} className="text-[#c2a774]" />
                                Мир / вселенная
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowWorldDropdown((prev) => !prev)}
                                    className="w-full px-4 py-2.5 bg-[#0b1510] border border-[#3a4a34] text-[#f5e9c6] rounded-xl flex justify-between items-center text-[14px] md:text-[15px] hover:border-[#c2a774aa] transition"
                                >
                                    <span>
                                        {selectedWorld
                                            ? worlds.find((w) => w.id === selectedWorld)?.name
                                            : "— Мир не выбран —"}
                                    </span>
                                    <ChevronDown size={16} className="text-[#c2a774]" />
                                </button>

                                {showWorldDropdown && (
                                    <ul className="absolute left-0 mt-2 min-w-full bg-[#050806] border border-[#3a4a34] rounded-xl shadow-[0_0_25px_#000] text-[#f5e9c6] z-30 overflow-hidden text-sm max-h-60 overflow-y-auto custom-scrollbar">
                                        <li
                                            className="px-4 py-2 hover:bg-[#141f16] cursor-pointer"
                                            onClick={() => {
                                                setSelectedWorld("");
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
                                                className={`px-4 py-2 cursor-pointer hover:bg-[#141f16] ${selectedWorld === world.id ? "bg-[#141f16]" : ""
                                                    }`}
                                            >
                                                {world.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(
                            [
                                "status",
                                "age",
                                "species",
                                "gender",
                                "birthday",
                                "occupation",
                                "affiliation",
                                "title",
                                "origin",
                                "location",
                            ] as const
                        ).map((field) => {
                            const [value, setter] = fieldMap[field];
                            const stringValue = typeof value === "string" ? value : value.name;

                            return (
                                <div key={field} className="flex flex-col">
                                    <label className="block mb-1 text-xs md:text-sm text-[#f1eac0] font-semibold">
                                        {labelMap[field]}
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 rounded-xl bg-[#0b1510] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/45 text-[14px] focus:border-[#c2a774aa] focus:outline-none focus:ring-2 focus:ring-[#c2a77433]"
                                        value={stringValue}
                                        onChange={(e) =>
                                            setter(
                                                typeof value === "string"
                                                    ? e.target.value
                                                    : { name: e.target.value }
                                            )
                                        }
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="bg-[#141f16]/90 rounded-2xl border border-[#3a4a34] p-4 md:p-5 shadow-[0_0_25px_#00000066] space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <BookOpen size={18} className="text-[#c2a774]" />
                    <h3 className="text-lg md:text-xl font-garamond text-[#e5d9a5]">
                        Биография
                    </h3>
                </div>
                <p className="text-xs md:text-sm text-[#c7bc98] mb-2">
                    Опишите прошлое, характер, ключевые события и тайны персонажа. Это текст, к
                    которому вы будете часто возвращаться.
                </p>
                <RichTextEditor content={bio} onChange={setBio} />
            </section>

            <section className="bg-[#141f16]/90 rounded-2xl border border-[#3a4a34] p-4 md:p-5 shadow-[0_0_25px_#00000066] space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Upload size={18} className="text-[#c2a774]" />
                        <h3 className="text-lg font-garamond text-[#e5d9a5]">Аватар</h3>
                    </div>
                    <div className="flex gap-2 max-sm:w-full max-sm:justify-end">
                        <Button
                            type="button"
                            onClick={() => setAvatarMode("url")}
                            className={`text-xs md:text-sm px-3 py-1.5 rounded-xl ${avatarMode === "url"
                                    ? "bg-[#c2a774] text-[#26381f]"
                                    : "bg-[#0b1510] text-[#e5d9a5] hover:text-[#26381f]"
                                }`}
                            icon={<LinkIcon size={14} />}
                        >
                            Ссылка
                        </Button>
                        <Button
                            type="button"
                            onClick={() => setAvatarMode("upload")}
                            className={`text-xs md:text-sm px-3 py-1.5 rounded-xl ${avatarMode === "upload"
                                    ? "bg-[#c2a774] text-[#26381f]"
                                    : "bg-[#0b1510] text-[#e5d9a5] hover:text-[#26381f]"
                                }`}
                            icon={<Upload size={14} />}
                        >
                            Загрузить
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:items-center">
                    {avatar && avatarMode === "url" && (
                        <img
                            src={avatar}
                            alt="avatar preview"
                            className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-full border border-[#c2a774] shadow-[0_0_18px_#000]"
                        />
                    )}

                    <div className="flex-1">
                        {avatarMode === "url" ? (
                            <input
                                className="w-full px-4 py-2.5 mt-1 rounded-xl bg-[#0b1510] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#f5e9c6]/45 text-[14px] focus:border-[#c2a774aa] focus:outline-none focus:ring-2 focus:ring-[#c2a77433]"
                                value={avatar}
                                onChange={(e) => setAvatar(e.target.value)}
                                placeholder="Вставьте URL изображения персонажа"
                            />
                        ) : (
                            <AvatarUploader
                                onUpload={setAvatar}
                                initialUrl={avatar}
                                bucket="avatars"
                            />
                        )}
                    </div>
                </div>
            </section>

            <section className="bg-[#141f16]/90 rounded-2xl border border-[#3a4a34] p-4 md:p-5 shadow-[0_0_25px_#00000066]">
                <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
                    <h3 className="text-lg md:text-xl font-garamond text-[#e5d9a5]">
                        Атрибуты
                    </h3>
                    <Button
                        type="button"
                        onClick={rollAllDice}
                        className="text-xs md:text-sm"
                    >
                        🎲 Бросить всё
                    </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {Object.entries({
                        strength: "Сила",
                        intelligence: "Интеллект",
                        magic: "Магия",
                        charisma: "Харизма",
                        dexterity: "Ловкость",
                        endurance: "Выносливость",
                    }).map(([key, label]) => (
                        <DiceStat
                            key={key}
                            label={label}
                            value={attributes[key as keyof Character["attributes"]]}
                        />
                    ))}
                </div>
            </section>

            <section className="bg-[#141f16]/90 rounded-2xl border border-[#3a4a34] p-4 md:p-5 shadow-[0_0_25px_#00000066]">
                <label className="mb-2 font-garamond text-lg text-[#e5d9a5] flex items-center gap-2">
                    <BookOpen size={18} className="text-[#c2a774]" />
                    Привязанные хроники
                </label>
                {allChronicles.length === 0 ? (
                    <p className="text-xs md:text-sm text-[#c7bc98]">
                        У вас пока нет хроник. Вы сможете привязать их позже.
                    </p>
                ) : (
                    <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                        {allChronicles.map((c) => (
                            <label
                                key={c.id}
                                className="flex items-center gap-2 text-sm text-[#f5e9c6]"
                            >
                                <input
                                    type="checkbox"
                                    checked={linkedChronicles.includes(c.id)}
                                    onChange={(e) =>
                                        setLinkedChronicles((prev) =>
                                            e.target.checked
                                                ? [...prev, c.id]
                                                : prev.filter((id) => id !== c.id)
                                        )
                                    }
                                    className="accent-[#c2a774]"
                                />
                                <span className="truncate">{c.title}</span>
                            </label>
                        ))}
                    </div>
                )}
            </section>

            <ExtraFieldsEditor extra={extra} onChange={setExtra} />

            <div className="flex justify-end pt-2">
                <Button type="submit" className="font-semibold text-[15px] px-6">
                    {initialCharacter ? "Сохранить изменения" : "Добавить персонажа"}
                </Button>
            </div>
        </form>
    );
};