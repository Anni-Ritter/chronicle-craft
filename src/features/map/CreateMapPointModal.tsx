import React, { useState } from 'react';

interface Props {
    coords: { x: number; y: number };
    onClose: () => void;
    onSave: (name: string) => void;
}

export const CreateMapPointModal: React.FC<Props> = ({ coords, onClose, onSave }) => {
    const [name, setName] = useState('');

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4">Создание точки</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Координаты: <b>{(coords.x * 100).toFixed(1)}%</b>, <b>{(coords.y * 100).toFixed(1)}%</b>
                </p>
                <input
                    type="text"
                    className="w-full border px-3 py-2 rounded mb-4"
                    placeholder="Название точки"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <button
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                        onClick={onClose}
                    >
                        Отмена
                    </button>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                        disabled={!name.trim()}
                        onClick={() => onSave(name)}
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};
