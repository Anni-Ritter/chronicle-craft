import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ExtraField } from '../types/character';

interface ExtraFieldsEditorProps {
    extra: ExtraField[];
    onChange: (updated: ExtraField[]) => void;
}

export const ExtraFieldsEditor: React.FC<ExtraFieldsEditorProps> = ({ extra, onChange }) => {
    const handleChange = (id: string, field: Partial<Pick<ExtraField, 'key' | 'value'>>) => {
        onChange(extra.map(e => (e.id === id ? { ...e, ...field } : e)));
    };

    const handleDelete = (id: string) => {
        onChange(extra.filter(e => e.id !== id));
    };

    const handleAdd = () => {
        onChange([...extra, { id: uuidv4(), key: '', value: '' }]);
    };

    return (
        <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Дополнительные поля</label>
            {extra.map(({ id, key, value }) => (
                <div key={id} className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={key}
                        onChange={(e) => handleChange(id, { key: e.target.value })}
                        className="w-1/3 p-2 border rounded"
                        placeholder="Поле"
                    />
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleChange(id, { value: e.target.value })}
                        className="w-2/3 p-2 border rounded"
                        placeholder="Значение"
                    />
                    <button
                        type="button"
                        onClick={() => handleDelete(id)}
                        className="text-red-500 hover:text-red-700"
                    >
                        ✖
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={handleAdd}
                className="text-indigo-600 hover:underline mt-2"
            >
                ➕ Добавить поле
            </button>
        </div>
    );
};