import { useEffect, useState } from 'react';

interface DiceStatProps {
    label: string;
    value: number;
    /** Ручной ввод числа (например, в форме персонажа) */
    editable?: boolean;
    onChange?: (next: number) => void;
    min?: number;
    max?: number;
    /** Стабильный id для поля ввода (a11y) */
    inputId?: string;
}

export const DiceStat = ({
    label,
    value,
    editable = false,
    onChange,
    min = 0,
    max = 12,
    inputId,
}: DiceStatProps) => {
    const [isRolling, setIsRolling] = useState(false);

    useEffect(() => {
        if (value == null) return;

        setIsRolling(true);
        const timeout = setTimeout(() => setIsRolling(false), 450);

        return () => clearTimeout(timeout);
    }, [value]);

    const clamp = (n: number) => Math.min(max, Math.max(min, n));
    const fieldId = inputId ?? `attr-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div className="flex flex-col items-center gap-2 font-lora">
            <span className="text-[11px] md:text-xs uppercase tracking-[0.18em] text-[#c7bc98]">
                {label}
            </span>

            <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#c2a77422] blur-md pointer-events-none" />

                <div
                    className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full 
                        bg-gradient-to-br from-[#c2a77433] via-[#223120] to-[#0b1510]
                        border border-[#c2a774aa]
                        shadow-[0_0_18px_rgba(0,0,0,0.7)]
                        flex items-center justify-center
                        transition-transform duration-300
                        ${isRolling ? 'animate-[dice-roll_0.45s_ease-out]' : 'hover:scale-105'}
                    `}
                >
                    <span className="text-xl md:text-2xl font-semibold text-[#f4ecd0] drop-shadow-[0_0_4px_#000]">
                        {value}
                    </span>

                    <span className="pointer-events-none absolute inset-1 rounded-full border border-[#f9f5dd22]" />
                </div>
            </div>

            {editable && onChange ? (
                <div className="flex w-full max-w-[6.5rem] flex-col items-center gap-0.5">
                    <label className="sr-only" htmlFor={fieldId}>
                        {label}, значение
                    </label>
                    <input
                        id={fieldId}
                        type="number"
                        inputMode="numeric"
                        min={min}
                        max={max}
                        step={1}
                        value={Number.isFinite(value) ? value : 0}
                        onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') return;
                            const n = Number(raw);
                            if (Number.isNaN(n)) return;
                            onChange(clamp(Math.round(n)));
                        }}
                        onBlur={(e) => {
                            const raw = e.target.value;
                            if (raw === '') onChange(min);
                            else {
                                const n = Number(raw);
                                if (Number.isNaN(n)) onChange(min);
                                else onChange(clamp(Math.round(n)));
                            }
                        }}
                        className="w-full rounded-lg border border-[#3a4a34] bg-[#0b1510] px-2 py-1.5 text-center text-sm text-[#f4ecd0] [appearance:textfield] focus:border-[#c2a774aa] focus:outline-none focus:ring-2 focus:ring-[#c2a77433] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-[10px] text-[#c7bc98]/80">
                        {min}–{max}
                    </span>
                </div>
            ) : null}
        </div>
    );
};
