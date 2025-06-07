import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const AuthForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const { error } = isSignUp
            ? await supabase.auth.signUp({ email, password })
            : await supabase.auth.signInWithPassword({ email, password });

        if (error) setError(error.message);
        else window.location.reload();
    };

    return (
        <form onSubmit={handleAuth} className="max-w-md mx-auto p-4 border rounded">
            <h2 className="text-xl font-bold mb-2">{isSignUp ? 'Регистрация' : 'Вход'}</h2>
            <input
                type="email"
                placeholder="Email"
                className="mb-2 w-full p-2 border rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Пароль"
                className="mb-2 w-full p-2 border rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded w-full">
                {isSignUp ? 'Создать аккаунт' : 'Войти'}
            </button>
            <button
                type="button"
                className="mt-2 text-sm text-indigo-700 underline"
                onClick={() => setIsSignUp(!isSignUp)}
            >
                {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
        </form>
    );
};
