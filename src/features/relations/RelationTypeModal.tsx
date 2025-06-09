import React, { useEffect, useState } from 'react';

interface Props {
    isOpen: boolean;
    onSelect: (data: { label: string; color: string }) => Promise<void>;
    onClose: () => void;
    onDelete?: () => void;
    initialData?: { label: string; color: string };
}

export const RelationTypeModal: React.FC<Props> = ({
    isOpen,
    onSelect,
    onClose,
    onDelete,
    initialData,
}) => {
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

    return !isOpen ? null : (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full space-y-4">
                <h3 className="text-lg font-bold">
                    {onDelete ? 'Редактировать связь' : 'Новая связь'}
                </h3>

                <div>
                    <label className="block mb-1 text-sm font-medium">Название связи</label>
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                        placeholder="например, союзник"
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium">Цвет связи</label>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-10 h-10 p-0 border cursor-pointer"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="text-gray-600 hover:underline">
                        Отмена
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        {onDelete ? 'Сохранить' : 'Создать'}
                    </button>
                </div>

                {onDelete && (
                    <button
                        className="bg-red-600 text-white px-4 py-2 rounded w-full hover:bg-red-700"
                        onClick={onDelete}
                    >
                        🗑 Удалить связь
                    </button>
                )}
            </div>
        </div>
    );
};

