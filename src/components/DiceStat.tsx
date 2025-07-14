import { useEffect, useState } from 'react';

interface DiceStatProps {
    label: string;
    value: number;
}

export const DiceStat: React.FC<DiceStatProps> = ({ label, value }) => {
    const [shake, setShake] = useState(false);

    useEffect(() => {
        setShake(true);
        const timeout = setTimeout(() => setShake(false), 200);
        return () => clearTimeout(timeout);
    }, [value]);

    return (
        <div className="flex flex-col items-center gap-1 font-lora">
            <span className="text-[#D6C5A2]">{label}</span>
            <div
                className={`w-20 h-20 flex items-center justify-center border-2 border-[#C2A774] rounded-full text-[#D6C5A2] bg-[#0e1b12] text-xl font-bold transition-transform duration-200 ${shake ? 'scale-110 animate-pulse bg-[#C2A774] text-[#0E1B12]' : ''
                    }`}
            >
                {value}
            </div>
        </div>
    );
};
