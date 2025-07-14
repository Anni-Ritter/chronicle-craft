import React, { useState } from 'react';
import type { Character } from '../types/character';
import { Modal } from './Modal';
import { Combobox } from '@headlessui/react';

interface Props {
    isOpen: boolean;
    characters: Character[];
    onClose: () => void;
    onCreate: (data: {
        sourceId: string;
        targetId: string;
        label: string;
        color: string;
    }) => void;
}

export const ManualRelationModal: React.FC<Props> = ({
    isOpen,
    characters,
    onClose,
    onCreate,
}) => {
    const [sourceId, setSourceId] = useState('');
    const [targetId, setTargetId] = useState('');
    const [label, setLabel] = useState('');
    const [color, setColor] = useState('#4ade80');

    const handleSubmit = () => {
        if (!sourceId || !targetId || !label) return;
        onCreate({ sourceId, targetId, label, color });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-[#0e1b12] border border-[#c2a774] text-[#e5d9a5] font-lora rounded-3xl shadow-lg w-full max-w-xl mx-auto p-6 space-y-6">
                <h3 className="text-xl text-center font-semibold tracking-wide mb-4">
                    🌿 Создание связи
                </h3>

                <div className="space-y-5">
                    <CharacterSelect
                        label="Персонаж A"
                        selectedId={sourceId}
                        onChange={setSourceId}
                        characters={characters}
                    />

                    <CharacterSelect
                        label="Персонаж B"
                        selectedId={targetId}
                        onChange={setTargetId}
                        characters={characters}
                    />

                    <div>
                        <label className="block mb-1 text-sm font-medium">Название связи</label>
                        <input
                            className="w-full bg-[#223120] text-[#f5e9c6] border border-[#c2a774] rounded-xl px-4 py-2 placeholder-[#b4b48a] focus:outline-none focus:ring focus:ring-[#c2a774]"
                            placeholder="Например, враг"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium">Цвет связи</label>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-12 h-12 border border-[#c2a774] rounded-xl bg-transparent cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button
                        onClick={onClose}
                        className="text-sm text-[#b4b48a] hover:underline transition"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="bg-[#c2a774] hover:bg-[#e5d9a5] text-[#2D422B] font-medium px-5 py-2 rounded-xl shadow transition"
                    >
                        Создать связь
                    </button>
                </div>
            </div>
        </Modal>
    );
};

function CharacterSelect({
    label,
    selectedId,
    onChange,
    characters,
}: {
    label: string;
    selectedId: string;
    onChange: (id: string) => void;
    characters: Character[];
}) {
    const selected = characters.find((c) => c.id === selectedId);
    const [query, setQuery] = useState('');

    const filtered =
        query === ''
            ? characters
            : characters.filter((c) =>
                c.name.toLowerCase().includes(query.toLowerCase())
            );

    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium">{label}</label>
            <Combobox value={selected} onChange={(char: Character) => onChange(char.id)}>
                <div className="relative">
                    <div className="relative w-full">
                        <Combobox.Input
                            className="w-full rounded-xl bg-[#223120] text-[#f5e9c6] placeholder-[#b4b48a] border border-[#c2a774] px-4 py-2 focus:outline-none"
                            displayValue={(char: Character) => char?.name}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Начните вводить имя..."
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#c2a774]">
                            ▾
                        </Combobox.Button>
                    </div>
                    {filtered.length > 0 && (
                        <Combobox.Options className="absolute no-scrollbar z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#1c2916] border  border-[#c2a774] shadow-lg text-[#f5e9c6] ">
                            {filtered.map((char) => (
                                <Combobox.Option
                                    key={char.id}
                                    value={char}
                                    className={({ active }) =>
                                        `cursor-pointer select-none px-4 py-2 ${active ? 'bg-[#c2a774] text-[#1c2916]' : ''
                                        }`
                                    }
                                >
                                    {char.name}
                                </Combobox.Option>
                            ))}
                        </Combobox.Options>
                    )}
                </div>
            </Combobox>
        </div>
    );
}