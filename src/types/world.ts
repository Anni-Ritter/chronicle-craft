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
        epochStart?: {
            day: number;
            month: number;
            year: number;
        };
        timeUnitNames?: {
            day?: string;
            week?: string;
            month?: string;
            year?: string;
        };
        phases?: {
            name: string;
            color?: string;
            fromDay: number;
            toDay: number;
            description?: string;
        }[];
        keyDates?: {
            name: string;
            day: number;
            month: number;
            description?: string;
            repeatEachYear?: boolean;
            linkedChronicleId?: string;
        }[];
    };

}
