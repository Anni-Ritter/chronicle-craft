import { Routes, Route, useNavigate } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useCharacterStore } from './store/useCharacterStore';
import { useRelationshipStore } from './store/useRelationshipStore';
import { useEffect } from 'react';
import CharactersPage from './pages/Characters/Characters';
import { PublicPage } from './pages/PublicPage';
import { CharacterGraph } from './features/relations/CharacterGraph';
import { ChroniclesPage } from './pages/Chronicle/ChroniclesPage';
import { CharacterDetailPage } from './pages/Characters/CharacterDetailPage';
import { ChronicleDetailPage } from './pages/Chronicle/ChronicleDetailPage';
import { MapListPage } from './pages/Map/MapListPage';
import { WorldMapPage } from './pages/Map/WorldMapPage';
import { ProfilePage } from './pages/ProfilePage';

interface AppRouterProps {
    onLoginClick: () => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({ onLoginClick }) => {
    const session = useSession();
    const supabase = useSupabaseClient();
    const navigate = useNavigate();
    const characters = useCharacterStore((s) => s.characters);
    const relationships = useRelationshipStore((s) => s.relationships);
    const characterStore = useCharacterStore();
    const relationshipStore = useRelationshipStore();

    useEffect(() => {
        const uid = session?.user?.id;
        if (!uid) return;

        characterStore.fetchCharacters(uid, supabase);
        relationshipStore.fetchRelationships(supabase);
    }, [session]);


    if (!session) {
        return (
            <Routes>
                <Route path="*" element={<PublicPage onLoginClick={onLoginClick} />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<CharactersPage />} />
            <Route path="/characters" element={<CharactersPage />} />
            <Route path="/character/:id" element={<CharacterDetailPage />} />
            <Route
                path="/graph"
                element={
                    <CharacterGraph
                        characters={characters}
                        relationships={relationships}
                        onSelectCharacter={(id) => navigate(`/character/${id}`)}
                    />
                }
            />
            <Route path="/chronicles" element={<ChroniclesPage />} />
            <Route path="/chronicles/:id" element={<ChronicleDetailPage />} />
            <Route path="/maps" element={<MapListPage />} />
            <Route path="/maps/:mapId" element={<WorldMapPage />} />
            <Route path="/profile" element={<ProfilePage />} />
        </Routes>
    );
};
