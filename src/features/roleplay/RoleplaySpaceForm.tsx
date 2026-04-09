import { useState } from 'react';
import { Globe, PencilLine, ScrollText } from 'lucide-react';
import { Button } from '../../components/ChronicleButton';
import { Select } from '../../components/Select';
import type { World } from '../../types/world';

interface RoleplaySpaceFormProps {
    worlds: World[];
    initialValues?: {
        title: string;
        description: string | null;
        world_id: string | null;
    };
    titleText?: string;
    submitText?: string;
    onSubmit: (values: { title: string; description: string | null; world_id: string | null }) => Promise<void>;
    onCancel: () => void;
}

export const RoleplaySpaceForm = ({ worlds, initialValues, titleText, submitText, onSubmit, onCancel }: RoleplaySpaceFormProps) => {
    const [title, setTitle] = useState(initialValues?.title ?? '');
    const [description, setDescription] = useState(initialValues?.description ?? '');
    const [worldId, setWorldId] = useState<string | null>(initialValues?.world_id ?? null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setIsSubmitting(true);
        await onSubmit({
            title: title.trim(),
            description: description.trim() || null,
            world_id: worldId,
        });
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-2xl font-garamond text-[#e5d9a5]">{titleText ?? 'Новое пространство ролевой'}</h3>
            <label className="block space-y-1">
                <span className="text-sm text-[#c7bc98]">Название</span>
                <div className="relative">
                    <PencilLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#c2a774]/75" size={18} />
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Например: Таверна у Чёрного моста"
                        className="w-full rounded-xl border border-[#3a4a34] bg-[#0e1b12]/80 py-3 pl-10 pr-4 text-[#e5d9a5] focus:border-[#c2a774] focus:outline-none"
                        required
                    />
                </div>
            </label>

            <label className="block space-y-1">
                <span className="text-sm text-[#c7bc98]">Описание</span>
                <div className="relative">
                    <ScrollText className="pointer-events-none absolute left-3 top-3 text-[#c2a774]/75" size={18} />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Короткое описание пространства..."
                        rows={4}
                        className="w-full rounded-xl border border-[#3a4a34] bg-[#0e1b12]/80 py-3 pl-10 pr-4 text-[#e5d9a5] focus:border-[#c2a774] focus:outline-none"
                    />
                </div>
            </label>

            <Select
                value={worldId}
                onChange={setWorldId}
                placeholder="Без привязки к миру"
                icon={<Globe className="h-[18px] w-[18px] text-[#c2a774]" aria-hidden />}
                options={worlds.map((world) => ({ value: world.id, label: world.name }))}
            />

            <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
                    Отмена
                </Button>
                <Button type="submit" className="w-full" onClick={() => undefined}>
                    {isSubmitting ? 'Сохранение...' : (submitText ?? 'Создать')}
                </Button>
            </div>
        </form>
    );
};
