import { useSession } from '@supabase/auth-helpers-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users, BookOpen, Map, Globe, Theater } from 'lucide-react'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
    { label: 'Персонажи', path: '/', icon: Users },
    { label: 'Хроники', path: '/chronicles', icon: BookOpen },
    { label: 'Ролевая', path: '/roleplay', icon: Theater },
    { label: 'Карта', path: '/maps', icon: Map },
    { label: 'Миры', path: '/worlds', icon: Globe }
] as const

export const BottomNav = () => {
    const session = useSession()
    const navigate = useNavigate()
    const location = useLocation()

    if (!session) return null
    if (/^\/roleplay\/[^/]+\/scenes\/[^/]+$/.test(location.pathname)) return null

    return (
        <motion.nav
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#1a1f1c] bg-[#050505] lg:hidden"
            style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
            initial={{ y: 88, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
            <div className="flex items-stretch justify-between px-0.5">
                {NAV_ITEMS.map(({ label, path, icon: Icon }, index) => {
                    const isActive =
                        path === '/'
                            ? location.pathname === '/' || location.pathname === '/characters'
                            : location.pathname === path || location.pathname.startsWith(path + '/')

                    return (
                        <motion.button
                            key={path}
                            type="button"
                            onClick={() => navigate(path)}
                            className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 border-none bg-transparent py-2.5 px-0.5 touch-manipulation"
                            aria-label={label}
                            aria-current={isActive ? 'page' : undefined}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.28, delay: index * 0.04 + 0.12 }}
                            whileTap={{ scale: 0.94 }}
                        >
                            {/* Верхняя линия как в референсе */}
                            <span
                                className={
                                    isActive
                                        ? 'absolute left-1/2 top-0 h-[2px] w-7 -translate-x-1/2 rounded-full bg-[#e4c76a] shadow-[0_0_12px_rgba(228,199,106,0.9),0_0_4px_rgba(228,199,106,0.6)]'
                                        : 'absolute left-1/2 top-0 h-[2px] w-7 -translate-x-1/2 rounded-full bg-transparent'
                                }
                                aria-hidden
                            />

                            <Icon
                                size={22}
                                strokeWidth={isActive ? 2.35 : 1.75}
                                className={
                                    isActive
                                        ? 'text-[#e8cf7a] drop-shadow-[0_0_10px_rgba(228,199,106,0.55)]'
                                        : 'text-[#5a5f5c]'
                                }
                                aria-hidden
                            />
                            <span
                                className={`max-w-full truncate px-0.5 text-[13px] font-medium leading-tight tracking-wide ${
                                    isActive
                                        ? 'font-semibold text-[#e8cf7a] drop-shadow-[0_0_8px_rgba(228,199,106,0.45)]'
                                        : 'text-[#5a5f5c]'
                                }`}
                            >
                                {label}
                            </span>
                        </motion.button>
                    )
                })}
            </div>
        </motion.nav>
    )
}
