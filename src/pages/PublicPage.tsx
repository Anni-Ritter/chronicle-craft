import { BookOpen, Star, Stars, Users, Wand2 } from "lucide-react";
import { Button } from "../components/ChronicleButton";

interface PublicPageProps {
    onLoginClick: () => void;
}

export const PublicPage = ({ onLoginClick }: PublicPageProps) => {
    return (
        <div className="text-center mt-16 flex flex-col justify-center items-center px-6">
            <h1 className="text-4xl flex flex-row items-center gap-2 font-bold mb-4 text-[#e5d9a5] font-garamond drop-shadow-md">
                <Stars size={28}/> Добро пожаловать в ChronicleCraft!
            </h1>

            <p className="text-lg text-[#d6c5a2] max-w-2xl mx-auto font-lora leading-relaxed">
                Мир, где ваши персонажи оживают, истории обретают голос, а магия приходит в движение.
                Создавайте героев, ведите хроники, исследуйте свои вселенные — всё в одном месте.
            </p>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mt-10 w-full">
                <FeatureCard
                    icon={<Wand2 className="text-[#e5d9a5]" size={32} />}
                    title="Создание персонажей"
                    text="Гибкие параметры, уникальный стиль, продуманные характеристики — воплотите образ так, как вы его видите."
                />

                <FeatureCard
                    icon={<BookOpen className="text-[#e5d9a5]" size={32} />}
                    title="Хроники и сюжет"
                    text="Пишите истории, главы, заметки, дневники — объединяйте всё в личную магическую летопись."
                />

                <FeatureCard
                    icon={<Users className="text-[#e5d9a5]" size={32} />}
                    title="Мир сообществ"
                    text="Делитесь персонажами и историями, вдохновляйтесь мирами других магов и авторов."
                />
            </div>

            <Button
                onClick={onLoginClick}
                icon={<Star size={18} />}
                className="px-6 py-3 rounded-xl w-full md:w-fit bg-gradient-to-r from-[#c2a774] to-[#e5d9a5] 
                text-[#223120] hover:from-[#e5d9a5] hover:to-[#fffbe6] shadow-md font-lora text-lg 
                transition border border-[#c2a774] mt-10"
            >
                Войти в мир магии
            </Button>
        </div>
    );
}

const FeatureCard = ({
    icon,
    title,
    text,
}: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) => {
    return (
        <div className="p-5 rounded-xl bg-[#223120]/40 border border-[#3a4a34] shadow-sm hover:bg-[#223120]/50 transition">
            <div className="flex justify-center mb-3">{icon}</div>
            <h3 className="font-garamond text-xl text-[#e5d9a5] mb-2">{title}</h3>
            <p className="text-[#d6c5a2] text-sm font-lora leading-snug">{text}</p>
        </div>
    );
}