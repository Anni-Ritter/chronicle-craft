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
import { CharacterEditPage } from './pages/Characters/CharacterEditPage';
import { ChronicleDetailPage } from './pages/Chronicle/ChronicleDetailPage';
import { MapListPage } from './pages/Map/MapListPage';
import { WorldMapPage } from './pages/Map/WorldMapPage';

export const AppRouter = () => {
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

    return (
        <Routes>
            <Route path="/" element={session ? <CharactersPage /> : <PublicPage />} />
            <Route path="/character/:id" element={<CharacterDetailPage />} />
            <Route path="/character/edit/:id" element={<CharacterEditPage />} />
            <Route
                path="/graph"
                element={
                    session ? (
                        <CharacterGraph
                            characters={characters}
                            relationships={relationships}
                            onSelectCharacter={(id) => navigate(`/character/${id}`)}
                        />
                    ) : (
                        <PublicPage />
                    )
                }
            />
            <Route path="/chronicles" element={<ChroniclesPage />} />
            <Route path="/chronicles/:id" element={<ChronicleDetailPage />} />
            <Route path="/maps" element={<MapListPage />} />
            <Route path="/maps/:mapId" element={<WorldMapPage />} />
        </Routes>
    );
};
