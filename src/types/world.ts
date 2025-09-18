export interface World {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    created_at: string;
    calendar?: {
        daysInWeek: number;
        monthsInYear: number;
        daysInMonth?: number[];
        customWeekNames?: string[];
        customMonthNames?: string[];
        currentYear?: number;
        epochStart?: { //начало эпохи (отправная точка летоисчисления)
            day: number;
            month: number;
            year: number;
        };
        timeUnitNames?: { //альтернативные названия единиц времени (день, неделя и т.д.).
            day?: string;
            week?: string;
            month?: string;
            year?: string;
        };
        phases?: { // фазы (например, луны, времён года, магических циклов)
            name: string;
            color?: string;
            fromDay: number;
            toDay: number;
            description?: string;
        }[];
        keyDates?: { //значимые даты (праздники, события), возможно связанные с хрониками
            name: string;
            day: number;
            month: number;
            description?: string;
            repeatEachYear?: boolean;
            linkedChronicleId?: string;
        }[];
    };
    details?: {
        continents?: string[];
        countries?: {
            name: string;
            capital?: string;
            government?: string;
            description?: string;
            alliances?: string[];
            enemies?: string[];
        }[];
        climateZones?: string[];
        landmarks?: string[]; //знаменитые объекты: горы, башни, руины и т.д.
        races?: {
            name: string;
            description?: string;
            traits?: string[]; //уникальные особенности или способности
            region?: string; //типичные области обитания
        }[];
        populationDistribution?: string; //описание плотности и расселения населения
        languages?: {
            name: string;
            script?: string; //тип письменности
            spokenIn?: string[]; //страны или регионы, где используется
        }[];
        pantheon?: { //список богов
            name: string;
            domain: string; //область власти
            symbol?: string; //символ
            alignment?: string; //моральная сторона (добро, зло, нейтрал)
            description?: string;
        }[];
        religions?: {
            name: string;
            beliefs: string; //во что верят
            rituals?: string[];
            influence?: string[]; //на какие области или страны влияет
        }[];
        myths?: string[];
        magicSystem?: {
            source: string; //источник силы (эфир, духи, ритуалы)
            types: string[];
            accessibility: string; //кто может использовать магию
            limitations?: string; //ограничения или цена
        };
        artifacts?: {
            name: string;
            power: string; //описание силы
            history?: string;
        }[];
        technologyLevel?: string;
        techVsMagic?: string;
        socialHierarchy?: string; //касты, классы, социальные роли.
        economy?: string;
        currencies?: { //валюты
            name: string;
            symbol: string;
            valueRelative?: string; //по отношению к золоту или другим валютам
        }[];
        laws?: string[]; //ключевые законы мира
        organizations?: { //фракции
            name: string;
            type: string; //тип (организация, клан, гильдия, фракция)
            influence?: string; //влияние на общество
        }[];
        planesOfExistence?: string[]; //иные измерения или планы (астральный, преисподняя и т.д.).
        magicalPhenomena?: string[]; //уникальные магические явления (кометы, искажения)
        corruptionZones?: string[]; //области с заражением, тьмой, хаосом.
        themes?: string[]; //центральные темы мира (например: «упадок», «восстание», «тайна»).
        inspirationSources?: string[]; //культуры, истории или миры, послужившие вдохновением.
        worldMapImage?: string;
        visualStyle?: {
            architecture?: string; //стиль построек.
            clothing?: string; //стиль одежды.
            colors?: string[]; //основные цвета мира
        };
    }
}
