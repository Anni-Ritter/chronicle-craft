import { useEffect, useRef, useState } from 'react';

let deferredPrompt: any = null;

export function InstallPwaButton() {
    const ref = useRef<HTMLButtonElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        function onBeforeInstall(e: any) {
            e.preventDefault();
            deferredPrompt = e;
            setVisible(true);
        }
        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    }, []);

    async function handleClick() {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <button
            ref={ref}
            onClick={handleClick}
            className="px-3 py-2 rounded-lg text-[color:var(--cc-accent)] hover:bg-[color:var(--cc-accent-hover)] transition"
        >
            Установить
        </button>
    );
}
