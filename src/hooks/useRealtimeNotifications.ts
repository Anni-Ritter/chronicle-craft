import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

export const getNotificationPermissionState = (): NotificationPermission | 'unsupported' => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    try {
        const result = await Notification.requestPermission();
        return result;
    } catch {
        return Notification.permission;
    }
};

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
    const [activeUserId, setActiveUserId] = useState<string | null>(userId ?? null);

    useEffect(() => {
        if (userId) {
            setActiveUserId(userId);
            return;
        }

        let cancelled = false;
        const resolveUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (cancelled) return;
            const fallbackUserId = data.user?.id ?? null;
            setActiveUserId(fallbackUserId);
        };
        void resolveUser();

        return () => {
            cancelled = true;
        };
    }, [userId, supabase]);

    useEffect(() => {
        if (!activeUserId || typeof window === 'undefined' || !('Notification' in window)) return;

        if (Notification.permission === 'default' && !enabledRef.current) {
            enabledRef.current = true;
            void Notification.requestPermission();
        }
    }, [activeUserId]);

    useEffect(() => {
        if (!activeUserId) return;

        const worldInvitesChannel = supabase
            .channel(`notify-world-invites-${activeUserId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'world_members',
                    filter: `user_id=eq.${activeUserId}`,
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
            .channel(`notify-roleplay-invites-${activeUserId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'roleplay_space_members',
                    filter: `user_id=eq.${activeUserId}`,
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
            .channel(`notify-scene-messages-${activeUserId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'scene_messages',
                },
                async (payload) => {
                    const row = payload.new as { user_id?: string } | null;
                    if (!row?.user_id || row.user_id === activeUserId) return;
                    await showNotification('Новое сообщение в сцене', 'В одной из ваших сцен появилось новое сообщение.');
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(worldInvitesChannel);
            supabase.removeChannel(roleplayInvitesChannel);
            supabase.removeChannel(sceneMessagesChannel);
        };
    }, [activeUserId, userId, supabase]);

    useEffect(() => {
        if (!activeUserId) return;

        let cancelled = false;
        let prevWorldInviteCount: number | null = null;
        let prevRoleplayInviteCount: number | null = null;
        let prevSceneMessageCount: number | null = null;

        const runPoll = async () => {
            if (cancelled) return;

            const [worldRes, roleplayRes, sceneRes] = await Promise.all([
                supabase
                    .from('world_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', activeUserId)
                    .eq('status', 'invited'),
                supabase
                    .from('roleplay_space_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', activeUserId)
                    .eq('status', 'invited'),
                supabase
                    .from('scene_messages')
                    .select('*', { count: 'exact', head: true })
                    .neq('user_id', activeUserId),
            ]);

            if (worldRes.error || roleplayRes.error || sceneRes.error) {
                return;
            }

            const worldCount = worldRes.count ?? 0;
            const roleplayCount = roleplayRes.count ?? 0;
            const sceneCount = sceneRes.count ?? 0;

            if (prevWorldInviteCount !== null && worldCount > prevWorldInviteCount) {
                await showNotification('Новое приглашение в мир', 'Вас пригласили в совместный мир.');
            }
            if (prevRoleplayInviteCount !== null && roleplayCount > prevRoleplayInviteCount) {
                await showNotification(
                    'Приглашение в ролевое пространство',
                    'Вас пригласили в новое пространство.'
                );
            }
            if (prevSceneMessageCount !== null && sceneCount > prevSceneMessageCount) {
                await showNotification(
                    'Новое сообщение в сцене',
                    'В одной из ваших сцен появилось новое сообщение.'
                );
            }

            prevWorldInviteCount = worldCount;
            prevRoleplayInviteCount = roleplayCount;
            prevSceneMessageCount = sceneCount;
        };

        void runPoll();
        const interval = window.setInterval(() => {
            void runPoll();
        }, 15000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [activeUserId, supabase]);
};

