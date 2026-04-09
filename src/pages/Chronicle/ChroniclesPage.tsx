import { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { ChronicleForm } from '../../features/chronicle/ChronicleForm';
import { ChronicleViewSwitcher } from '../../features/chronicle/ChronicleViewSwitcher';
import { Modal } from '../../components/Modal';
import { BookMarked, CirclePlus } from 'lucide-react';
import { Button } from '../../components/ChronicleButton';
import { useWorldStore } from '../../store/useWorldStore';

export const ChroniclesPage = () => {
    const [showForm, setShowForm] = useState(false);
    const supabase = useSupabaseClient();
    const { fetchWorlds } = useWorldStore();
    const session = useSession();

    useEffect(() => {
        if (session?.user?.id) {
            fetchWorlds(session.user.id, supabase);
        }
    }, [session, fetchWorlds, supabase]);
    return (
        <div className='max-w-[1440px] mx-auto mt-10 px-2 md:px-4 space-y-4 md:space-y-10'>
            <div className="flex flex-col gap-3 border-b border-[#c2a774]/70 pb-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <h2 className="text-4xl md:text-5xl flex items-center gap-2 font-garamond text-[#e5d9a5]">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1b261a] border border-[#c2a77466] shadow-[0_0_18px_#000] text-[#c2a774]">
                            <BookMarked className="w-5 h-5" />
                        </span>
                        Хроники мира
                    </h2>
                    <p className="text-base text-[#c7bc98] font-lora max-w-2xl leading-relaxed">
                        События, летописи и тайные записи — история вашего мира в хронологии.
                    </p>
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    icon={<CirclePlus size={20} className="max-lg:shrink-0" />}
                    className="w-full justify-center gap-2 shadow-[0_4px_20px_rgba(194,167,116,0.2)] md:self-center lg:w-auto"
                >
                    Добавить запись
                </Button>
            </div>
            <ChronicleViewSwitcher />

            <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
                <ChronicleForm onFinish={() => setShowForm(false)} supabase={supabase} />
            </Modal>
        </div>
    );
};
