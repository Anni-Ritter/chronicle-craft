import { v4 as uuidv4 } from "uuid";
import type { ExtraField } from "../types/character";
import { CirclePlus, ScrollText, Trash2 } from "lucide-react";
import { Button } from "./ChronicleButton";
import { FloatingInput } from "./FloatingInput";

interface ExtraFieldsEditorProps {
    extra: ExtraField[];
    onChange: (updated: ExtraField[]) => void;
}

export const ExtraFieldsEditor = ({ extra, onChange }: ExtraFieldsEditorProps) => {
    const handleChange = (
        id: string,
        field: Partial<Pick<ExtraField, "key" | "value">>
    ) => {
        onChange(extra.map((e) => (e.id === id ? { ...e, ...field } : e)));
    };

    const handleDelete = (id: string) => {
        onChange(extra.filter((e) => e.id !== id));
    };

    const handleAdd = () => {
        onChange([...extra, { id: uuidv4(), key: "", value: "" }]);
    };

    const hasFields = extra.length > 0;

    return (
        <section className="bg-[#141f16]/90 rounded-2xl border border-[#3a4a34] mt-6 shadow-[0_0_25px_#00000066] px-3 py-5 md:px-5 md:py-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-2">
                        <ScrollText size={20} className="text-[#c2a774]" />
                        <span className="text-[#e5d9a5] font-garamond text-lg">
                            Дополнительные сведения
                        </span>
                    </div>
                    <span className="text-[11px] md:text-xs text-[#c7bc98]">
                        Для заметок, рангов, особенностей, привычек, слабостей — всего,
                        что не поместилось в основные поля.
                    </span>
                </div>

                <Button
                    variant="outline"
                    type="button"
                    onClick={handleAdd}
                    icon={<CirclePlus size={18} />}
                    className="max-sm:w-full text-sm"
                >
                    Добавить
                </Button>
            </div>

            {!hasFields ? (
                <div className="mt-2 rounded-xl border border-dashed border-[#3a4a34] bg-[#0b1510]/60 px-4 py-4 text-sm text-[#c7bc98]">
                    Пока здесь пусто. Добавьте первое поле - например:
                    <span className="text-[#e5d9a5]"> «Страхи», «Особые черты», «Триггеры»</span>.
                </div>
            ) : (
                <div className="space-y-3 mt-2">
                    {extra.map(({ id, key, value }, index) => (
                        <div
                            key={id}
                            className="bg-[#101712] px-3 py-3 md:px-4 md:py-4 rounded-2xl border border-[#3a4a34] shadow-sm space-y-3"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] uppercase tracking-[0.14em] text-[#8a9a82]">
                                    Поле {index + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(id)}
                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[#c7bc98] border border-[#3a4a34] hover:border-[#d76f6f88] hover:text-[#ffb2b2] transition"
                                    title="Удалить поле"
                                >
                                    <Trash2 size={14} />
                                    <span className="max-sm:hidden">Удалить</span>
                                </button>
                            </div>

                            <div className="flex flex-1 gap-3 max-sm:flex-col">
                                <div className="flex-1">
                                    <FloatingInput
                                        value={key}
                                        onChange={(e) =>
                                            handleChange(id, { key: e.target.value })
                                        }
                                        label="Название"
                                    />
                                </div>
                                <div className="flex-[1.4]">
                                    <FloatingInput
                                        value={value}
                                        onChange={(e) =>
                                            handleChange(id, { value: e.target.value })
                                        }
                                        label="Значение"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};
