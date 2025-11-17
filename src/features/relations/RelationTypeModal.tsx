import { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal';
import { HeartPlus, Save, Trash2, Sparkles } from 'lucide-react';
import { Button } from '../../components/ChronicleButton';

interface RelationTypeModalProps {
    isOpen: boolean;
    onSelect: (data: { label: string; color: string }) => Promise<void> | void;
    onClose: () => void;
    onDelete?: () => void;
    initialData?: { label: string; color: string };
    modalClassName?: string;
    buttonClassName?: string;
}

const PRESET_COLORS = [
    '#f97373', // красный
    '#fb923c', // оранжевый
    '#eab308', // золотой
    '#4ade80', // зелёный
    '#38bdf8', // голубой
    '#6366f1', // индиго
    '#a855f7', // фиолетовый
    '#ec4899', // розовый
];

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
        if (initialData && isOpen) {
            setLabel(initialData.label || '');
            setColor(initialData.color || '#4ade80');
        }
        if (!initialData && isOpen) {
            setLabel('');
            setColor('#4ade80');
        }
    }, [initialData, isOpen]);

    const handleConfirm = () => {
        if (!label.trim()) return;
        onSelect({ label: label.trim(), color });
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div
                className={
                    modalClassName ||
                    'w-full max-w-xl bg-[#050806]/95 border border-[#3a4a34] rounded-3xl shadow-[0_0_32px_#000] px-5 sm:px-7 py-7 sm:py-8 text-[#e5d9a5] font-lora space-y-6 relative overflow-hidden'
                }
            >
                <div className="pointer-events-none absolute -top-24 -right-10 w-40 h-40 rounded-full bg-[#c2a77433] blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-20 w-52 h-52 rounded-full bg-[#4ade8030] blur-3xl" />

                <div className="relative space-y-4">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3a4a34] bg-[#101712]/80 text-[11px] uppercase tracking-[0.18em] text-[#c7bc98]">
                            <Sparkles size={14} className="text-[#c2a774]" />
                            <span>{onDelete ? 'редактирование связи' : 'новая связь'}</span>
                        </div>

                        <h2 className="text-xl sm:text-2xl font-garamond font-bold tracking-wide">
                            {onDelete ? 'Изменить связь между персонажами' : 'Создать связь между персонажами'}
                        </h2>
                    </div>

                    <div className="space-y-2 mt-2">
                        <label className="text-sm sm:text-base font-medium font-lora text-[#f5e9c6]">
                            Название связи
                        </label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Например: союзник, наставник, соперник…"
                            className="w-full rounded-2xl px-4 py-2.5 bg-[#0b1510] text-[#f5e9c6] border border-[#3a4a34] placeholder:text-[#c7bc98]/70 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#c2a77455] focus:border-[#c2a774aa] transition"
                        />
                    </div>

                    <div className="space-y-3 mt-3">
                        <label className="text-sm sm:text-base font-medium text-[#f5e9c6]">
                            Цвет линии и подписи
                        </label>

                        <div className="flex items-center gap-4">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl border border-[#c2a77488] bg-transparent cursor-pointer shadow-[0_0_12px_#000]"
                                style={{ backgroundColor: color }}
                            />
                            <div className="flex flex-wrap gap-2">
                                {PRESET_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={`w-6 h-6 rounded-full border transition hover:scale-110 ${c === color
                                                ? 'border-[#f5e9c6] ring-2 ring-[#c2a774aa]'
                                                : 'border-[#3a4a34]'
                                            }`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-between items-stretch sm:items-center pt-4">
                        <div className="flex-1 flex gap-3">
                            <Button
                                type="button"
                                onClick={handleConfirm}
                                className="flex-1 bg-gradient-to-r from-[#c2a774] to-[#e5d9a5] text-[#1f2b1f] hover:from-[#e5d9a5] hover:to-[#fffbe6] border border-[#c2a774] shadow-[0_0_18px_#c2a77466] rounded-2xl py-2.5 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    {onDelete ? (
                                        <>
                                            <Save size={18} /> Сохранить
                                        </>
                                    ) : (
                                        <>
                                            <HeartPlus size={18} /> Создать связь
                                        </>
                                    )}
                                </span>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="hidden sm:flex items-center justify-center px-4 py-2.5 rounded-2xl border border-[#3a4a34] text-[#c7bc98] hover:border-[#c2a774aa] hover:text-[#f5e9c6] bg-[#0b1510] text-sm"
                            >
                                Отмена
                            </Button>
                        </div>

                        {onDelete && (
                            <Button
                                type="button"
                                variant="danger"
                                icon={<Trash2 size={18} />}
                                onClick={onDelete}
                                className="sm:w-auto w-full rounded-2xl text-sm sm:text-base"
                            >
                                Удалить связь
                            </Button>
                        )}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="sm:hidden w-full mt-1 rounded-2xl border border-[#3a4a34] text-[#c7bc98] hover:border-[#c2a774aa] hover:text-[#f5e9c6] bg-[#0b1510] text-sm"
                    >
                        Отмена
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
