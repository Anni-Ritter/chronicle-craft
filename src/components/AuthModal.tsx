import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useRef, useState } from 'react'
import { AuthForm } from './AuthForm'
import { Modal } from './Modal'
import { FloatingAlert } from './FloatingAlert'

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
    const supabase = useSupabaseClient()
    const showedOnce = useRef(false);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

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

            if (event === 'SIGNED_IN' && !wasSignedIn && !showedOnce.current) {
                setStatusMessage({ type: 'success', text: 'Вы успешно авторизовались!' });
                showedOnce.current = true;
                wasSignedIn = true;
                onClose();
            }


            if (event === 'SIGNED_OUT') {
                setStatusMessage({ type: 'success', text: 'Вы вышли из аккаунта' });
                wasSignedIn = false;
                showedOnce.current = false;
            }
        })

        return () => {
            listener.subscription.unsubscribe()
        }
    }, [onClose, supabase])

    if (!isOpen) return null;
    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose}>
                <AuthForm />
            </Modal>
            {statusMessage && (
                <FloatingAlert
                    type={statusMessage.type}
                    message={statusMessage.text}
                    onClose={() => setStatusMessage(null)}
                    position="top-right"
                />
            )}
        </>
    )
}
