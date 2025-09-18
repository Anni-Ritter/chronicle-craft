import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import Logo from "../assets/logo.png";
import { Modal } from './Modal';
import { Button } from './ChronicleButton';
import { FloatingAlert } from './FloatingAlert';

interface HeaderProps {
    onLoginClick: () => void
}

function IOSAddToHomeHint() {
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const inStandalone = (window.navigator as any).standalone === true
        || window.matchMedia('(display-mode: standalone)').matches;

    if (!(isiOS && isSafari) || inStandalone) return null;

    return (
        <div className="fixed bottom-3 left-3 right-3 z-[60] rounded-xl border border-[color:var(--cc-accent)]
                    bg-[color:var(--cc-bg)] text-[color:var(--cc-text)] p-3 text-sm shadow">
            Добавьте приложение на экран «Домой»: <b>Поделиться</b> → <b>На экран «Домой»</b>.
        </div>
    );
}


export const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
    const session = useSession()
    const supabase = useSupabaseClient()
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)
    const [username, setUsername] = useState<string | null>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [showPopover, setShowPopover] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            setStatusMessage({ type: 'error', text: 'Ошибка при выходе' });
        } else {
            setStatusMessage({ type: 'success', text: 'Вы успешно вышли' });
            navigate('/');
        }
    };


    const handleNavigate = (path: string) => {
        navigate(path)
        setIsOpen(false)
    }


    useEffect(() => {
        if (!session?.user) return;
        supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', session.user.id)
            .single()
            .then(({ data, error }) => {
                if (!error && data) {
                    setUsername(data.username);
                    setAvatarUrl(data.avatar_url);
                }
            });
    }, [session]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                profileRef.current &&
                !profileRef.current.contains(e.target as Node)
            ) {
                setShowPopover(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            <header className="max-w-[1440px] text-[#D6C5A2] py-[24px] flex justify-between items-center relative z-50 border-b border-[#C2A774]">
                <h1
                    onClick={() => navigate('/')}
                    className="text-[32px] font-fancy cursor-pointer tracking-wide flex flex-row items-center gap-3"
                >
                    <img src={Logo} alt="logo" className="w-12 h-12" /> ChronicleCraft
                </h1>
                {session && (
                    <div className="lg:hidden">
                        <button onClick={() => setIsOpen(true)} className="text-3xl text-[#C2A774] px-3 py-1">
                            ☰
                        </button>
                        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                            <div className="border-t border-[#C2A774] shadow-md p-6 flex flex-col gap-4 text-base font-lora">
                                {[
                                    { label: 'Персонажи', path: '/' },
                                    { label: 'Хроники', path: '/chronicles' },
                                    { label: 'Связи', path: '/graph' },
                                    { label: 'Карта', path: '/maps' },
                                    { label: 'Миры', path: '/worlds' },
                                    { label: 'Профиль', path: '/profile' },
                                ].map(({ label, path }) => (
                                    <button
                                        key={label}
                                        onClick={() => handleNavigate(path)}
                                        className="text-center text-lg text-[#C2A774] transition py-1 bg-transparent border-none"
                                    >
                                        {label}
                                    </button>
                                ))}

                                <Button
                                    variant='danger'
                                    onClick={handleLogout}
                                    className='text-sm'
                                >
                                    Выйти
                                </Button>
                            </div>
                        </Modal>
                    </div>
                )}
                {session && (
                    <nav className="hidden lg:flex items-center gap-6 font-lora">
                        {['/', '/chronicles', '/graph', '/maps', '/worlds'].map((path, i) => (
                            <a
                                key={path}
                                onClick={() => navigate(path)}
                                className="text-[24px] font-garamond hover:underline cursor-pointer transition"
                            >
                                {['Персонажи', 'Хроники', 'Связи', 'Карта', 'Миры'][i]}
                            </a>
                        ))}

                        {session ? (
                            <div className="relative ml-6 text-[18px] font-lora" ref={profileRef}>
                                <button
                                    onClick={() => setShowPopover(!showPopover)}
                                    className="flex items-center gap-2 bg-[#0E1B12] hover:bg-[#0E1B12] border-none  text-[#D6C5A2] cursor-pointer"
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full" />
                                    )}
                                    {username || 'Профиль'}
                                </button>

                                {showPopover && (
                                    <div className="absolute right-0 top-full mt-2 flex flex-col bg-[#0E1B12] border border-[#C2A774] shadow-md rounded-md overflow-hidden z-50 min-w-[150px]">
                                        <button
                                            onClick={() => {
                                                navigate('/profile');
                                                setShowPopover(false);
                                            }}
                                            className="px-4 py-2 text-left bg-[#0E1B12] hover:underline hover:bg-[#0E1B12] border-none transition"
                                        >
                                            Профиль
                                        </button>
                                        <button
                                            onClick={async () => {
                                                await handleLogout();
                                                setShowPopover(false);
                                            }}
                                            className="px-4 py-2 text-left text-red-500 hover:underline bg-[#0E1B12] border-none hover:bg-[#0E1B12] hover:text-red-600 transition"
                                        >
                                            Выйти
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Button
                                type="button"
                                title="Войти"
                                onClick={onLoginClick}
                            >
                                Войти
                            </Button>
                        )}
                    </nav>
                )}
            </header>
            {statusMessage && (
                <FloatingAlert
                    type={statusMessage.type}
                    message={statusMessage.text}
                    onClose={() => setStatusMessage(null)}
                    position="top-right"
                />
            )}

            <IOSAddToHomeHint />
        </>
    )
}
