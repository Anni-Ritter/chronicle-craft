import { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal';
import { HeartPlus, Save, Trash2 } from 'lucide-react';
import { Button } from '../../components/ChronicleButton';

interface RelationTypeModalProps {
    isOpen: boolean;
    onSelect: (data: { label: string; color: string }) => Promise<void>;
    onClose: () => void;
    onDelete?: () => void;
    initialData?: { label: string; color: string };
    modalClassName?: string;
    buttonClassName?: string;
}

export const RelationTypeModal = ({
    isOpen,
    onSelect,
    onClose,
    onDelete,
    initialData,
    modalClassName,
}: RelationTypeModalProps) => {
    const [label, setLabel] = useState('');
    const [color, setColor] = useState('#4ade80');

    useEffect(() => {
        if (initialData) {
            setLabel(initialData.label || '');
            setColor(initialData.color || '#4ade80');
        }
    }, [initialData, isOpen]);

    const handleConfirm = () => {
        if (label.trim()) {
            onSelect({ label: label.trim(), color });
        }
    };


    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div
                className={
                    modalClassName ||
                    'w-full max-w-xl bg-[#0e1b12] border border-[#c2a774] rounded-3xl shadow-lg px-6 py-8 text-[#e5d9a5] font-lora space-y-6'
                }
            >
                <h2 className="text-2xl text-center font-semibold tracking-wide mb-4">
                    {onDelete ? '✎ Редактирование связи' : '🌿 Новая связь'}
                </h2>

                <div className="space-y-2">
                    <label className="text-base font-medium font-lora">Название связи</label>
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Например, союзник"
                        className="w-full rounded-xl px-4 py-2 bg-[#223120] text-[#f5e9c6] border border-[#c2a774] placeholder-[#b4b48a] focus:outline-none focus:ring focus:ring-[#c2a774]"
                    />
                </div>

                <div className="space-y-2 flex flex-col mt-4">
                    <label className="text-base font-medium">Цвет связи</label>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-12 h-12 rounded-xl border border-[#c2a774] bg-transparent cursor-pointer"
                        style={{ backgroundColor: color }}
                    />
                </div>

                <div className="flex gap-6 justify-between items-center pt-12">
                    <Button onClick={handleConfirm}>
                        {onDelete ? (
                            <span className="flex items-center gap-1">
                                <Save /> Сохранить
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <HeartPlus /> Создать
                            </span>
                        )}
                    </Button>

                    {onDelete && (
                        <Button variant="danger" icon={<Trash2 />} onClick={onDelete} />
                    )}
                </div>
            </div>
        </Modal>
    );
};

