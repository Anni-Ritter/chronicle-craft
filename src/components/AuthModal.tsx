import { Dialog } from '@headlessui/react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useRef } from 'react'
import { toast } from 'react-toastify'

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const supabase = useSupabaseClient()
    const showedToast = useRef(false)
    useEffect(() => {
        let initialSessionChecked = false
        let wasSignedIn = false

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            wasSignedIn = !!session
            initialSessionChecked = true
        }

        checkSession()

        const { data: listener } = supabase.auth.onAuthStateChange((event) => {
            if (!initialSessionChecked) return

            if (event === 'SIGNED_IN' && !wasSignedIn && !showedToast.current) {
                toast.success('Вы успешно авторизовались!')
                showedToast.current = true
                wasSignedIn = true
                onClose()
            }

            if (event === 'SIGNED_OUT') {
                toast.info('Вы вышли из аккаунта')
                wasSignedIn = false
                showedToast.current = false
            }
        })

        return () => {
            listener.subscription.unsubscribe()
        }
    }, [onClose, supabase])

    if (!isOpen) return null;
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg">
                    <Dialog.Panel className="text-lg font-bold mb-4 text-center">Вход или регистрация</Dialog.Panel>
                    <Auth
                        supabaseClient={supabase}
                        view="sign_in"
                        appearance={{
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: '#4f46e5',
                                        brandAccent: '#6366f1',
                                        brandButtonText: '#ffffff',
                                    }
                                }
                            }
                        }}
                        theme="light"
                        providers={[]}
                        showLinks={true}
                        localization={{
                            variables: {
                                sign_in: {
                                    email_label: 'Email',
                                    password_label: 'Пароль',
                                    button_label: 'Войти',
                                    link_text: 'Уже есть аккаунт? Войти',
                                },
                                sign_up: {
                                    email_label: 'Email',
                                    password_label: 'Пароль',
                                    button_label: 'Зарегистрироваться',
                                    link_text: 'Нет аккаунта? Зарегистрироваться',
                                },
                            },
                        }}
                    />
                    <button
                        onClick={onClose}
                        className="mt-4 w-full text-sm text-gray-500 underline hover:text-gray-700"
                    >
                        Отмена
                    </button>
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}
