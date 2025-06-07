import React from 'react';
import type { Relationship } from '../../types/relationshipType';

interface Props {
    isOpen: boolean;
    onSelect: (type: Relationship['type']) => Promise<void>;
    onClose: () => void;
    onDelete?: () => void;
}

const types: ("друг" | "возлюбленные" | "враг" | "родство" | "союз" | "бывший" | "загадка" | "ученик")[] = [
    'друг',
    'возлюбленные',
    'враг',
    'родство',
    'союз',
    'бывший',
    'загадка',
    'ученик',
];

export const RelationTypeModal: React.FC<Props> = ({ isOpen, onSelect, onClose, onDelete }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded shadow max-w-sm w-full">
                <h3 className="text-lg font-bold mb-2">Выберите тип связи</h3>
                <ul>
                    {types.map(type => (
                        <li key={type}>
                            <button
                                onClick={() => onSelect(type)}
                                className="text-indigo-600 hover:underline block w-full text-left py-1"
                            >
                                {type}
                            </button>
                        </li>
                    ))}
                </ul>
                <button onClick={onClose} className="text-gray-600 mt-2 hover:underline">
                    Отмена
                </button>
                {onDelete && (
                    <button
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 mt-4"
                        onClick={onDelete}
                    >
                        🗑 Удалить связь
                    </button>
                )}
            </div>
        </div>
    );
};
