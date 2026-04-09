import { useWorldStore } from '../store/useWorldStore';
import { useWorldSelectionStore } from '../store/useWorldSelectionStore';
import { Select } from './Select';
import { Globe } from 'lucide-react';

export const WorldSelector = () => {
    const { worlds } = useWorldStore();
    const { selectedWorldId, setSelectedWorldId } = useWorldSelectionStore();
    if (worlds.length === 0) return null;
    const options = worlds.map((world) => ({
        value: world.id,
        label: world.name,
    }));
    return (
        <div className="w-full">
            <Select
                value={selectedWorldId}
                options={options}
                onChange={setSelectedWorldId}
                placeholder="Все миры"
                icon={<Globe className="h-[18px] w-[18px] text-[#c2a774]" aria-hidden />}
            />
        </div>
    );
};
