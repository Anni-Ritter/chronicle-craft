import { Church, Gem, Landmark, MapIcon, Tent } from 'lucide-react';
import { useState, type JSX } from 'react';
import { Modal } from '../../components/Modal';
import type { IconType } from '../../types/mapPoint';

interface CreateMapPointModalProps {
    coords: { x: number; y: number };
    onClose: () => void;
    onSave: (data: { name: string; description: string; iconType: IconType }) => void;
}

const iconOptions: { type: IconType; label: string; icon: JSX.Element }[] = [
    { type: 'default', label: 'Пин', icon: <MapIcon size={20} /> },
    { type: 'camp', label: 'Лагерь', icon: <Tent size={20} /> },
    { type: 'city', label: 'Город', icon: <Landmark size={20} /> },
    { type: 'temple', label: 'Храм', icon: <Church size={20} /> },
    { type: 'treasure', label: 'Сокровище', icon: <Gem size={20} /> },
];

export const CreateMapPointModal = ({ coords, onClose, onSave }: CreateMapPointModalProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [iconType, setIconType] = useState<IconType>('default');

    return (
        <Modal isOpen onClose={onClose}>
            <div className="w-full bg-[#1e2c22] max-h-[90vh] no-scrollbar overflow-auto border border-[#c2a774] rounded-xl p-6 text-[#e5d9a5] font-lora space-y-4">
                <h2 className="text-2xl text-center font-garamond mb-2">Создание точки</h2>

                <p className="text-sm mb-2 text-[#c2a774]">
                    Координаты: <b>{(coords.x * 100).toFixed(1)}%</b>,{' '}
                    <b>{(coords.y * 100).toFixed(1)}%</b>
                </p>

                <input
                    type="text"
                    className="w-full bg-[#0e1b12] border border-[#c2a774] rounded px-3 py-2 placeholder:text-[#f5e9c6]/50"
                    placeholder="Название точки"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <textarea
                    className="w-full bg-[#0e1b12] border border-[#c2a774] rounded px-3 py-2 placeholder:text-[#f5e9c6]/50"
                    placeholder="Описание"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <div>
                    <p className="mb-1 text-sm">Тип иконки</p>
                    <div className="flex flex-wrap gap-3">
                        {iconOptions.map((opt) => (
                            <button
                                key={opt.type}
                                type="button"
                                onClick={() => setIconType(opt.type)}
                                className={`flex items-center gap-1 px-3 py-2 border rounded transition ${iconType === opt.type
                                    ? 'border-[#c2a774] bg-[#3a4c3a]'
                                    : 'border-[#3d4a38] hover:bg-[#3a4c3a]'
                                    }`}
                            >
                                {opt.icon}
                                <span className="text-sm">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button
                        className="px-4 py-2 rounded bg-[#3d4a38] hover:bg-[#4c5a49] text-[#e5d9a5]"
                        onClick={onClose}
                    >
                        Отмена
                    </button>
                    <button
                        className="px-4 py-2 rounded bg-[#c2a774] text-[#0e1b12] hover:bg-[#e5d9a5]"
                        disabled={!name.trim()}
                        onClick={() => onSave({ name, description, iconType })}
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </Modal>
    );
};
