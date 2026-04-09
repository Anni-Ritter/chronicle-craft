import { Globe2, Users, Map, Languages, Sparkles, BookOpen, Mountain } from "lucide-react";
import type { World } from "../types/world";
import type { JSX } from "react";

interface Props {
    details: World["details"];
}

export const WorldDetailsBlock = ({ details }: Props) => {
    if (!details) return null;

    const Section = ({
        title,
        icon,
        children,
    }: { title: string; icon: JSX.Element; children: any }) => (
        <section className="rounded-xl px-1 py-1 md:px-2 md:py-2 space-y-2">
            <h3 className="flex items-center gap-2 text-lg md:text-xl font-semibold text-[#e5d9a5]">
                {icon}
                {title}
            </h3>
            <div className="text-[#c7bc98] text-sm md:text-base space-y-2">{children}</div>
        </section>
    );

    const List = ({ arr }: { arr: string[] }) => (
        <ul className="list-disc ml-5 space-y-1">
            {arr.map((item, idx) => (
                <li key={idx}>{item}</li>
            ))}
        </ul>
    );

    return (
        <div className="space-y-6">
            {details.continents?.length ? (
                <Section title="Материки" icon={<Mountain className="w-5 h-5 text-[#c2a774]" />}>
                    <List arr={details.continents} />
                </Section>
            ) : null}

            {details.climateZones?.length ? (
                <Section title="Климатические зоны" icon={<Sparkles className="w-5 h-5 text-[#c2a774]" />}>
                    <List arr={details.climateZones} />
                </Section>
            ) : null}

            {details.landmarks?.length ? (
                <Section title="Знаковые объекты" icon={<Map className="w-5 h-5 text-[#c2a774]" />}>
                    <List arr={details.landmarks} />
                </Section>
            ) : null}

            {details.countries?.length ? (
                <Section title="Страны" icon={<Globe2 className="w-5 h-5 text-[#c2a774]" />}>
                    <div className="space-y-3">
                        {details.countries.map((c, i) => (
                            <div
                                key={i}
                                className="rounded-lg bg-[#141f16]/55 px-3 py-2.5 space-y-1"
                            >
                                <p className="text-[#e5d9a5] font-semibold text-base">{c.name}</p>
                                {c.capital && <p>Столица: {c.capital}</p>}
                                {c.government && <p>Правление: {c.government}</p>}
                                {c.description && <p className="italic text-[#c7bc98]">{c.description}</p>}
                            </div>
                        ))}
                    </div>
                </Section>
            ) : null}

            {details.races?.length ? (
                <Section title="Расы" icon={<Users className="w-5 h-5 text-[#c2a774]" />}>
                    <div className="space-y-3">
                        {details.races.map((r, i) => (
                            <div
                                key={i}
                                className="rounded-lg bg-[#141f16]/55 px-3 py-2.5 space-y-1"
                            >
                                <p className="text-[#e5d9a5] font-semibold text-base">{r.name}</p>
                                {r.description && <p>{r.description}</p>}
                                {r.region && (
                                    <p className="text-xs text-[#c7bc98] italic">Область: {r.region}</p>
                                )}
                                {r.traits?.length ? <List arr={r.traits} /> : null}
                            </div>
                        ))}
                    </div>
                </Section>
            ) : null}

            {details.languages?.length ? (
                <Section title="Языки" icon={<Languages className="w-5 h-5 text-[#c2a774]" />}>
                    <div className="space-y-3">
                        {details.languages.map((l, i) => (
                            <div
                                key={i}
                                className="rounded-lg bg-[#141f16]/55 px-3 py-2.5 space-y-1"
                            >
                                <p className="text-[#e5d9a5] font-semibold">{l.name}</p>
                                {l.script && <p>Письменность: {l.script}</p>}
                                {l.spokenIn?.length ? (
                                    <p className="text-xs text-[#c7bc98]">
                                        Используется: {l.spokenIn.join(", ")}
                                    </p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </Section>
            ) : null}

            {details.myths?.length ? (
                <Section title="Мифы" icon={<BookOpen className="w-5 h-5 text-[#c2a774]" />}>
                    <List arr={details.myths} />
                </Section>
            ) : null}

            {details.magicSystem ? (
                <Section title="Магическая система" icon={<Sparkles className="w-5 h-5 text-[#c2a774]" />}>
                    <p>Источник: {details.magicSystem.source}</p>
                    <p>Типы: {details.magicSystem.types?.join(", ")}</p>
                    <p>Доступность: {details.magicSystem.accessibility}</p>
                    {details.magicSystem.limitations && (
                        <p>Ограничения: {details.magicSystem.limitations}</p>
                    )}
                </Section>
            ) : null}
        </div>
    );
};
