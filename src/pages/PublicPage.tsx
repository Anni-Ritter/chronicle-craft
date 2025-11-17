import { BookOpen, PenSquare, Share2, Sparkles, Star, Stars, Users, Wand2 } from "lucide-react";
import { Button } from "../components/ChronicleButton";

interface PublicPageProps {
    onLoginClick: () => void;
}

export const PublicPage = ({ onLoginClick }: PublicPageProps) => {
    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-[#040806] via-[#0b1510] to-[#040806] text-[#e5d9a5]">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-16 -left-10 w-64 h-64 rounded-full bg-[#c2a77433] blur-3xl animate-pulse" />
                <div className="absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-[#c2a77422] blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-1/3 w-56 h-56 rounded-full bg-[#c2a7741a] blur-3xl animate-pulse" />
            </div>

            <main className="relative z-10 max-w-6xl mx-auto px-4 pb-20 pt-16 md:pt-20 space-y-20">
                <section className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
                    <div className="flex-1 text-center md:text-left space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#c2a77466] bg-[#101b13]/60 text-xs md:text-sm font-lora mb-2 animate-pulse">
                            <Sparkles size={14} className="text-[#c2a774]" />
                            <span>Ваш личный архив миров, персонажей и историй</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl flex flex-wrap justify-center md:justify-start items-center gap-3 font-bold text-[#e5d9a5] font-garamond drop-shadow-[0_0_18px_#000]">
                            <Stars size={36} className="text-[#c2a774] animate-spin-slow" />
                            <span>ChronicleCraft</span>
                        </h1>

                        <p className="text-base md:text-lg text-[#d6c5a2] max-w-xl font-lora leading-relaxed mx-auto md:mx-0">
                            Платформа для тех, кто строит целые вселенные: создавайте персонажей,
                            связывайте их отношениями, ведите хроники и держите лор под контролем.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center md:items-start gap-4 pt-2">
                            <Button
                                onClick={onLoginClick}
                                className="px-7 py-3 rounded-xl w-full sm:w-auto bg-gradient-to-r from-[#c2a774] to-[#e5d9a5] 
                                    text-[#223120] hover:from-[#e5d9a5] hover:to-[#fffbe6] shadow-[0_0_25px_#c2a77466] font-lora text-lg 
                                    transition border border-[#c2a774] flex items-center justify-center gap-2"
                            >
                                Войти в мир магии
                            </Button>

                            <div className="text-xs md:text-sm text-[#c7bc98] font-lora max-w-xs text-center sm:text-left">
                                Никаких сложных настроек — просто войдите и начните заполнять свою библиотеку миров.
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 md:gap-6 pt-6 text-xs md:text-sm font-lora">
                            <HeroStat label="Персонажи" value="Гибкая кастомизация" />
                            <HeroStat label="Миры" value="Локации и связи" />
                            <HeroStat label="Хроники" value="Истории и события" />
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <div className="relative rounded-3xl border border-[#c2a77455] bg-[#111b13]/90 shadow-[0_0_45px_#000] p-4 md:p-5 overflow-hidden group">
                            <div className="absolute -top-10 right-8 w-32 h-32 bg-[#c2a77422] blur-3xl rounded-full group-hover:scale-110 transition" />

                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                                </div>
                                <span className="text-xs text-[#c7bc98]/80 font-lora">
                                    Превью интерфейса ChronicleCraft
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1 bg-[#1b261c] rounded-2xl p-3 border border-[#2f3f2c] space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Wand2 size={16} className="text-[#c2a774]" />
                                        <span className="text-xs font-semibold text-[#e5d9a5]">
                                            Персонажи
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-[11px] text-[#d6c5a2] font-lora">
                                        <FakeRow name="Вэлл Сиренн" tag="магия" />
                                        <FakeRow name="Наэне Асаори" tag="академия" />
                                        <FakeRow name="Рис Хироно" tag="контракт" />
                                    </div>
                                </div>

                                <div className="col-span-2 bg-[#101712] rounded-2xl p-3 border border-[#2f3f2c] flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <BookOpen size={16} className="text-[#c2a774]" />
                                            <span className="text-xs font-semibold text-[#e5d9a5]">
                                                Карточка персонажа
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-[#c7bc98]">Черновик</span>
                                    </div>
                                    <div className="bg-[#182218] rounded-xl p-3 text-[11px] text-[#d6c5a2] font-lora leading-snug">
                                        Вэлл Сиренн — студент Академии, связанный с древним заговором и
                                        магией времени. Хроники фиксируют каждый шаг его пути…
                                    </div>
                                    <div className="flex gap-2 text-[10px]">
                                        <TagPill>характер</TagPill>
                                        <TagPill>отношения</TagPill>
                                        <TagPill>сюжетная арка</TagPill>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="space-y-6">
                    <SectionTitle
                        eyebrow="Всё, что нужно автору и ворлдбилдеру"
                        title="Одна платформа для персонажей, лора и историй"
                    />

                    <div className="grid md:grid-cols-3 gap-6 mt-4">
                        <FeatureCard
                            icon={<Wand2 className="text-[#e5d9a5]" size={28} />}
                            title="Глубокие персонажи"
                            text="Характеристики, биография, связи, дополнительные поля — от простых героев до сложных многоуровневых персонажей."
                        />
                        <FeatureCard
                            icon={<BookOpen className="text-[#e5d9a5]" size={28} />}
                            title="Хроники и лор"
                            text="Хронологические записи, события, связанные персонажи — держите сюжет под контролем и не теряйте детали."
                        />
                        <FeatureCard
                            icon={<Users className="text-[#e5d9a5]" size={28} />}
                            title="Сеть отношений"
                            text="Визуальные графы связей: кто с кем связан, как и почему. Для сложных семей, академий, фракций и заговоров."
                        />
                    </div>
                </section>

                <section className="space-y-6">
                    <SectionTitle
                        eyebrow="Как это выглядит внутри"
                        title="Интерфейсы, которые не мешают писать истории"
                    />

                    <div className="grid lg:grid-cols-3 gap-6 mt-4">
                        <PreviewCard
                            label="Список персонажей"
                            description="Быстрый поиск, фильтрация по мирам, аккуратные карточки — ориентироваться в касте так же легко, как листать свою колоду."
                        />
                        <PreviewCard
                            label="Карточка персонажа"
                            description="Характеристики, атрибуты, связи, биография, дополнительные поля — всё структурировано и на своём месте."
                        />
                        <PreviewCard
                            label="Граф отношений"
                            description="Визуальная карта связей персонажа: друзья, враги, наставники, родня и загадочные фигуры из прошлого."
                        />
                    </div>
                </section>

                <section className="space-y-6">
                    <SectionTitle
                        eyebrow="Три шага до собственной вселенной"
                        title="Как начать пользоваться ChronicleCraft"
                    />

                    <div className="grid md:grid-cols-3 gap-6 mt-4">
                        <StepCard
                            step="1"
                            title="Войти"
                            icon={<Star size={18} />}
                            text="Авторизуйтесь и создайте первый мир — пусть это будет академия, город, королевство или целая планета."
                        />
                        <StepCard
                            step="2"
                            title="Заполнить"
                            icon={<PenSquare size={18} />}
                            text="Добавьте персонажей, их характеристики, биографии и связи. Привяжите хроники и события."
                        />
                        <StepCard
                            step="3"
                            title="Погрузиться"
                            icon={<Share2 size={18} />}
                            text="Используйте ChronicleCraft как опору при написании: проверяйте факты, отношения, таймлайн и детали."
                        />
                    </div>
                </section>

                <section className="mt-10">
                    <div className="relative overflow-hidden rounded-3xl border border-[#c2a77466] bg-gradient-to-r from-[#141f16] via-[#1b261c] to-[#141f16] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-[#c2a77422] blur-3xl" />
                        <div className="space-y-3 max-w-xl relative z-10 text-center md:text-left">
                            <h2 className="text-2xl md:text-3xl font-garamond font-bold text-[#e5d9a5] flex items-center gap-2 justify-center md:justify-start">
                                <Sparkles className="text-[#c2a774]" />
                                Готовы открыть портал в свой мир?
                            </h2>
                            <p className="text-sm md:text-base text-[#d6c5a2] font-lora">
                                ChronicleCraft поможет вам не утонуть в собственном лоре, держать
                                персонажей под контролем и не забывать важные детали сюжетов.
                            </p>
                        </div>
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <Button
                                onClick={onLoginClick}
                                className="px-7 py-3 rounded-xl w-full bg-gradient-to-r from-[#c2a774] to-[#e5d9a5] 
                                    text-[#223120] hover:from-[#e5d9a5] hover:to-[#fffbe6] shadow-[0_0_30px_#c2a77466] font-lora text-lg 
                                    transition border border-[#c2a774] flex items-center justify-center gap-2"
                            >
                                Войти в ChronicleCraft
                            </Button>
                            <span className="text-[11px] text-[#c7bc98] font-lora">
                                Всегда можно начать с одного персонажа.
                            </span>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

const SectionTitle = ({
    eyebrow,
    title,
}: {
    eyebrow: string;
    title: string;
}) => (
    <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3a4a34] bg-[#101712]/80 text-[11px] md:text-xs font-lora text-[#c7bc98] uppercase tracking-[0.18em]">
            <span className="w-1 h-1 rounded-full bg-[#c2a774]" />
            <span>{eyebrow}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-garamond font-bold text-[#e5d9a5]">
            {title}
        </h2>
    </div>
);

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
        <div className="p-5 rounded-xl bg-[#223120]/60 border border-[#3a4a34] shadow-sm hover:bg-[#223120]/80 hover:-translate-y-1 hover:shadow-[0_0_25px_#000] transition duration-300">
            <div className="flex justify-center mb-3">{icon}</div>
            <h3 className="font-garamond text-xl text-[#e5d9a5] mb-2 text-center">{title}</h3>
            <p className="text-[#d6c5a2] text-sm font-lora leading-snug text-center">
                {text}
            </p>
        </div>
    );
};

const PreviewCard = ({
    label,
    description,
}: {
    label: string;
    description: string;
}) => (
    <div className="rounded-2xl border border-[#3a4a34] bg-[#141f16]/90 shadow-md overflow-hidden hover:-translate-y-1 hover:shadow-[0_0_30px_#000] transition duration-300">
        <div className="h-32 md:h-40 bg-gradient-to-br from-[#c2a77433] via-[#223120] to-[#0b1510] relative overflow-hidden">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,#c2a77433,transparent_50%),radial-gradient(circle_at_80%_80%,#c2a77422,transparent_55%)]" />
            <div className="absolute bottom-2 left-3 text-xs md:text-sm font-lora text-[#f4e9c7] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c2a774]" />
                <span>{label}</span>
            </div>
        </div>
        <div className="p-4 text-sm text-[#d6c5a2] font-lora leading-snug">
            {description}
        </div>
    </div>
);

const StepCard = ({
    step,
    title,
    icon,
    text,
}: {
    step: string;
    title: string;
    icon: React.ReactNode;
    text: string;
}) => (
    <div className="relative p-5 rounded-2xl border border-[#3a4a34] bg-[#141f16]/90 shadow-sm overflow-hidden">
        <div className="absolute -top-6 -right-4 w-16 h-16 rounded-full bg-[#c2a77422] blur-2xl" />
        <div className="relative flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border border-[#c2a77488] flex items-center justify-center text-sm font-garamond text-[#c2a774]">
                        {step}
                    </div>
                    <h3 className="text-base md:text-lg font-garamond text-[#e5d9a5] flex items-center gap-2">
                        {icon}
                        {title}
                    </h3>
                </div>
            </div>
            <p className="text-xs md:text-sm text-[#d6c5a2] font-lora leading-snug">
                {text}
            </p>
        </div>
    </div>
);

const HeroStat = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl border border-[#3a4a34] bg-[#101712]/80 px-3 py-2 text-left">
        <div className="text-[11px] md:text-xs uppercase tracking-[0.16em] text-[#c7bc98] font-lora">
            {label}
        </div>
        <div className="text-xs md:text-sm text-[#e5d9a5] font-lora mt-1">
            {value}
        </div>
    </div>
);

const FakeRow = ({ name, tag }: { name: string; tag: string }) => (
    <div className="flex items-center justify-between bg-[#101712] rounded-lg px-2 py-1.5 border border-[#2f3f2c]">
        <span className="truncate">{name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#c2a77422] text-[#e5d9a5]">
            {tag}
        </span>
    </div>
);

const TagPill = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#223120] border border-[#3a4a34] text-[#d6c5a2]">
        {children}
    </span>
);