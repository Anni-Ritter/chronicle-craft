import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { toast } from 'react-toastify';
import { AvatarUploader } from '../components/AvatarUploader';
import { FloatingInput } from '../components/FloatingInput';
import { Modal } from '../components/Modal';

export const ProfilePage = () => {
    const supabase = useSupabaseClient();
    const user = useUser();

    const [username, setUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user?.id)
            .single();

        if (error) {
            toast.error('Ошибка при загрузке профиля');
        } else {
            setUsername(data.username || '');
            setAvatarUrl(data.avatar_url || '');
            setNewEmail(user?.email || '');
        }
    };

    const updateProfile = async () => {
        setLoading(true);
        const updates = {
            id: user?.id,
            username,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('profiles').upsert(updates);

        if (error) toast.error('Ошибка при обновлении');
        else toast.success('Профиль обновлён');

        setLoading(false);
    };

    const handlePasswordChange = async () => {
        if (newPassword.length < 6) {
            toast.error('Пароль должен содержать не менее 6 символов');
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) toast.error('Ошибка при смене пароля');
        else toast.success('Пароль обновлён');
    };

    const handleAvatarUpload = (url: string) => {
        setAvatarUrl(url);
    };

    return (
        <>
            <div className="max-w-xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-4">Настройки профиля</h1>

                <div className='flex flex-row mb-5 gap-10 items-center'>
                    <div>
                        <AvatarUploader
                            key={avatarUrl}
                            onUpload={handleAvatarUpload}
                            initialUrl={avatarUrl}
                            bucket="user-avatars"
                            pathPrefix={user?.id}
                        />
                    </div>
                    <div className='flex flex-col text-start'>
                        <span>{user?.email}</span>
                        <span>{username}</span>
                    </div>
                </div>

                <FloatingInput
                    label="Никнейм"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />


                <div className="border-t pt-6 gap-5 my-3 flex flex-row justify-between">
                    <FloatingInput
                        label="Новая почта"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        error={!newEmail.includes('@') ? 'Некорректный email' : undefined}
                    />
                    <button
                        onClick={async () => {
                            if (!newEmail || newEmail === user?.email) {
                                toast.error('Введите новый email, отличный от текущего');
                                return;
                            }

                            const { error } = await supabase.auth.updateUser({ email: newEmail });
                            if (error) toast.error('Ошибка при смене email: ' + error.message);
                            else toast.success('Письмо с подтверждением отправлено на новый email');
                        }}
                        className="bg-gray-700 text-white px-4 py-2 w-[250px] h-[50px] whitespace-nowrap rounded"
                    >
                        Сменить email
                    </button>
                </div>

                <div className="border-t pt-6 gap-5 my-3 flex flex-row justify-between">
                    <FloatingInput
                        label="Новый пароль"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                        onClick={handlePasswordChange}
                        className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 w-[250px] p-[50px] whitespace-nowrap rounded"
                    >
                        Сменить пароль
                    </button>
                </div>


                <div className='flex flex-row justify-between items-center mt-10'>
                    <button
                        onClick={updateProfile}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                    >
                        {loading ? 'Сохраняем...' : 'Сохранить профиль'}
                    </button>

                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="text-red-500 underline text-sm"
                    >
                        Удалить аккаунт
                    </button>
                </div>
            </div>
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <h2 className="text-lg font-semibold mb-4 text-center">Удалить аккаунт</h2>
                <p className="text-sm text-gray-700 mb-6 text-center">
                    Вы уверены, что хотите удалить аккаунт? Это действие <strong>необратимо</strong>, и ваши данные будут удалены.
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={async () => {
                            if (!user) return;

                            const { error: deleteError } = await supabase
                                .from('profiles')
                                .delete()
                                .eq('id', user.id);

                            if (deleteError) {
                                toast.error('Не удалось удалить профиль');
                                return;
                            }

                            const { error: logoutError } = await supabase.auth.signOut();
                            if (logoutError) {
                                toast.error('Ошибка при выходе');
                            } else {
                                toast.success('Аккаунт удалён');
                            }

                            setIsDeleteModalOpen(false);
                        }}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                        Удалить
                    </button>
                </div>
            </Modal>
        </>
    );
};
