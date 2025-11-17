import { Church, Gem, Landmark, MapIcon, Tent } from 'lucide-react';
import { useState, type JSX } from 'react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/ChronicleButton';
import type { IconType } from '../../types/mapPoint';

interface CreateMapPointModalProps {
    coords: { x: number; y: number };
    onClose: () => void;
    onSave: (data: { name: string; description: string; iconType: IconType }) => void;
}

const iconOptions: { type: IconType; label: string; icon: JSX.Element }[] = [
    { type: 'default', label: 'Пин', icon: <MapIcon size={18} /> },
    { type: 'camp', label: 'Лагерь', icon: <Tent size={18} /> },
    { type: 'city', label: 'Город', icon: <Landmark size={18} /> },
    { type: 'temple', label: 'Храм', icon: <Church size={18} /> },
    { type: 'treasure', label: 'Сокровище', icon: <Gem size={18} /> },
];

export const CreateMapPointModal = ({ coords, onClose, onSave }: CreateMapPointModalProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [iconType, setIconType] = useState<IconType>('default');

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({ name: name.trim(), description: description.trim(), iconType });
    };

    return (
        <Modal isOpen onClose={onClose}>
            <div className="w-full no-scrollbar overflow-auto text-[#e5d9a5] font-lora space-y-6">
                <header className="space-y-2 text-center">
                    <h2 className="text-2xl font-garamond flex items-center justify-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1b261a] border border-[#c2a77466]">
                            <MapIcon className="w-4 h-4 text-[#c2a774]" />
                        </span>
                        Новая точка на карте
                    </h2>
                    <p className="text-xs sm:text-sm text-[#c7bc98]">
                        Добавьте заметку на карту: город, храм, лагерь или спрятанное сокровище.
                    </p>
                    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-[#182413] border border-[#c2a77433] text-[11px] sm:text-xs text-[#c2a774]">
                        <span className="opacity-70">Координаты</span>
                        <span className="font-mono">
                            {(coords.x * 100).toFixed(1)}% · {(coords.y * 100).toFixed(1)}%
                        </span>
                    </div>
                </header>

                <section className="shadow-inner space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm text-[#c2a774]">Название точки</label>
                        <input
                            type="text"
                            className="w-full bg-[#0e1b12] border border-[#c2a774] rounded-xl px-3 py-2 text-sm sm:text-base placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77466]"
                            placeholder="Например, Лагерь у старого дуба"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-[#c2a774]">
                            Описание <span className="text-[#c7bc98] text-[11px]">(опционально)</span>
                        </label>
                        <textarea
                            className="w-full bg-[#0e1b12] border border-[#c2a774] rounded-xl px-3 py-2 text-sm sm:text-base placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77466] resize-none"
                            placeholder="Короткая заметка: кто здесь бывает, что спрятано, почему важно…"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-[#c2a774]">Тип отметки</p>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {iconOptions.map((opt) => {
                                const active = iconType === opt.type;
                                return (
                                    <button
                                        key={opt.type}
                                        type="button"
                                        onClick={() => setIconType(opt.type)}
                                        className={[
                                            "flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs sm:text-sm transition shadow-sm",
                                            active
                                                ? "border-[#c2a774] bg-[#3a4c3a] text-[#f5e9c6] shadow-[0_0_12px_#c2a77455]"
                                                : "border-[#3d4a38] bg-[#182313] text-[#d6c5a2] hover:bg-[#2f3f2c]"
                                        ].join(' ')}
                                    >
                                        <span className={active ? "text-[#0e1b12]" : "text-[#c2a774]"}>
                                            {opt.icon}
                                        </span>
                                        <span>{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <footer className="flex justify-end gap-3 pt-2">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={onClose}
                        className="text-sm px-4"
                    >
                        Отмена
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        className="text-sm px-4 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Сохранить точку
                    </Button>
                </footer>
            </div>
        </Modal>
    );
};
