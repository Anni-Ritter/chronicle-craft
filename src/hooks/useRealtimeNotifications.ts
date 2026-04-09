import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

const NOTIFICATIONS_STORAGE_KEY = 'cc:notifications:feed';
const NOTIFICATIONS_EVENT_NAME = 'cc:notifications:feed:updated';
const FEED_LIMIT = 30;

export type NotificationFeedType = 'world_invite' | 'roleplay_invite' | 'scene_message';

export type NotificationFeedItem = {
    id: string;
    type: NotificationFeedType;
    title: string;
    body: string;
    createdAt: string;
};

const readNotificationFeed = (): NotificationFeedItem[] => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as NotificationFeedItem[];
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch {
        return [];
    }
};

const writeNotificationFeed = (items: NotificationFeedItem[]) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT_NAME, { detail: items }));
};

const addToNotificationFeed = (item: Omit<NotificationFeedItem, 'id' | 'createdAt'>) => {
    const nowIso = new Date().toISOString();
    const feed = readNotificationFeed();
    const last = feed[0];
    // Protect from realtime+poll duplicate notifications in a short window.
    const isDuplicate =
        last &&
        last.type === item.type &&
        last.title === item.title &&
        last.body === item.body &&
        Date.now() - new Date(last.createdAt).getTime() < 15000;
    if (isDuplicate) return;

    const next: NotificationFeedItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: nowIso,
        ...item,
    };
    writeNotificationFeed([next, ...feed].slice(0, FEED_LIMIT));
};

export const getNotificationFeed = (): NotificationFeedItem[] => readNotificationFeed();

export const clearNotificationFeed = () => {
    writeNotificationFeed([]);
};

export const subscribeNotificationFeed = (listener: (items: NotificationFeedItem[]) => void) => {
    if (typeof window === 'undefined') return () => undefined;
    const handler = (event: Event) => {
        const customEvent = event as CustomEvent<NotificationFeedItem[]>;
        listener(customEvent.detail ?? []);
    };
    window.addEventListener(NOTIFICATIONS_EVENT_NAME, handler);
    return () => window.removeEventListener(NOTIFICATIONS_EVENT_NAME, handler);
};

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
                        addToNotificationFeed({
                            type: 'world_invite',
                            title: 'Новое приглашение в мир',
                            body: 'Вас пригласили в совместный мир.',
                        });
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
                        addToNotificationFeed({
                            type: 'roleplay_invite',
                            title: 'Приглашение в ролевое пространство',
                            body: 'Вас пригласили в новое пространство.',
                        });
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
                    addToNotificationFeed({
                        type: 'scene_message',
                        title: 'Новое сообщение в сцене',
                        body: 'В одной из ваших сцен появилось новое сообщение.',
                    });
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
                addToNotificationFeed({
                    type: 'world_invite',
                    title: 'Новое приглашение в мир',
                    body: 'Вас пригласили в совместный мир.',
                });
                await showNotification('Новое приглашение в мир', 'Вас пригласили в совместный мир.');
            }
            if (prevRoleplayInviteCount !== null && roleplayCount > prevRoleplayInviteCount) {
                addToNotificationFeed({
                    type: 'roleplay_invite',
                    title: 'Приглашение в ролевое пространство',
                    body: 'Вас пригласили в новое пространство.',
                });
                await showNotification(
                    'Приглашение в ролевое пространство',
                    'Вас пригласили в новое пространство.'
                );
            }
            if (prevSceneMessageCount !== null && sceneCount > prevSceneMessageCount) {
                addToNotificationFeed({
                    type: 'scene_message',
                    title: 'Новое сообщение в сцене',
                    body: 'В одной из ваших сцен появилось новое сообщение.',
                });
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

