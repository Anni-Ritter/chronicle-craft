import { useEffect, useRef } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

const showNotification = async (title: string, body: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.showNotification(title, {
                    body,
                    icon: '/web-app-manifest-192x192.png',
                    badge: '/web-app-manifest-192x192.png',
                    tag: `cc-${Date.now()}`,
                });
                return;
            }
        }
        new Notification(title, {
            body,
            icon: '/web-app-manifest-192x192.png',
        });
    } catch {
        // silently ignore notification runtime issues
    }
};

export const useRealtimeNotifications = (
    userId: string | null | undefined,
    supabase: SupabaseClient
) => {
    const enabledRef = useRef(false);

    useEffect(() => {
        if (!userId || typeof window === 'undefined' || !('Notification' in window)) return;

        if (Notification.permission === 'default' && !enabledRef.current) {
            enabledRef.current = true;
            void Notification.requestPermission();
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        const worldInvitesChannel = supabase
            .channel(`notify-world-invites-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'world_members',
                    filter: `user_id=eq.${userId}`,
                },
                async (payload) => {
                    const row = payload.new as { status?: string } | null;
                    if (row?.status === 'invited') {
                        await showNotification('Новое приглашение в мир', 'Вас пригласили в совместный мир.');
                    }
                }
            )
            .subscribe();

        const roleplayInvitesChannel = supabase
            .channel(`notify-roleplay-invites-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'roleplay_space_members',
                    filter: `user_id=eq.${userId}`,
                },
                async (payload) => {
                    const row = payload.new as { status?: string } | null;
                    if (row?.status === 'invited') {
                        await showNotification('Приглашение в ролевое пространство', 'Вас пригласили в новое пространство.');
                    }
                }
            )
            .subscribe();

        const sceneMessagesChannel = supabase
            .channel(`notify-scene-messages-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'scene_messages',
                },
                async (payload) => {
                    const row = payload.new as { user_id?: string } | null;
                    if (!row?.user_id || row.user_id === userId) return;
                    await showNotification('Новое сообщение в сцене', 'В одной из ваших сцен появилось новое сообщение.');
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(worldInvitesChannel);
            supabase.removeChannel(roleplayInvitesChannel);
            supabase.removeChannel(sceneMessagesChannel);
        };
    }, [userId, supabase]);
};

