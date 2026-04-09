import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { ArrowLeft, CirclePlus, DoorOpen, EllipsisVertical, Pencil, Trash2, Users } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/ChronicleButton';
import { FloatingAlert } from '../../components/FloatingAlert';
import { useRoleplayStore } from '../../store/useRoleplayStore';
import { useWorldStore } from '../../store/useWorldStore';
import { useChronicleStore } from '../../store/useChronicleStore';
import { RoleplaySceneForm } from '../../features/roleplay/RoleplaySceneForm';
import { RoleplaySpaceForm } from '../../features/roleplay/RoleplaySpaceForm';

export const RoleplaySpacePage = () => {
    const { spaceId } = useParams<{ spaceId: string }>();
    const navigate = useNavigate();
    const session = useSession();
    const supabase = useSupabaseClient();

    const [spaceTitle, setSpaceTitle] = useState('Пространство');
    const [spaceDescription, setSpaceDescription] = useState<string | null>(null);
    const [spaceWorldId, setSpaceWorldId] = useState<string | null>(null);
    const [isSceneModalOpen, setSceneModalOpen] = useState(false);
    const [isEditSceneModalOpen, setEditSceneModalOpen] = useState(false);
    const [isEditSpaceModalOpen, setEditSpaceModalOpen] = useState(false);
    const [isDeleteSceneModalOpen, setDeleteSceneModalOpen] = useState(false);
    const [isDeleteSpaceModalOpen, setDeleteSpaceModalOpen] = useState(false);
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    const [isHeaderMenuOpen, setHeaderMenuOpen] = useState(false);
    const [isMembersModalOpen, setMembersModalOpen] = useState(false);
    const [roleUpdatingUserId, setRoleUpdatingUserId] = useState<string | null>(null);
    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteSubmitting, setInviteSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    const {
        membersBySpace,
        scenesBySpace,
        error: roleplayError,
        getRoleplaySpaceById,
        getRoleplaySpaceMembers,
        getRoleplaySpaceCharacters,
        inviteUserToRoleplaySpace,
        updateRoleplayMemberRole,
        getRoleplayScenesBySpace,
        createRoleplayScene,
        updateRoleplayScene,
        deleteRoleplayScene,
        updateRoleplaySpace,
        deleteRoleplaySpace,
    } = useRoleplayStore();

    const { worlds, fetchWorlds } = useWorldStore();
    const { chronicles, fetchChronicles } = useChronicleStore();

    useEffect(() => {
        const uid = session?.user?.id;
        if (!uid || !spaceId) return;
        fetchWorlds(uid, supabase);
        getRoleplaySpaceMembers(spaceId, supabase);
        getRoleplaySpaceCharacters(spaceId, supabase);
        getRoleplayScenesBySpace(spaceId, supabase);
        getRoleplaySpaceById(spaceId, supabase).then((space) => {
            if (space) {
                setSpaceTitle(space.title);
                setSpaceDescription(space.description);
                setSpaceWorldId(space.world_id);
                if (space.world_id) {
                    fetchChronicles(supabase, space.world_id);
                } else {
                    supabase.from('chronicles').select('*').then(({ data }) => {
                        useChronicleStore.setState({ chronicles: (data ?? []) });
                    });
                }
            }
        });
    }, [session, spaceId, supabase, fetchWorlds, getRoleplaySpaceMembers, getRoleplaySpaceCharacters, getRoleplayScenesBySpace, getRoleplaySpaceById, fetchChronicles]);

    const members = spaceId ? membersBySpace[spaceId] ?? [] : [];
    const scenes = spaceId ? scenesBySpace[spaceId] ?? [] : [];
    const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) ?? null;
    const membersCountLabel = (() => {
        const n = members.length;
        const mod10 = n % 10;
        const mod100 = n % 100;
        if (mod10 === 1 && mod100 !== 11) return `${n} участник`;
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} участника`;
        return `${n} участников`;
    })();
    const roleLabelMap: Record<'owner' | 'admin' | 'member', string> = {
        owner: 'Владелец',
        admin: 'Администратор',
        member: 'Участник',
    };

    if (!spaceId) return null;

    return (
        <div className="max-w-[1440px] mx-auto mt-4 px-2 md:px-4 space-y-5">
            <section className="px-1">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/roleplay')}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#2f3a34] bg-[#101712] text-[#c7bc98] transition hover:border-[#c2a77466] hover:text-[#f4ecd0]"
                                aria-label="Назад"
                                title="Назад"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setMembersModalOpen(true)}
                                className="text-left"
                                title="Открыть участников"
                            >
                                <h1 className="text-3xl md:text-4xl font-garamond text-[#f4ecd0]">{spaceTitle}</h1>
                                <p className="mt-1 text-xs md:text-sm text-[#b9b08f]">{membersCountLabel}</p>
                            </button>
                        </div>
                        <p className="mt-2 text-[#c7bc98]">{spaceDescription || 'Без описания'}</p>
                    </div>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setHeaderMenuOpen((v) => !v)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#2f3a34] text-[#c7bc98] hover:border-[#c2a77466] hover:text-[#e5d9a5]"
                            aria-label="Меню пространства"
                        >
                            <EllipsisVertical size={16} />
                        </button>
                        {isHeaderMenuOpen && (
                            <div className="absolute right-0 top-10 z-20 min-w-[220px] rounded-lg border border-[#2f3a34] bg-[#0d130f] p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-[#c7bc98] transition hover:bg-white/5 hover:text-[#f4ecd0]"
                                    onClick={() => {
                                        setInviteModalOpen(true);
                                        setHeaderMenuOpen(false);
                                    }}
                                >
                                    <Users size={16} />
                                    <span>Пригласить участника</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-[#c7bc98] transition hover:bg-white/5 hover:text-[#f4ecd0]"
                                    onClick={() => {
                                        setEditSpaceModalOpen(true);
                                        setHeaderMenuOpen(false);
                                    }}
                                >
                                    <Pencil size={16} />
                                    <span>Редактировать</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-[#e7b0b0] transition hover:bg-[#d76f6f]/10 hover:text-[#ffd0d0]"
                                    onClick={() => {
                                        setDeleteSpaceModalOpen(true);
                                        setHeaderMenuOpen(false);
                                    }}
                                >
                                    <Trash2 size={16} />
                                    <span>Удалить</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="rounded-lg border border-[#2d3a2f]/60 bg-[#111712]/55 p-2.5">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="whitespace-nowrap text-xl md:text-2xl font-garamond text-[#e5d9a5]">Сцены</h2>
                    <Button
                        icon={<CirclePlus size={16} />}
                        className="!text-sm !px-3.5 !py-1.5 max-lg:!min-h-10 max-lg:!px-3.5"
                        onClick={() => setSceneModalOpen(true)}
                    >
                        Создать сцену
                    </Button>
                </div>
                <div className="space-y-2">
                    {scenes.length === 0 && (
                        <div className="py-2 text-[#c7bc98]">
                            Сцен пока нет.
                        </div>
                    )}
                    {scenes.map((scene) => (
                        <div
                            key={scene.id}
                            className="w-full border-t border-[#2d3a2f]/50 py-2.5 text-left transition hover:bg-[#ffffff08]"
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate(`/roleplay/${spaceId}/scenes/${scene.id}`)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    navigate(`/roleplay/${spaceId}/scenes/${scene.id}`);
                                }
                            }}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-[#f3e7c8] font-semibold">{scene.title}</p>
                                    <p className="text-sm text-[#c7bc98]">{scene.description || 'Без описания'}</p>
                                    <p className="text-xs text-[#9a9a9a]">Статус: {scene.status}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/roleplay/${spaceId}/scenes/${scene.id}`);
                                        }}
                                        className="rounded-md border border-[#3a4a34] p-1.5 text-[#c2a774] hover:border-[#c2a774]"
                                        aria-label="Открыть сцену"
                                    >
                                        <DoorOpen size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedSceneId(scene.id);
                                            setEditSceneModalOpen(true);
                                        }}
                                        className="rounded-md border border-[#3a4a34] p-1.5 text-[#c7bc98] hover:border-[#c2a774] hover:text-[#e5d9a5]"
                                        aria-label="Редактировать сцену"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedSceneId(scene.id);
                                            setDeleteSceneModalOpen(true);
                                        }}
                                        className="rounded-md border border-[#513434] p-1.5 text-[#e29a9a] hover:border-[#d76f6f] hover:text-[#ffd0d0]"
                                        aria-label="Удалить сцену"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            {scene.background_image && (
                                <img src={scene.background_image} alt="" className="mt-2 h-20 w-full rounded-md object-cover opacity-90" />
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <Modal isOpen={isSceneModalOpen} onClose={() => setSceneModalOpen(false)}>
                <RoleplaySceneForm
                    worlds={worlds}
                    chronicles={chronicles}
                    onCancel={() => setSceneModalOpen(false)}
                    onSubmit={async (values) => {
                        const uid = session?.user?.id;
                        if (!uid) return;
                        const created = await createRoleplayScene(spaceId, uid, values, supabase);
                        if (created) {
                            setSceneModalOpen(false);
                        }
                    }}
                />
            </Modal>

            <Modal isOpen={isEditSceneModalOpen} onClose={() => setEditSceneModalOpen(false)}>
                {selectedScene && (
                    <RoleplaySceneForm
                        worlds={worlds}
                        chronicles={chronicles}
                        titleText="Редактировать сцену"
                        submitText="Сохранить"
                        initialValues={{
                            title: selectedScene.title,
                            description: selectedScene.description,
                            world_id: selectedScene.world_id,
                            chronicle_id: selectedScene.chronicle_id,
                            background_image: selectedScene.background_image,
                            status: selectedScene.status,
                            settings: selectedScene.settings,
                        }}
                        onCancel={() => setEditSceneModalOpen(false)}
                        onSubmit={async (values) => {
                            const updated = await updateRoleplayScene(selectedScene.id, values, supabase);
                            if (updated) {
                                setEditSceneModalOpen(false);
                            }
                        }}
                    />
                )}
            </Modal>

            <Modal isOpen={isDeleteSceneModalOpen} onClose={() => setDeleteSceneModalOpen(false)}>
                <div className="space-y-4">
                    <h3 className="text-2xl font-garamond text-[#e5d9a5]">Удалить сцену?</h3>
                    <p className="text-sm text-[#c7bc98]">Действие необратимо.</p>
                    <div className="flex gap-2">
                        <Button variant="outline" className="w-full" onClick={() => setDeleteSceneModalOpen(false)}>Отмена</Button>
                        <Button
                            variant="danger"
                            className="w-full"
                            onClick={async () => {
                                if (!selectedSceneId) return;
                                const ok = await deleteRoleplayScene(selectedSceneId, spaceId, supabase);
                                if (ok) {
                                    setDeleteSceneModalOpen(false);
                                    setSelectedSceneId(null);
                                }
                            }}
                        >
                            Удалить
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isEditSpaceModalOpen} onClose={() => setEditSpaceModalOpen(false)}>
                <RoleplaySpaceForm
                    worlds={worlds}
                    titleText="Редактировать пространство"
                    submitText="Сохранить"
                    initialValues={{
                        title: spaceTitle,
                        description: spaceDescription,
                        world_id: spaceWorldId,
                    }}
                    onCancel={() => setEditSpaceModalOpen(false)}
                    onSubmit={async (values) => {
                        const updated = await updateRoleplaySpace(spaceId, values, supabase);
                        if (updated) {
                            setSpaceTitle(updated.title);
                            setSpaceDescription(updated.description);
                            setSpaceWorldId(updated.world_id);
                            await getRoleplaySpaceCharacters(spaceId, supabase);
                            setEditSpaceModalOpen(false);
                        }
                    }}
                />
            </Modal>

            <Modal isOpen={isDeleteSpaceModalOpen} onClose={() => setDeleteSpaceModalOpen(false)}>
                <div className="space-y-4">
                    <h3 className="text-2xl font-garamond text-[#e5d9a5]">Удалить пространство?</h3>
                    <p className="text-sm text-[#c7bc98]">Это удалит само пространство.</p>
                    <div className="flex gap-2">
                        <Button variant="outline" className="w-full" onClick={() => setDeleteSpaceModalOpen(false)}>Отмена</Button>
                        <Button
                            variant="danger"
                            className="w-full"
                            onClick={async () => {
                                const uid = session?.user?.id;
                                if (!uid) return;
                                const ok = await deleteRoleplaySpace(spaceId, uid, supabase);
                                if (ok) navigate('/roleplay');
                            }}
                        >
                            Удалить
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isInviteModalOpen} onClose={() => setInviteModalOpen(false)}>
                <div className="space-y-4">
                    <h3 className="text-2xl font-garamond text-[#e5d9a5]">Пригласить участника</h3>
                    <input
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email пользователя"
                        className="w-full rounded-xl border border-[#3a4a34] bg-[#0e1b12]/80 px-4 py-3 text-[#e5d9a5] focus:border-[#c2a774] focus:outline-none"
                    />
                    <Button
                        className="w-full"
                        onClick={async () => {
                            const uid = session?.user?.id;
                            if (!uid || !inviteEmail.trim()) return;
                            const normalizedEmail = inviteEmail.trim().toLowerCase();
                            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                                setStatusMessage({ type: 'error', text: 'Введите корректный email' });
                                return;
                            }
                            setInviteSubmitting(true);
                            const result = await inviteUserToRoleplaySpace(spaceId, uid, normalizedEmail, supabase);
                            if (result.ok) {
                                setInviteEmail('');
                                setInviteModalOpen(false);
                                await getRoleplaySpaceMembers(spaceId, supabase);
                                setStatusMessage({ type: 'success', text: 'Приглашение отправлено' });
                            } else {
                                setStatusMessage({ type: 'error', text: result.error || 'Не удалось отправить приглашение' });
                            }
                            setInviteSubmitting(false);
                        }}
                    >
                        {inviteSubmitting ? 'Отправка...' : 'Отправить приглашение'}
                    </Button>
                </div>
            </Modal>
            <Modal isOpen={isMembersModalOpen} onClose={() => setMembersModalOpen(false)}>
                <div className="space-y-4">
                    <h3 className="text-2xl font-garamond text-[#e5d9a5]">Участники пространства</h3>
                    <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                        {members.map((member) => {
                            const name = member.profile?.username || member.member.user_id;
                            const avatar = member.profile?.avatar_url;
                            const isOwner = member.member.role === 'owner';
                            const isUpdating = roleUpdatingUserId === member.member.user_id;
                            return (
                                <div key={member.member.id} className="flex items-center gap-3 rounded-lg border border-[#2d3a2f]/60 bg-[#101712] p-2.5">
                                    {avatar ? (
                                        <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a231d] text-xs text-[#9fa68a]">
                                            ?
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[#f3e7c8]">{name}</p>
                                        <p className="text-xs text-[#c7bc98]">
                                            {roleLabelMap[member.member.role]} · {member.member.status}
                                        </p>
                                    </div>
                                    <select
                                        value={member.member.role}
                                        disabled={isOwner || isUpdating}
                                        onChange={async (e) => {
                                            const nextRole = e.target.value as 'owner' | 'admin' | 'member';
                                            if (nextRole === member.member.role) return;
                                            if (nextRole === 'owner' && members.some((m) => m.member.role === 'owner' && m.member.user_id !== member.member.user_id)) {
                                                setStatusMessage({
                                                    type: 'error',
                                                    text: 'В пространстве уже есть владелец. Сначала передайте роль владельца текущему owner.',
                                                });
                                                return;
                                            }
                                            setRoleUpdatingUserId(member.member.user_id);
                                            const ok = await updateRoleplayMemberRole(spaceId, member.member.user_id, nextRole, supabase);
                                            setRoleUpdatingUserId(null);
                                            if (!ok) {
                                                setStatusMessage({
                                                    type: 'error',
                                                    text: roleplayError || useRoleplayStore.getState().error || 'Не удалось изменить роль участника',
                                                });
                                                return;
                                            }
                                            setStatusMessage({
                                                type: 'success',
                                                text: nextRole === 'owner'
                                                    ? 'Роль владельца обновлена'
                                                    : nextRole === 'admin'
                                                        ? 'Роль администратора обновлена'
                                                        : 'Роль участника обновлена',
                                            });
                                        }}
                                        className="rounded-md border border-[#3a4a34] bg-[#0e1b12]/80 px-2 py-1 text-sm text-[#e5d9a5] focus:border-[#c2a774] focus:outline-none disabled:opacity-50"
                                    >
                                        <option value="owner">Владелец</option>
                                        <option value="admin">Администратор</option>
                                        <option value="member">Участник</option>
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Modal>
            {statusMessage && (
                <FloatingAlert
                    type={statusMessage.type}
                    message={statusMessage.text}
                    onClose={() => setStatusMessage(null)}
                    position="top-right"
                />
            )}
        </div>
    );
};
