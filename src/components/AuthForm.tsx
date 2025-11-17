import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { FloatingInput } from "./FloatingInput";
import { Button } from "./ChronicleButton";
import { LockKeyhole, Sparkles } from "lucide-react";

export const AuthForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
        <form
            onSubmit={handleAuth}
            className="w-full max-w-md mx-auto space-y-6"
        >
            <div className="relative space-y-2 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3a4a34] bg-[#0b1510] text-[11px] uppercase tracking-[0.18em] text-[#c7bc98]">
                    <Sparkles size={14} className="text-[#c2a774]" />
                    <span>{isSignUp ? "создание аккаунта" : "доступ к хроникам"}</span>
                </div>

                <h3 className="text-2xl md:text-3xl font-garamond font-bold tracking-wide flex items-center justify-center gap-2">
                    <LockKeyhole size={20} className="text-[#c2a774]" />
                    {isSignUp ? "Регистрация" : "Вход в ChronicleCraft"}
                </h3>

                <p className="text-xs md:text-sm text-[#c7bc98]">
                    {isSignUp
                        ? "Создайте аккаунт и начните заполнять свою библиотеку миров."
                        : "Войдите, чтобы продолжить историю ваших персонажей."}
                </p>
            </div>

            <div className="space-y-4">
                <FloatingInput
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0b1510] text-[#f5e9c6] border border-[#3a4a34] focus:border-[#c2a774aa] focus:outline-none focus:ring-2 focus:ring-[#c2a77433] transition"
                />

                <FloatingInput
                    label="Пароль"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0b1510] text-[#f5e9c6] border border-[#3a4a34] focus:border-[#c2a774aa] focus:outline-none focus:ring-2 focus:ring-[#c2a77433] transition"
                />
            </div>

            {error && (
                <p className="text-sm text-[#ff9b9b] bg-[#3b2424] border border-[#D76F6F66] rounded-xl px-3 py-2 text-center">
                    {error}
                </p>
            )}

            <div className="space-y-3">
                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#c2a774] to-[#e5d9a5] hover:from-[#e5d9a5] hover:to-[#fffbe6] text-[#223120] py-2.5 rounded-xl font-semibold text-base transition shadow-[0_0_18px_#c2a77466] border border-[#c2a774] flex items-center justify-center gap-2"
                >
                    {isSignUp ? "Создать аккаунт" : "Войти в мир магии"}
                </Button>

                <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full text-sm md:text-base text-[#c7bc98] hover:text-[#e5d9a5] transition underline-offset-4 hover:underline"
                >
                    {isSignUp
                        ? "Уже есть аккаунт? Войти"
                        : "Нет аккаунта? Зарегистрироваться"}
                </button>
            </div>
        </form>
    );
};
