import { useEffect, useState } from 'react';

interface DiceStatProps {
    label: string;
    value: number;
}

export const DiceStat = ({ label, value }: DiceStatProps) => {
    const [isRolling, setIsRolling] = useState(false);

    useEffect(() => {
        if (value == null) return;

        setIsRolling(true);
        const timeout = setTimeout(() => setIsRolling(false), 450);

        return () => clearTimeout(timeout);
    }, [value]);

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
        </div>
    );
};
