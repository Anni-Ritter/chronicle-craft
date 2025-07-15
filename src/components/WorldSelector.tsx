import { useWorldStore } from '../store/useWorldStore';
import { useWorldSelectionStore } from '../store/useWorldSelectionStore';
import { Select } from './Select';

export const WorldSelector = () => {
    const { worlds } = useWorldStore();
    const { selectedWorldId, setSelectedWorldId } = useWorldSelectionStore();
    if (worlds.length === 0) return null;
    const options = worlds.map((world) => ({
        value: world.id,
        label: world.name,
    }));
    return (
        <div>
            <Select
                value={selectedWorldId}
                options={options}
                onChange={setSelectedWorldId}
                placeholder="Все миры"
            />
        </div>
    );
};
