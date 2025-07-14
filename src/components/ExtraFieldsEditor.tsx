import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ExtraField } from '../types/character';
import { CirclePlus, ScrollText, Trash2 } from 'lucide-react';
import { Button } from './ChronicleButton';
import { FloatingInput } from './FloatingInput';

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
        <section className="bg-[#223120] rounded-2xl px-2 py-5 md:p-4 border border-[#c2a774] mt-6 shadow-md">
            <label className=" text-[#e5d9a5] font-lora mb-4 flex items-center gap-2">
                <ScrollText size={20} /> Дополнительные сведения
            </label>

            <div className="space-y-3">
                {extra.map(({ id, key, value }) => (
                    <div
                        key={id}
                        className="flex gap-3 items-center bg-[#1a261a] p-3 rounded-xl border border-[#3a4c3a] shadow-sm"
                    >
                        <div className='flex gap-3 max-sm:flex-col w-full'>
                            <FloatingInput
                                value={key}
                                onChange={(e) => handleChange(id, { key: e.target.value })}
                                label="Название"
                            />
                            <FloatingInput
                                value={value}
                                onChange={(e) => handleChange(id, { value: e.target.value })}
                                label="Значение"
                            />
                        </div>
                        <Button variant="danger" icon={<Trash2 size={20} />} onClick={() => handleDelete(id)}></Button>
                    </div>
                ))}
            </div>

            <div className="mt-5">
                <Button
                    variant='outline'
                    type="button"
                    onClick={handleAdd}
                    icon={<CirclePlus size={18} />}
                    className='max-sm:gap-0 text-sm'
                >
                    Добавить поле
                </Button>
            </div>
        </section>
    );
};