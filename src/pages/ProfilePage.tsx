import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { AvatarUploader } from '../components/AvatarUploader';
import { FloatingInput } from '../components/FloatingInput';
import { Modal } from '../components/Modal';
import { Button } from '../components/ChronicleButton';
import { Pen } from 'lucide-react';
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
            setStatusMessage({ text: 'Пароль должен содержать минимум 6 символов', type: 'error' });
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

    return (
        <>
            <div className="w-full max-w-2xl mt-[64px] mx-auto bg-[#223120] border border-[#3d4a38] rounded-xl p-4 sm:p-8 shadow-md">
                <h1 className="text-3xl font-garamond text-[#e5d9a5] border-b border-[#c2a774] pb-2 mb-6">
                    Настройки профиля
                </h1>

                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-[#0e1b12] p-4 rounded-lg border border-[#c2a774] mb-6 text-center sm:text-left">
                    <div>
                        <AvatarUploader
                            key={avatarUrl}
                            onUpload={handleAvatarUpload}
                            initialUrl={avatarUrl}
                            bucket="user-avatars"
                            pathPrefix={user?.id}
                        />
                    </div>
                    <div className="flex flex-col max-sm:justify-center max-sm:items-center gap-1 text-[#e5d9a5] font-lora ">
                        <span className="italic text-[#c2a774]">Добро пожаловать!</span>
                        <span className="text-[#a5a58f]">Вы можете обновить свой аватар</span>
                        <Button
                            variant="ghost"
                            icon={<Pen size={16} />}
                            className="md:self-start mt-1 hover:underline px-3"
                            onClick={() => {
                                document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
                            }}
                        >
                            Обновить аватар
                        </Button>
                    </div>
                </div>

                <FloatingInput
                    label="Никнейм"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                {statusMessage && (
                    <FloatingAlert
                        type={statusMessage.type}
                        message={statusMessage.text}
                        onClose={() => setStatusMessage(null)}
                        className="mt-4"
                    />
                )}

                <div className="mt-6">
                    {showEmailEdit ? (
                        <div className="flex flex-col gap-1 max-sm:gap-5 items-start">
                            <FloatingInput
                                label="Новый email"
                                type="email"
                                value={newEmail}
                                onChange={(e) => {
                                    setNewEmail(e.target.value);
                                    setEmailError(!e.target.value.includes('@') ? 'Некорректный email' : null);
                                }}
                                error={emailError ?? undefined}
                            />
                            <div className="flex flex-row gap-2 mt-2 max-sm:mt-0">
                                <Button
                                    onClick={async () => {
                                        if (!newEmail || newEmail === user?.email) {
                                            setStatusMessage({ text: 'Введите новый email, отличный от текущего', type: 'error' });
                                            return;
                                        }

                                        const { error } = await supabase.auth.updateUser({ email: newEmail });
                                        if (error) {
                                            setStatusMessage({ text: `Ошибка: ${error.message}`, type: 'error' });
                                        } else {
                                            setStatusMessage({ text: 'Письмо с подтверждением отправлено', type: 'success' });
                                            setShowEmailEdit(false);
                                        }
                                    }}
                                    variant="outline"
                                    className="min-w-[150px] text-sm"
                                >
                                    Подтвердить
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setNewEmail(user?.email ?? '');
                                        setShowEmailEdit(false);
                                    }}
                                    className="min-w-[150px] text-sm"
                                >
                                    Отмена
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative mt-6">
                            <FloatingInput
                                label="Email"
                                value={user?.email ?? ''}
                                readOnly
                            />
                            <Button
                                variant="outline"
                                onClick={() => setShowEmailEdit(true)}
                                className="absolute top-1/2 right-2 -translate-y-1/2 text-sm"
                                icon={<Pen size={16} />}
                            >
                            </Button>
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    {showPasswordEdit ? (
                        <div className="flex flex-col gap-1 max-sm:gap-5 items-start">
                            <FloatingInput
                                label="Новый пароль"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                error={newPassword.length > 0 && newPassword.length < 6 ? 'Минимум 6 символов' : undefined}
                            />
                            <div className="flex flex-row gap-2 mt-2 max-sm:mt-0">
                                <Button
                                    onClick={handlePasswordChange}
                                    variant="outline"
                                    className="min-w-[150px] text-sm"
                                >
                                    Подтвердить
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setNewPassword('');
                                        setShowPasswordEdit(false);
                                    }}
                                    className="min-w-[150px] text-sm"
                                >
                                    Отмена
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative mt-6">
                            <FloatingInput
                                label="Пароль"
                                value="••••••••"
                                type="password"
                                readOnly
                            />
                            <Button
                                variant="outline"
                                onClick={() => setShowPasswordEdit(true)}
                                className="absolute top-1/2 right-2 -translate-y-1/2 text-sm"
                                icon={<Pen size={16} />}
                            >
                            </Button>
                        </div>
                    )}
                </div>


                <div className='flex flex-col sm:flex-row justify-between items-center gap-4 mt-10'>
                    <Button
                        onClick={updateProfile}
                        className='text-base'
                    >
                        Сохранить профиль
                    </Button>

                    <Button
                        variant='danger'
                        onClick={() => setIsDeleteModalOpen(true)}
                        className='text-sm'
                    >
                        Удалить аккаунт
                    </Button>
                </div>
            </div>
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <div className="bg-[#1e2c22] border border-[#c2a774] rounded-xl p-6 text-[#e5d9a5] font-lora">
                    <h2 className="text-2xl font-garamond text-center mb-4">
                        Удалить аккаунт
                    </h2>

                    <p className="font-lora text-[#f5e9c6] mb-6 text-center">
                        Вы уверены, что хотите удалить аккаунт? Это действие <strong className="text-[#e88]">необратимо</strong>, и ваши данные будут удалены.
                    </p>

                    <div className="flex justify-end gap-4">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
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
                                    setStatusMessage({ text: 'Не удалось удалить профиль', type: 'error' });
                                    return;
                                }

                                const { error: logoutError } = await supabase.auth.signOut();
                                if (logoutError) {
                                    setStatusMessage({ text: 'Ошибка при выходе', type: 'error' });
                                } else {
                                    setStatusMessage({ text: 'Аккаунт удалён', type: 'success' });
                                }

                                setIsDeleteModalOpen(false);
                            }}
                        >
                            Удалить
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};