import { Star } from "lucide-react";
import { Button } from "../components/ChronicleButton";

interface PublicPageProps {
    onLoginClick: () => void;
}

export const PublicPage: React.FC<PublicPageProps> = ({ onLoginClick }) => {
    return (
        <div className="text-center mt-20 space-y-6 flex flex-col justify-center items-center">
            <h1 className="text-4xl font-bold mb-4 text-[#e5d9a5] font-garamond">
                ✨ Добро пожаловать в ChronicleCraft!
            </h1>
            <p className="text-lg text-[#d6c5a2] max-w-xl mx-auto font-lora">
                Здесь вы можете создавать персонажей, записывать хроники и исследовать волшебные миры. Войдите, чтобы начать приключение 🧙‍♀️
            </p>
            <Button
                onClick={onLoginClick}
                icon={<Star size={18} />}
                className="px-6 py-3 rounded-xl w-full md:w-fit bg-gradient-to-r from-[#c2a774] to-[#e5d9a5] text-[#223120] hover:from-[#e5d9a5] hover:to-[#fffbe6] shadow-md font-lora text-lg transition border border-[#c2a774]"
            >
                Войти в мир магии
            </Button>
        </div>
    );
}
