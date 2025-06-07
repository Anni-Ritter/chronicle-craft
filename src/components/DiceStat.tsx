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
        <div>
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <div
                className={`w-full p-2 border rounded mt-1 text-center font-bold text-lg transition-transform duration-200 ${shake ? 'animate-pulse scale-110 bg-yellow-100' : ''
                    }`}
            >
                {value}
            </div>
        </div>
    );
};
