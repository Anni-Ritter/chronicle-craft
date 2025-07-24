export const formatWorldDate = (
    rawDate: string,
    calendar?: {
        customMonthNames?: string[];
    }
): string => {
    if (!rawDate || !/^\d{2}\|\d{2}\|\d+$/.test(rawDate)) return rawDate;

    const [dd, mm, yyyy] = rawDate.split('|');
    const day = parseInt(dd, 10);
    const monthIndex = parseInt(mm, 10) - 1;
    const year = parseInt(yyyy, 10);

    if (
        isNaN(day) || isNaN(monthIndex) || isNaN(year) ||
        monthIndex < 0 || day < 1
    ) {
        return rawDate;
    }

    const monthNames = calendar?.customMonthNames ?? [
        'месяц 1', 'месяц 2', 'месяц 3', 'месяц 4', 'месяц 5', 'месяц 6',
        'месяц 7', 'месяц 8', 'месяц 9', 'месяц 10', 'месяц 11', 'месяц 12',
    ];

    const monthName = monthNames[monthIndex] || `месяц ${monthIndex + 1}`;

    return `${day} ${monthName} ${year}`;
};
