import { useState } from 'react';
import { BookOpen, Globe, Image, Settings } from 'lucide-react';
import { Button } from '../../components/ChronicleButton';
import { Select } from '../../components/Select';
import { StorageImageUploader } from '../../components/StorageImageUploader';
import type { World } from '../../types/world';
import type { Chronicle } from '../../types/chronicle';

interface RoleplaySceneFormProps {
    worlds: World[];
    chronicles: Chronicle[];
    initialValues?: {
        title: string;
        description: string | null;
        world_id: string | null;
        chronicle_id: string | null;
        background_image: string | null;
        status: string;
        settings: Record<string, unknown> | null;
    };
    titleText?: string;
    submitText?: string;
    onSubmit: (values: {
        title: string;
        description: string | null;
        world_id: string | null;
        chronicle_id: string | null;
        background_image: string | null;
        status: string;
        settings: Record<string, unknown> | null;
    }) => Promise<void>;
    onCancel: () => void;
}

export const RoleplaySceneForm = ({ worlds, chronicles, initialValues, titleText, submitText, onSubmit, onCancel }: RoleplaySceneFormProps) => {
    const [title, setTitle] = useState(initialValues?.title ?? '');
    const [description, setDescription] = useState(initialValues?.description ?? '');
    const [worldId, setWorldId] = useState<string | null>(initialValues?.world_id ?? null);
    const [chronicleId, setChronicleId] = useState<string | null>(initialValues?.chronicle_id ?? null);
    const [backgroundImage, setBackgroundImage] = useState(initialValues?.background_image ?? '');
    const [backgroundMode, setBackgroundMode] = useState<'url' | 'upload'>('upload');
    const [status, setStatus] = useState(initialValues?.status ?? 'active');
    const [settingsJson, setSettingsJson] = useState(initialValues?.settings ? JSON.stringify(initialValues.settings) : '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        let parsedSettings: Record<string, unknown> | null = null;
        if (settingsJson.trim()) {
            try {
                parsedSettings = JSON.parse(settingsJson) as Record<string, unknown>;
            } catch {
                return;
            }
        }
        setIsSubmitting(true);
        await onSubmit({
            title: title.trim(),
            description: description.trim() || null,
            world_id: worldId,
            chronicle_id: chronicleId,
            background_image: backgroundImage.trim() || null,
            status,
            settings: parsedSettings,
        });
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-2xl font-garamond text-[#e5d9a5]">{titleText ?? 'Создать сцену'}</h3>
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название сцены"
                className="w-full rounded-xl border border-[#3a4a34] bg-[#0e1b12]/80 px-4 py-3 text-[#e5d9a5] focus:border-[#c2a774] focus:outline-none"
                required
            />
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание сцены"
                rows={3}
                className="w-full rounded-xl border border-[#3a4a34] bg-[#0e1b12]/80 px-4 py-3 text-[#e5d9a5] focus:border-[#c2a774] focus:outline-none"
            />
            <Select
                value={worldId}
                onChange={setWorldId}
                placeholder="Мир (опционально)"
                icon={<Globe className="h-[18px] w-[18px] text-[#c2a774]" aria-hidden />}
                options={worlds.map((world) => ({ value: world.id, label: world.name }))}
            />
            <Select
                value={chronicleId}
                onChange={setChronicleId}
                placeholder="Связанная хроника (опционально)"
                icon={<BookOpen className="h-[18px] w-[18px] text-[#c2a774]" aria-hidden />}
                options={chronicles.map((chronicle) => ({ value: chronicle.id, label: chronicle.title || 'Без названия' }))}
            />
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-[#c7bc98]">
                        <Image size={16} className="text-[#c2a774]" /> Фон сцены
                    </span>
                    <div className="flex gap-2">
                        <Button type="button" variant={backgroundMode === 'upload' ? 'default' : 'outline'} className="!px-3 !py-1 !text-xs" onClick={() => setBackgroundMode('upload')}>
                            Загрузить
                        </Button>
                        <Button type="button" variant={backgroundMode === 'url' ? 'default' : 'outline'} className="!px-3 !py-1 !text-xs" onClick={() => setBackgroundMode('url')}>
                            URL
                        </Button>
                    </div>
                </div>
                {backgroundMode === 'url' ? (
                    <div className="relative">
                        <Image className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#c2a774]/75" size={18} />
                        <input
                            value={backgroundImage}
                            onChange={(e) => setBackgroundImage(e.target.value)}
                            placeholder="URL фонового изображения"
                            className="w-full rounded-xl border border-[#3a4a34] bg-[#0e1b12]/80 py-3 pl-10 pr-4 text-[#e5d9a5] focus:border-[#c2a774] focus:outline-none"
                        />
                    </div>
                ) : (
                    <StorageImageUploader
                        bucket="scene-backgrounds"
                        onUpload={setBackgroundImage}
                        initialUrl={backgroundImage || undefined}
                        emptyLabel="Загрузить фон сцены"
                        previewClassName="h-32 w-full rounded-xl object-cover border border-[#3a4a34]"
                    />
                )}
            </div>
            <Select
                value={status}
                onChange={(value) => setStatus(value ?? 'active')}
                placeholder="Статус"
                options={[
                    { value: 'active', label: 'active' },
                    { value: 'paused', label: 'paused' },
                    { value: 'archived', label: 'archived' },
                ]}
            />
            <div className="relative">
                <Settings className="pointer-events-none absolute left-3 top-3 text-[#c2a774]/75" size={18} />
                <textarea
                    value={settingsJson}
                    onChange={(e) => setSettingsJson(e.target.value)}
                    placeholder='JSON settings, например: {"dice":"d20"}'
                    rows={3}
                    className="w-full rounded-xl border border-[#3a4a34] bg-[#0e1b12]/80 py-3 pl-10 pr-4 text-[#e5d9a5] focus:border-[#c2a774] focus:outline-none"
                />
            </div>
            <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
                    Отмена
                </Button>
                <Button type="submit" className="w-full" onClick={() => undefined}>
                    {isSubmitting ? 'Сохранение...' : (submitText ?? 'Создать сцену')}
                </Button>
            </div>
        </form>
    );
};
