import { useEffect, useState } from 'react';

/** true при ширине до breakpoint lg — модалка как bottom sheet */
export function useIsMobileSheet() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1023px)');
        const apply = () => setIsMobile(mq.matches);
        apply();
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);

    return isMobile;
}
