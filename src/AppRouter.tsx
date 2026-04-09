import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useCharacterStore } from './store/useCharacterStore';
import { useRelationshipStore } from './store/useRelationshipStore';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

import { useEffect } from 'react';
import { CharactersPage } from './pages/Characters/Characters';
import { PublicPage } from './pages/PublicPage';
import { CharacterGraph } from './features/relations/CharacterGraph';
import { ChroniclesPage } from './pages/Chronicle/ChroniclesPage';
import { CharacterDetailPage } from './pages/Characters/CharacterDetailPage';
import { ChronicleDetailPage } from './pages/Chronicle/ChronicleDetailPage';
import { MapListPage } from './pages/Map/MapListPage';
import { WorldMapPage } from './pages/Map/WorldMapPage';
import { ProfilePage } from './pages/ProfilePage';
import { PlayerCharactersPage } from './pages/PlayerCharactersPage';
import { WorldsPage } from './pages/World/WorldsPage';
import { WorldDetailsPage } from './pages/World/WorldDetailsPage';
import { RoleplaySpacesPage } from './pages/Roleplay/RoleplaySpacesPage';
import { RoleplaySpacePage } from './pages/Roleplay/RoleplaySpacePage';
import { RoleplayScenePage } from './pages/Roleplay/RoleplayScenePage';

interface AppRouterProps {
    onLoginClick: () => void;
}

const LegacyUserProfileRedirect = () => {
    const { userId } = useParams<{ userId: string }>();
    if (!userId) return <Navigate to="/" replace />;
    return <Navigate to={`/player/${userId}/characters`} replace />;
};

const pageVariants: Variants = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.28 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.18 } },
};

export const AppRouter: React.FC<AppRouterProps> = ({ onLoginClick }) => {
    const session = useSession();
    const supabase = useSupabaseClient();
    const navigate = useNavigate();
    const location = useLocation();
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
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={location.key}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
            >
                <Routes location={location}>
                    <Route path="/" element={<CharactersPage />} />
                    <Route path="/characters" element={<CharactersPage />} />
                    <Route path="/character/:id" element={<CharacterDetailPage />} />
                    <Route
                        path="/graph"
                        element={
                            <CharacterGraph
                                characters={characters}
                                relationships={relationships}
                                allCharacters={characters}
                                onSelectCharacter={(id) => navigate(`/character/${id}`)}
                            />
                        }
                    />
                    <Route path="/chronicles" element={<ChroniclesPage />} />
                    <Route path="/chronicles/:id" element={<ChronicleDetailPage />} />
                    <Route path="/maps" element={<MapListPage />} />
                    <Route path="/maps/:mapId" element={<WorldMapPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/user/:userId" element={<LegacyUserProfileRedirect />} />
                    <Route path="/player/:userId/characters" element={<PlayerCharactersPage />} />
                    <Route path="/worlds" element={<WorldsPage />} />
                    <Route path="/worlds/:id" element={<WorldDetailsPage />} />
                    <Route path="/roleplay" element={<RoleplaySpacesPage />} />
                    <Route path="/roleplay/:spaceId" element={<RoleplaySpacePage />} />
                    <Route path="/roleplay/:spaceId/scenes/:sceneId" element={<RoleplayScenePage />} />
                </Routes>
            </motion.div>
        </AnimatePresence>
    );
};
