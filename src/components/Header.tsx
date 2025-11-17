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


export const Header = ({ onLoginClick }: HeaderProps) => {
    const session = useSession();
    const supabase = useSupabaseClient();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [username, setUsername] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [showPopover, setShowPopover] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const [statusMessage, setStatusMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            setStatusMessage({ type: "error", text: "Ошибка при выходе" });
        } else {
            setStatusMessage({ type: "success", text: "Вы успешно вышли" });
            navigate("/");
        }
    };

    const handleNavigate = (path: string) => {
        navigate(path);
        setIsOpen(false);
    };

    useEffect(() => {
        if (!session?.user) return;
        supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", session.user.id)
            .single()
            .then(({ data, error }) => {
                if (!error && data) {
                    setUsername(data.username);
                    setAvatarUrl(data.avatar_url);
                }
            });
    }, [session, supabase]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setShowPopover(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <>
            <header className="px-4 text-[#d6c5a2] py-4 md:py-5 flex justify-between items-center relative z-40 border-b border-[#3a4a34] backdrop-blur-sm rounded-b-2xl">
                <h1
                    onClick={() => navigate("/")}
                    className="text-[24px] md:text-[30px] font-fancy cursor-pointer tracking-wide flex flex-row items-center gap-3"
                >
                    <img src={Logo} alt="logo" className="w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-[0_0_18px_#000]" />
                    <span className="font-garamond">ChronicleCraft</span>
                </h1>

                {session && (
                    <div className="lg:hidden">
                        <button
                            onClick={() => setIsOpen(true)}
                            className="text-3xl text-[#c2a774] px-2 py-1 rounded-full hover:bg-[#101712] transition"
                            aria-label="Открыть меню"
                        >
                            ☰
                        </button>
                        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                            <div className="flex flex-col gap-4 text-base font-lora">
                                <nav className="flex flex-col gap-2">
                                    {[
                                        { label: "Персонажи", path: "/" },
                                        { label: "Хроники", path: "/chronicles" },
                                        { label: "Связи", path: "/graph" },
                                        { label: "Карта", path: "/maps" },
                                        { label: "Миры", path: "/worlds" },
                                        { label: "Профиль", path: "/profile" },
                                    ].map(({ label, path }) => (
                                        <button
                                            key={label}
                                            onClick={() => handleNavigate(path)}
                                            className="text-center text-lg text-[#e5d9a5] hover:text-[#f1eac0] py-2 bg-transparent border-none transition"
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </nav>

                                <Button
                                    variant="danger"
                                    onClick={handleLogout}
                                    className="text-sm mt-2"
                                >
                                    Выйти
                                </Button>
                            </div>
                        </Modal>
                    </div>
                )}

                {session && (
                    <nav className="hidden lg:flex items-center gap-6 font-lora">
                        {["/", "/chronicles", "/graph", "/maps", "/worlds"].map((path, i) => (
                            <button
                                key={path}
                                onClick={() => navigate(path)}
                                className="text-[22px] font-garamond text-[#d6c5a2] hover:text-[#f1eac0] hover:underline underline-offset-4 cursor-pointer transition bg-transparent border-none"
                            >
                                {["Персонажи", "Хроники", "Связи", "Карта", "Миры"][i]}
                            </button>
                        ))}

                        {session ? (
                            <div
                                className="relative ml-4 text-[16px] font-lora"
                                ref={profileRef}
                            >
                                <button
                                    onClick={() => setShowPopover(!showPopover)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#101712] border border-[#3a4a34] hover:border-[#c2a774aa] hover:bg-[#141f16] transition"
                                >
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            className="w-9 h-9 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-[#1b261c] border border-[#3a4a34]" />
                                    )}
                                    <span className="text-[18px] text-[#e5d9a5]">
                                        {username || "Профиль"}
                                    </span>
                                </button>

                                {showPopover && (
                                    <div className="absolute right-0 top-full mt-2 flex flex-col bg-[#050806] border border-[#3a4a34] shadow-[0_0_25px_#000] rounded-xl overflow-hidden z-50 min-w-[170px]">
                                        <button
                                            onClick={() => {
                                                navigate("/profile");
                                                setShowPopover(false);
                                            }}
                                            className="px-4 py-2 text-left text-sm text-[#e5d9a5] hover:bg-[#101712] transition bg-transparent border-none"
                                        >
                                            Профиль
                                        </button>
                                        <button
                                            onClick={async () => {
                                                await handleLogout();
                                                setShowPopover(false);
                                            }}
                                            className="px-4 py-2 text-left text-sm text-[#ff9b9b] hover:bg-[#3b2424] transition bg-transparent border-none"
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
    );
};