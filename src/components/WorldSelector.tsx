import { useWorldStore } from '../store/useWorldStore';
import { useWorldSelectionStore } from '../store/useWorldSelectionStore';
import { Select } from './Select';
import { Globe } from 'lucide-react';

export const WorldSelector = () => {
    const { worlds, invitedWorlds } = useWorldStore();
    const { selectedWorldId, setSelectedWorldId } = useWorldSelectionStore();
    const mergedWorlds = [...worlds, ...invitedWorlds.filter((invited) => !worlds.some((world) => world.id === invited.id))];
    if (mergedWorlds.length === 0) return null;
    const invitedIds = new Set(invitedWorlds.map((world) => world.id));
    const options = mergedWorlds.map((world) => ({
        value: world.id,
        label: invitedIds.has(world.id) ? `${world.name} (приглашение)` : world.name,
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
