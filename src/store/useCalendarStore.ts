import { create } from 'zustand';
import type { World } from '../types/world';

type Calendar = NonNullable<World['calendar']>;

interface CalendarState {
    calendar: Calendar;
    setCalendar: (data: Calendar) => void;
    updateField: <K extends keyof Calendar>(key: K, value: Calendar[K]) => void;
}

export const useCalendarStore = create<CalendarState>()((set) => ({
    calendar: {
        daysInWeek: 7,
        monthsInYear: 12,
        daysInMonth: [],
        customWeekNames: [],
        customMonthNames: [],
        epochStartDate: '',
        timeUnitNames: {
            day: 'день',
            week: 'неделя',
            month: 'месяц',
            year: 'год',
        },
        phases: [],
        keyDates: [],
    },
    setCalendar: (data) => set({ calendar: data }),
    updateField: (key, value) =>
        set((state) => ({ calendar: { ...state.calendar, [key]: value } })),
}));
