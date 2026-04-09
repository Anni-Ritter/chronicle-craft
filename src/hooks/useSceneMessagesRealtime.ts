import { useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRoleplayStore } from '../store/useRoleplayStore';

export const useSceneMessagesRealtime = (
    sceneId: string | null,
    onRefresh?: () => void
) => {
    const supabase = useSupabaseClient();
    const subscribeToSceneMessages = useRoleplayStore((s) => s.subscribeToSceneMessages);

    useEffect(() => {
        if (!sceneId) return;
        const unsubscribe = subscribeToSceneMessages(sceneId, supabase, () => {
            onRefresh?.();
        });
        return unsubscribe;
    }, [sceneId, supabase, subscribeToSceneMessages, onRefresh]);
};
