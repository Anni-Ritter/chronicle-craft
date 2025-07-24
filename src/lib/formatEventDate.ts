export const formatEventDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '??.??.???';

    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
        const date = new Date(parsed);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    }

    const parts = dateStr.split('|');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${day?.padStart(2, '0')}.${month?.padStart(2, '0')}.${year}`;
    }

    return dateStr;
};
