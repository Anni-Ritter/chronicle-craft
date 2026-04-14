import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { useSession, useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Session } from '@supabase/supabase-js';
import { useCharacterStore } from './store/useCharacterStore';
import { useRelationshipStore } from './store/useRelationshipStore';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

import { useEffect, useState } from 'react';
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
    useSessionContext();
    const [resolvedSession, setResolvedSession] = useState<Session | null>(null);
    const [authBootstrapped, setAuthBootstrapped] = useState(false);
    const supabase = useSupabaseClient();
    const navigate = useNavigate();
    const location = useLocation();
    const characters = useCharacterStore((s) => s.characters);
    const fetchCharacters = useCharacterStore((s) => s.fetchCharacters);
    const relationships = useRelationshipStore((s) => s.relationships);
    const fetchRelationships = useRelationshipStore((s) => s.fetchRelationships);

    const effectiveSession = session ?? resolvedSession;

    useEffect(() => {
        let cancelled = false;
        const fallback = window.setTimeout(() => {
            if (!cancelled) setAuthBootstrapped(true);
        }, 3000);

        void supabase.auth.getSession().then(({ data }) => {
            if (cancelled) return;
            setResolvedSession(data.session ?? null);
            setAuthBootstrapped(true);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setResolvedSession(nextSession);
            setAuthBootstrapped(true);
        });

        return () => {
            cancelled = true;
            window.clearTimeout(fallback);
            subscription.unsubscribe();
        };
    }, [supabase]);

    const uid = effectiveSession?.user?.id;

    useEffect(() => {
        if (!uid) return;
        void fetchCharacters(uid, supabase);
        void fetchRelationships(supabase);
    }, [uid, fetchCharacters, fetchRelationships, supabase]);

    if (!authBootstrapped) {
        const outerFireflies = Array.from({ length: 12 });
        const innerFireflies = Array.from({ length: 8 });

        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="relative h-32 w-32">
                    <div className="absolute inset-0 rounded-full border border-[#3a4a34]/40" />
                    {outerFireflies.map((_, i) => (
                        <div
                            key={`outer-${i}`}
                            className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2"
                        >
                            <div
                                className="relative h-full w-full animate-[spin_4.8s_linear_infinite]"
                                style={{ animationDelay: `${(i * -4.8) / outerFireflies.length}s` }}
                            >
                                <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-[#f7efcf] shadow-[0_0_12px_#f7efcf]" />
                            </div>
                        </div>
                    ))}
                    {innerFireflies.map((_, i) => (
                        <div
                            key={`inner-${i}`}
                            className="absolute left-1/2 top-1/2 h-[5.6rem] w-[5.6rem] -translate-x-1/2 -translate-y-1/2"
                        >
                            <div
                                className="relative h-full w-full animate-[spin_3.6s_linear_infinite]"
                                style={{ animationDelay: `${(i * -3.6) / innerFireflies.length}s` }}
                            >
                                <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#c2a774] shadow-[0_0_10px_#c2a774]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!effectiveSession) {
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
