import { useState } from 'react';
import type { Character } from '../types/character';
import { Modal } from './Modal';
import { Combobox } from '@headlessui/react';
import { HeartHandshake, Sparkles } from 'lucide-react';
import { Button } from './ChronicleButton';

interface ManualRelationModalProps {
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

export const ManualRelationModal = ({
    isOpen,
    characters,
    onClose,
    onCreate,
}: ManualRelationModalProps) => {
    const [sourceId, setSourceId] = useState('');
    const [targetId, setTargetId] = useState('');
    const [label, setLabel] = useState('');
    const [color, setColor] = useState('#4ade80');

    const handleSubmit = () => {
        if (!sourceId || !targetId || !label.trim()) return;
        onCreate({ sourceId, targetId, label: label.trim(), color });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="relative w-full max-w-xl mx-auto bg-[#111712] text-[#e5d9a5] border border-[#c2a77488] rounded-2xl p-6 shadow-[0_0_30px_#000]">
                <div className="pointer-events-none absolute -top-24 -right-10 w-40 h-40 rounded-full bg-[#c2a77433] blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-20 w-52 h-52 rounded-full bg-[#4ade8030] blur-3xl" />

                <div className="relative space-y-5">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3a4a34] bg-[#101712]/80 text-[11px] uppercase tracking-[0.18em] text-[#c7bc98]">
                            <Sparkles size={14} className="text-[#c2a774]" />
                            <span>ручное создание связи</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-garamond font-bold tracking-wide flex items-center justify-center gap-2">
                            <HeartHandshake size={20} className="text-[#c2a774]" />
                            Соединить персонажей
                        </h3>
                        <p className="text-xs sm:text-sm text-[#c7bc98]">
                            Выберите двух персонажей, задайте тип связи и её цвет — граф обновится магически.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
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
                    </div>

                    <div className="space-y-2 mt-2">
                        <label className="block text-sm sm:text-base font-medium text-[#f5e9c6]">
                            Название связи
                        </label>
                        <input
                            className="w-full bg-[#0b1510] text-[#f5e9c6] border border-[#3a4a34] rounded-2xl px-4 py-2.5 placeholder:text-[#c7bc98]/70 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#c2a77455] focus:border-[#c2a774aa] transition"
                            placeholder="Например: наставник, соперник, союзник…"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3 mt-1">
                        <label className="block text-sm sm:text-base font-medium text-[#f5e9c6]">
                            Цвет связи на графе
                        </label>
                        <div className="flex items-center gap-4 flex-wrap">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-11 h-11 sm:w-12 sm:h-12 border border-[#c2a77488] rounded-xl bg-transparent cursor-pointer shadow-[0_0_12px_#000]"
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
                                onClick={handleSubmit}
                                className="flex-1 bg-gradient-to-r from-[#c2a774] to-[#e5d9a5] text-[#1f2b1f] hover:from-[#e5d9a5] hover:to-[#fffbe6] border border-[#c2a774] shadow-[0_0_18px_#c2a77466] rounded-2xl py-2.5 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Создать связь
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
    const selected = characters.find((c) => c.id === selectedId) || null;
    const [query, setQuery] = useState('');

    const filtered =
        query.trim() === ''
            ? characters
            : characters.filter((c) =>
                c.name.toLowerCase().includes(query.toLowerCase())
            );

    return (
        <div className="space-y-2">
            <label className="block text-sm sm:text-base font-medium text-[#f5e9c6]">
                {label}
            </label>
            <Combobox value={selected} onChange={(char: Character) => onChange(char.id)}>
                <div className="relative">
                    <div className="relative w-full">
                        <Combobox.Input
                            className="w-full rounded-2xl bg-[#0b1510] text-[#f5e9c6] placeholder:text-[#c7bc98]/70 border border-[#3a4a34] px-4 py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#c2a77455] focus:border-[#c2a774aa]"
                            displayValue={(char: Character) => char?.name || ''}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Начните вводить имя…"
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#c2a774]">
                            ▾
                        </Combobox.Button>
                    </div>
                    {filtered.length > 0 && (
                        <Combobox.Options className="absolute no-scrollbar z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-[#050806]/95 border border-[#3a4a34] shadow-[0_0_20px_#000] text-[#f5e9c6] text-sm">
                            {filtered.map((char) => (
                                <Combobox.Option
                                    key={char.id}
                                    value={char}
                                    className={({ active }) =>
                                        `cursor-pointer select-none px-4 py-2.5 flex items-center gap-3 ${active
                                            ? 'bg-[#c2a774] text-[#1f2b1f]'
                                            : 'bg-transparent'
                                        }`
                                    }
                                >
                                    {char.avatar && (
                                        <img
                                            src={char.avatar}
                                            alt={char.name}
                                            className="w-7 h-7 rounded-full object-cover border border-[#c2a77455]"
                                        />
                                    )}
                                    <span className="truncate">{char.name}</span>
                                </Combobox.Option>
                            ))}
                        </Combobox.Options>
                    )}
                </div>
            </Combobox>
        </div>
    );
}
