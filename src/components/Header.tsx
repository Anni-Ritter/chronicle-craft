import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import Logo from "../assets/logo.png";
import { Button } from './ChronicleButton';
import { FloatingAlert } from './FloatingAlert';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-[60] rounded-xl border border-[color:var(--cc-accent)]
                    bg-[color:var(--cc-bg)] text-[color:var(--cc-text)] p-3 text-sm shadow">
            Добавьте приложение на экран «Домой»: <b>Поделиться</b> → <b>На экран «Домой»</b>.
        </div>
    );
}


export const Header = ({ onLoginClick }: HeaderProps) => {
    const session = useSession();
    const supabase = useSupabaseClient();
    const navigate = useNavigate();
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
            <header className="relative z-40 lg:flex lg:items-center lg:justify-between lg:rounded-b-2xl lg:border-b lg:border-[#3a4a34] lg:px-4 lg:py-5 lg:text-[#d6c5a2] lg:backdrop-blur-sm">
                <div
                    className="lg:hidden sticky top-0 z-40 border-b border-[#1a2418] bg-[#050806]/88 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
                    style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}
                >
                    <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-1">
                        <motion.button
                            type="button"
                            onClick={() => navigate('/')}
                            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-transparent bg-transparent p-0 text-left text-[#e5d9a5] touch-manipulation"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="relative shrink-0">
                                <span className="absolute -inset-0.5 rounded-2xl bg-[#c2a774]/20 blur-md opacity-60" />
                                <img
                                    src={Logo}
                                    alt=""
                                    className="relative h-10 w-10 rounded-xl object-cover shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
                                />
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate font-garamond text-[17px] font-semibold tracking-wide text-[#f2e6c8]">
                                    ChronicleCraft
                                </span>
                                <span className="block truncate text-[11px] font-lora text-[#8a9a82]">
                                    Ваши миры и истории
                                </span>
                            </span>
                        </motion.button>

                        <div className="flex shrink-0 items-center gap-2">
                            {session ? (
                                <motion.button
                                    type="button"
                                    onClick={() => navigate('/profile')}
                                    className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#c2a774]/40 bg-[#101712] shadow-[0_0_20px_rgba(0,0,0,0.45)] touch-manipulation"
                                    whileTap={{ scale: 0.94 }}
                                    aria-label="Профиль"
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-semibold text-[#c2a774]">
                                            {(username || 'Я').slice(0, 1).toUpperCase()}
                                        </span>
                                    )}
                                </motion.button>
                            ) : (
                                <Button type="button" title="Войти" onClick={onLoginClick} className="!min-h-11 !rounded-[14px] !px-5 text-sm shadow-md">
                                    Войти
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Десктоп — без изменений */}
                <motion.h1
                    onClick={() => navigate("/")}
                    className="hidden lg:flex text-[24px] md:text-[30px] font-fancy cursor-pointer tracking-wide flex-row items-center gap-3 text-[#d6c5a2]"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                >
                    <motion.img
                        src={Logo}
                        alt="logo"
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-[0_0_18px_#000]"
                        initial={{ rotate: -10, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                    <span className="font-garamond">ChronicleCraft</span>
                </motion.h1>

                {session && (
                    <nav className="hidden lg:flex items-center gap-6 font-lora">
                        {["/", "/chronicles", "/roleplay", "/graph", "/maps", "/worlds"].map((path, i) => (
                            <motion.button
                                key={path}
                                onClick={() => navigate(path)}
                                className="text-[22px] font-garamond text-[#d6c5a2] hover:text-[#f1eac0] hover:underline underline-offset-4 cursor-pointer transition bg-transparent border-none"
                                initial={{ opacity: 0, y: -12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: i * 0.06 + 0.1, ease: 'easeOut' }}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {["Персонажи", "Хроники", "Ролевая", "Связи", "Карта", "Миры"][i]}
                            </motion.button>
                        ))}

                        {session ? (
                            <motion.div
                                className="relative ml-4 text-[16px] font-lora"
                                ref={profileRef}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.35, delay: 0.4 }}
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

                                <AnimatePresence>
                                    {showPopover && (
                                        <motion.div
                                            className="absolute right-0 top-full mt-2 flex flex-col bg-[#050806] border border-[#3a4a34] shadow-[0_0_25px_#000] rounded-xl overflow-hidden z-50 min-w-[170px]"
                                            initial={{ opacity: 0, scale: 0.93, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.93, y: -8 }}
                                            transition={{ duration: 0.18, ease: 'easeOut' }}
                                        >
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
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
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