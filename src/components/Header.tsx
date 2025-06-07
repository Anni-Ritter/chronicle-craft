import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'react-toastify'

interface HeaderProps {
    onLoginClick: () => void
}

export const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
    const session = useSession()
    const supabase = useSupabaseClient()
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)

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
                                <span className="text-sm text-gray-700 mt-2">{session.user?.email}</span>
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

            {/* Меню для десктопа */}
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
            </nav>
        </header>
    )
}
