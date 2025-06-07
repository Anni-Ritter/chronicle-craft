import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

interface HeaderProps {
    onLoginClick: () => void
}

export const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
    const session = useSession()
    const supabase = useSupabaseClient()
    const navigate = useNavigate()
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error('Ошибка при выходе');
        }
    };

    return (
        <header className="p-4 flex justify-between items-center">
            <h1
                onClick={() => navigate('/')}
                className="text-xl font-bold cursor-pointer"
            >
                ChronicleCraft ✨
            </h1>
            <nav>
                <ul className="flex gap-4">
                    <li>
                        <a
                            onClick={() => navigate('/')}
                            className="text-indigo-600 hover:underline"
                        >
                            Персонажи
                        </a>
                    </li>
                    <li>
                        <a
                            onClick={() => navigate('/chronicles')}
                            className="text-indigo-600 hover:underline"
                        >
                            Хроники
                        </a>
                    </li>
                    <li>
                        <a
                            onClick={() => navigate('/graph')}
                            className="text-indigo-600 hover:underline"
                        >
                            Связи
                        </a>
                    </li>
                    <li>
                        <a
                            onClick={() => navigate('/maps')}
                            className="text-indigo-600 hover:underline"
                        >
                            Карта
                        </a>
                    </li>
                </ul>
            </nav>
            {session ? (
                <div className="flex items-center gap-4">
                    <span className="text-sm">{session.user?.email}</span>
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
        </header>
    )
}
