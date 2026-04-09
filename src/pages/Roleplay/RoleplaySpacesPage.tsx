import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { CirclePlus, Theater } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/ChronicleButton';
import { useRoleplayStore } from '../../store/useRoleplayStore';
import { RoleplaySpaceForm } from '../../features/roleplay/RoleplaySpaceForm';
import { useWorldStore } from '../../store/useWorldStore';

export const RoleplaySpacesPage = () => {
    const session = useSession();
    const supabase = useSupabaseClient();
    const navigate = useNavigate();
    const [isModalOpen, setModalOpen] = useState(false);

    const {
        spaces,
        loading,
        error,
        getRoleplaySpacesForCurrentUser,
        respondToRoleplayInvite,
        createRoleplaySpace,
        setError,
    } = useRoleplayStore();
    const { worlds, fetchWorlds } = useWorldStore();

    useEffect(() => {
        const uid = session?.user?.id;
        if (!uid) return;
        getRoleplaySpacesForCurrentUser(uid, supabase);
        fetchWorlds(uid, supabase);
    }, [session, supabase, getRoleplaySpacesForCurrentUser, fetchWorlds]);

    const mySpaces = useMemo(() => spaces.filter((space) => space.membership.status === 'active'), [spaces]);
    const invitedSpaces = useMemo(() => spaces.filter((space) => space.membership.status === 'invited'), [spaces]);

    return (
        <div className="max-w-[1440px] mx-auto mt-10 px-2 md:px-4 space-y-8">
            <div className="flex flex-col gap-3 border-b border-[#c2a774]/70 pb-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl flex items-center gap-2 font-garamond text-[#e5d9a5]">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1b261a] border border-[#c2a77466]">
                            <Theater className="w-5 h-5 text-[#c2a774]" />
                        </span>
                        Ролевая
                    </h1>
                    <p className="text-base text-[#c7bc98] font-lora">Живые пространства для совместных сцен и ролевого чата.</p>
                </div>
                <Button
                    onClick={() => setModalOpen(true)}
                    icon={<CirclePlus size={18} />}
                    className="!text-sm !px-3.5 !py-1.5 max-lg:!min-h-10 max-lg:!px-3.5"
                >
                    Создать пространство
                </Button>
            </div>

            {loading && <div className="rounded-2xl border border-[#3a4a34] bg-[#121912] p-5 text-[#c7bc98]">Загрузка пространств...</div>}
            {error && (
                <div className="rounded-2xl border border-[#7c2d2d] bg-[#2a1414] p-5 text-[#ffd2d2] space-y-2">
                    <p>Ошибка: {error}</p>
                    <Button variant="outline" onClick={() => setError(null)}>Закрыть</Button>
                </div>
            )}
            {!loading && !error && mySpaces.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#3a4a34] bg-[#101712] p-8 text-center text-[#c7bc98]">
                    <p className="text-lg text-[#e5d9a5]">У вас пока нет пространств ролевой.</p>
                    <p className="text-sm mt-1">Создайте первое пространство и пригласите участников.</p>
                </div>
            )}

            {!loading && !error && invitedSpaces.length > 0 && (
                <section className="rounded-2xl border border-[#3a4a34] bg-[#111712] p-4 space-y-3">
                    <h2 className="text-2xl font-garamond text-[#e5d9a5]">Входящие приглашения</h2>
                    {invitedSpaces.map((space) => (
                        <div key={space.id} className="rounded-xl border border-[#2d3a2f] bg-[#151f16] p-3">
                            <p className="text-[#f4ecd0] font-semibold">{space.title}</p>
                            <p className="text-sm text-[#c7bc98]">{space.description || 'Без описания'}</p>
                            <div className="mt-3 flex gap-2">
                                <Button
                                    className="!px-4 !py-2 !text-sm"
                                    onClick={async () => {
                                        const uid = session?.user?.id;
                                        if (!uid) return;
                                        const ok = await respondToRoleplayInvite(space.id, uid, 'accept', supabase);
                                        if (ok) {
                                            await getRoleplaySpacesForCurrentUser(uid, supabase);
                                        }
                                    }}
                                >
                                    Принять
                                </Button>
                                <Button
                                    variant="outline"
                                    className="!px-4 !py-2 !text-sm"
                                    onClick={async () => {
                                        const uid = session?.user?.id;
                                        if (!uid) return;
                                        const ok = await respondToRoleplayInvite(space.id, uid, 'decline', supabase);
                                        if (ok) {
                                            await getRoleplaySpacesForCurrentUser(uid, supabase);
                                        }
                                    }}
                                >
                                    Отклонить
                                </Button>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {!loading && !error && mySpaces.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {mySpaces.map((space) => (
                        <button
                            key={space.id}
                            type="button"
                            onClick={() => navigate(`/roleplay/${space.id}`)}
                            className="text-left rounded-2xl border border-[#3a4a34] bg-[#131c14] p-4 hover:border-[#c2a77488] transition"
                        >
                            <h3 className="text-xl font-garamond text-[#f4ecd0]">{space.title}</h3>
                            <p className="mt-2 text-sm text-[#c7bc98]">{space.description || 'Без описания'}</p>
                            <p className="mt-3 text-xs text-[#9e9e9e]">
                                Обновлено: {new Date(space.updated_at).toLocaleString()}
                            </p>
                        </button>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
                <RoleplaySpaceForm
                    worlds={worlds}
                    onCancel={() => setModalOpen(false)}
                    onSubmit={async (values) => {
                        const uid = session?.user?.id;
                        if (!uid) return;
                        const created = await createRoleplaySpace(values, uid, supabase);
                        if (created) {
                            setModalOpen(false);
                            navigate(`/roleplay/${created.id}`);
                        }
                    }}
                />
            </Modal>
        </div>
    );
};
