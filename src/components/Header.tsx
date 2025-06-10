import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

interface HeaderProps {
    onLoginClick: () => void
}

export const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
    const session = useSession()
    const supabase = useSupabaseClient()
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)
    const [username, setUsername] = useState<string | null>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error('Ошибка при выходе');
        }
    }

    const handleNavigate = (path: string) => {
        navigate(path)
        setIsOpen(false)
    }


    useEffect(() => {
        const fetchProfile = async () => {
            if (!session?.user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', session.user.id)
                .single();

            if (!error && data) {
                setUsername(data.username);
                setAvatarUrl(data.avatar_url);
            }
        };

        fetchProfile();
    }, [session]);

    return (
        <header className="p-4 flex justify-between items-center bg-white relative z-50">
            <h1
                onClick={() => navigate('/')}
                className="text-xl font-bold cursor-pointer"
            >
                ChronicleCraft ✨
            </h1>

            <div className="md:hidden">
                <button onClick={() => setIsOpen(!isOpen)} className="text-2xl">
                    ☰
                </button>
                {isOpen && (
                    <div className="absolute top-full left-0 w-full bg-white border-t mt-2 shadow-md p-4 flex flex-col gap-2">
                        <button onClick={() => handleNavigate('/')} className="text-indigo-600 text-left">
                            Персонажи
                        </button>
                        <button onClick={() => handleNavigate('/chronicles')} className="text-indigo-600 text-left">
                            Хроники
                        </button>
                        <button onClick={() => handleNavigate('/graph')} className="text-indigo-600 text-left">
                            Связи
                        </button>
                        <button onClick={() => handleNavigate('/maps')} className="text-indigo-600 text-left">
                            Карта
                        </button>
                        {session ? (
                            <>
                                <a onClick={() => navigate('/profile')} className="text-sm text-gray-700 mt-2">
                                    {username || 'Профиль'}
                                </a>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition mt-2"
                                >
                                    Выйти
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    onLoginClick()
                                    setIsOpen(false)
                                }}
                                className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition"
                            >
                                Войти
                            </button>
                        )}
                    </div>
                )}
            </div>

            <nav className="hidden md:flex items-center gap-4">
                <a onClick={() => navigate('/')} className="text-indigo-600 hover:underline cursor-pointer">
                    Персонажи
                </a>
                <a onClick={() => navigate('/chronicles')} className="text-indigo-600 hover:underline cursor-pointer">
                    Хроники
                </a>
                <a onClick={() => navigate('/graph')} className="text-indigo-600 hover:underline cursor-pointer">
                    Связи
                </a>
                <a onClick={() => navigate('/maps')} className="text-indigo-600 hover:underline cursor-pointer">
                    Карта
                </a>
                {session ? (
                    <div className="flex items-center gap-4">
                        <a className="text-sm cursor-pointer flex items-center gap-2" onClick={() => navigate('/profile')}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-300" />
                            )}
                            {username || 'Профиль'}
                        </a>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                        >
                            Выйти
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onLoginClick}
                        className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition"
                    >
                        Войти
                    </button>
                )}
            </nav>
        </header>
    )
}
