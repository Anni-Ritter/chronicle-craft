import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { AvatarUploader } from '../components/AvatarUploader';
import { FloatingInput } from '../components/FloatingInput';
import { Modal } from '../components/Modal';
import { Button } from '../components/ChronicleButton';
import { Pen, Sparkles, Trash2 } from 'lucide-react';
import { FloatingAlert } from '../components/FloatingAlert';

export const ProfilePage = () => {
    const supabase = useSupabaseClient();
    const user = useUser();

    const [username, setUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [showEmailEdit, setShowEmailEdit] = useState(false);
    const [showPasswordEdit, setShowPasswordEdit] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<{
        text: string;
        type: 'success' | 'error';
    } | null>(null);

    useEffect(() => {
        if (!user) return;
        fetchProfile();
    }, [user]);

    useEffect(() => {
        if (statusMessage) {
            const timeout = setTimeout(() => setStatusMessage(null), 4000);
            return () => clearTimeout(timeout);
        }
    }, [statusMessage]);

    const fetchProfile = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user?.id)
            .single();

        if (error) {
            setStatusMessage({ text: 'Ошибка при загрузке профиля', type: 'error' });
        } else {
            setUsername(data.username || '');
            setAvatarUrl(data.avatar_url || '');
            setNewEmail(user?.email || '');
        }
    };

    const updateProfile = async () => {
        const updates = {
            id: user?.id,
            username,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('profiles').upsert(updates);

        if (error) {
            setStatusMessage({ text: 'Ошибка при обновлении профиля', type: 'error' });
        } else {
            setStatusMessage({ text: 'Профиль обновлён', type: 'success' });
        }
    };

    const handlePasswordChange = async () => {
        if (newPassword.length < 6) {
            setStatusMessage({
                text: 'Пароль должен содержать минимум 6 символов',
                type: 'error',
            });
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            setStatusMessage({ text: 'Ошибка при смене пароля', type: 'error' });
        } else {
            setStatusMessage({ text: 'Пароль обновлён', type: 'success' });
            setShowPasswordEdit(false);
            setNewPassword('');
        }
    };

    const handleAvatarUpload = (url: string) => {
        setAvatarUrl(url);
    };

    if (!user) {
        return (
            <div className="max-w-3xl mx-auto mt-16 px-3 md:px-4 text-center text-[#e5d9a5] font-lora">
                <div className="inline-block rounded-3xl border border-[#c2a77455] bg-[#111712]/95 px-6 py-8 shadow-[0_0_35px_#000]">
                    <p className="text-lg">Чтобы настроить профиль, нужно войти в аккаунт.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-3xl mx-auto mt-10 px-3 md:px-4 pb-16 relative z-10">
                {statusMessage && (
                    <div className="mb-4">
                        <FloatingAlert
                            type={statusMessage.type}
                            message={statusMessage.text}
                            onClose={() => setStatusMessage(null)}
                            position="top-right"
                        />
                    </div>
                )}

                <div className="relative overflow-hidden rounded-3xl border border-[#c2a77455] bg-[#111712]/95 shadow-[0_0_45px_#000] px-5 py-6 md:px-8 md:py-8">
                    <div className="pointer-events-none absolute -top-16 -right-10 w-40 h-40 rounded-full bg-[#c2a77422] blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-16 -left-14 w-48 h-48 rounded-full bg-[#c2a77411] blur-3xl" />

                    <header className="relative z-10 mb-8 flex flex-col gap-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3a4a34] bg-[#101712]/80 text-[11px] md:text-xs font-lora text-[#c7bc98] uppercase tracking-[0.18em] w-fit">
                            <Sparkles className="w-3.5 h-3.5 text-[#c2a774]" />
                            <span>Профиль хрониста</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-garamond font-bold text-[#e5d9a5]">
                            Настройки профиля
                        </h1>
                        <p className="text-xs md:text-sm text-[#c7bc98] font-lora max-w-xl">
                            Обновите аватар, никнейм и данные аккаунта, чтобы ChronicleCraft знал,
                            кто хранит все эти миры и истории.
                        </p>
                    </header>

                    <section className="relative z-10 bg-[#141f16]/90 border border-[#3a4a34] rounded-2xl px-4 py-4 md:px-5 md:py-5 flex flex-col sm:flex-row items-center gap-4 md:gap-6 mb-8">
                        <div className="shrink-0">
                            <AvatarUploader
                                key={avatarUrl}
                                onUpload={handleAvatarUpload}
                                initialUrl={avatarUrl}
                                bucket="user-avatars"
                                pathPrefix={user.id}
                            />
                        </div>

                        <div className="flex-1 flex flex-col gap-2 text-center sm:text-left">
                            <span className="text-xs md:text-sm uppercase tracking-[0.18em] text-[#c7bc98] font-lora">
                                Добро пожаловать, хронист
                            </span>
                            <p className="text-sm md:text-base text-[#e5d9a5] font-lora">
                                Здесь вы можете обновить свой аватар и ник, чтобы персонажи знали,
                                кто дергает за ниточки сюжета.
                            </p>
                            <div className="flex justify-center sm:justify-start mt-1">
                                <Button
                                    variant="ghost"
                                    icon={<Pen size={16} />}
                                    className="mt-1 px-3 text-xs md:text-sm"
                                    onClick={() => {
                                        document
                                            .querySelector<HTMLInputElement>('input[type="file"]')
                                            ?.click();
                                    }}
                                >
                                    Обновить аватар
                                </Button>
                            </div>
                        </div>
                    </section>

                    <section className="relative z-10 space-y-3 mb-8">
                        <h2 className="text-xs md:text-sm uppercase tracking-[0.18em] text-[#c7bc98] font-lora">
                            Основные данные
                        </h2>
                        <FloatingInput
                            label="Никнейм"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </section>

                    <section className="relative z-10 space-y-6">
                        <h2 className="text-xs md:text-sm uppercase tracking-[0.18em] text-[#c7bc98] font-lora">
                            Данные аккаунта
                        </h2>

                        {showEmailEdit ? (
                            <div className="flex flex-col gap-2">
                                <FloatingInput
                                    label="Новый email"
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => {
                                        setNewEmail(e.target.value);
                                        setEmailError(
                                            !e.target.value.includes('@')
                                                ? 'Некорректный email'
                                                : null
                                        );
                                    }}
                                    error={emailError ?? undefined}
                                />
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <Button
                                        onClick={async () => {
                                            if (!newEmail || newEmail === user.email) {
                                                setStatusMessage({
                                                    text: 'Введите новый email, отличный от текущего',
                                                    type: 'error',
                                                });
                                                return;
                                            }

                                            const { error } = await supabase.auth.updateUser({
                                                email: newEmail,
                                            });
                                            if (error) {
                                                setStatusMessage({
                                                    text: `Ошибка: ${error.message}`,
                                                    type: 'error',
                                                });
                                            } else {
                                                setStatusMessage({
                                                    text: 'Письмо с подтверждением отправлено',
                                                    type: 'success',
                                                });
                                                setShowEmailEdit(false);
                                            }
                                        }}
                                        variant="outline"
                                        className="min-w-[150px] text-xs md:text-sm"
                                    >
                                        Подтвердить
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setNewEmail(user.email ?? '');
                                            setShowEmailEdit(false);
                                        }}
                                        className="min-w-[150px] text-xs md:text-sm"
                                    >
                                        Отмена
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <FloatingInput label="Email" value={user.email ?? ''} readOnly />
                                <Button
                                    variant="outline"
                                    onClick={() => setShowEmailEdit(true)}
                                    className="absolute top-1/2 right-2 -translate-y-1/2 text-xs md:text-sm"
                                    icon={<Pen size={16} />}
                                />
                            </div>
                        )}


                        {showPasswordEdit ? (
                            <div className="flex flex-col gap-2">
                                <FloatingInput
                                    label="Новый пароль"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    error={
                                        newPassword.length > 0 && newPassword.length < 6
                                            ? 'Минимум 6 символов'
                                            : undefined
                                    }
                                />
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <Button
                                        onClick={handlePasswordChange}
                                        variant="outline"
                                        className="min-w-[150px] text-xs md:text-sm"
                                    >
                                        Подтвердить
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setNewPassword('');
                                            setShowPasswordEdit(false);
                                        }}
                                        className="min-w-[150px] text-xs md:text-sm"
                                    >
                                        Отмена
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <FloatingInput
                                    label="Пароль"
                                    value="••••••••"
                                    type="password"
                                    readOnly
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => setShowPasswordEdit(true)}
                                    className="absolute top-1/2 right-2 -translate-y-1/2 text-xs md:text-sm"
                                    icon={<Pen size={16} />}
                                />
                            </div>
                        )}
                    </section>

                    <section className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4 mt-10 pt-4 border-t border-[#3a4a34]">
                        <Button onClick={updateProfile} className="text-sm md:text-base max-sm:w-full">
                            Сохранить профиль
                        </Button>

                        <Button
                            variant="danger"
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="text-xs md:text-sm flex items-center gap-2 max-sm:w-full"
                            icon={<Trash2 className="w-4 h-4" />}
                        >
                            Удалить аккаунт
                        </Button>
                    </section>
                </div>
            </div>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <div className="bp-6 sm:p-7 text-[#e5d9a5] font-lora w-full">
                    <h2 className="text-xl md:text-2xl font-garamond text-center mb-3 flex items-center justify-center gap-2">
                        <Trash2 className="w-5 h-5 text-[#d76f6f]" />
                        Удалить аккаунт
                    </h2>

                    <p className="text-sm md:text-base text-[#f5e9c6] mb-5 text-center">
                        Вы уверены, что хотите удалить аккаунт? Это действие{' '}
                        <strong className="text-[#e88]">необратимо</strong>, и ваши данные будут
                        удалены.
                    </p>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="text-xs md:text-sm"
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="danger"
                            onClick={async () => {
                                if (!user) return;

                                const { error: deleteError } = await supabase
                                    .from('profiles')
                                    .delete()
                                    .eq('id', user.id);

                                if (deleteError) {
                                    setStatusMessage({
                                        text: 'Не удалось удалить профиль',
                                        type: 'error',
                                    });
                                    return;
                                }

                                const { error: logoutError } = await supabase.auth.signOut();
                                if (logoutError) {
                                    setStatusMessage({
                                        text: 'Ошибка при выходе',
                                        type: 'error',
                                    });
                                } else {
                                    setStatusMessage({
                                        text: 'Аккаунт удалён',
                                        type: 'success',
                                    });
                                }

                                setIsDeleteModalOpen(false);
                            }}
                            className="text-xs md:text-sm flex items-center gap-2"
                            icon={<Trash2 className="w-4 h-4" />}
                        >
                            Удалить
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
