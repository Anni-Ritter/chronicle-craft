import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FloatingInput } from './FloatingInput';
import { Eye, EyeOff } from 'lucide-react';

export const AuthForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false)

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
        <form
            onSubmit={handleAuth}
            className="bg-[#223120] border border-[#c2a774] text-[#e5d9a5] font-lora px-4 py-6 rounded-2xl shadow-md space-y-6"
        >
            <h3 className="text-xl text-center font-bold tracking-wide">
                {isSignUp ? 'Регистрация' : 'Вход'}
            </h3>


            <div className="mb-4">
                <FloatingInput
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774]"
                />
            </div>

            <div className="mb-4 relative">
                <FloatingInput
                    label="Пароль"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774]"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c2a774] border-none"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>

            {error && (
                <p className="text-red-600 text-sm mb-3 text-center">{error}</p>
            )}

            <button
                type="submit"
                className="w-full bg-[#c2a774] hover:bg-[#e5d9a5] text-[#2D422B] py-2 rounded-xl font-semibold transition"
            >
                {isSignUp ? 'Создать аккаунт' : 'Войти'}
            </button>

            <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-sm underline hover:text-[#e5d9a5] transition border-none"
            >
                {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
        </form>
    );
};
