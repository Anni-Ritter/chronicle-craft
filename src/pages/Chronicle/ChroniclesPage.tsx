import { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { ChronicleForm } from '../../features/chronicle/ChronicleForm';
import { ChronicleViewSwitcher } from '../../features/chronicle/ChronicleViewSwitcher';
import { Modal } from '../../components/Modal';
import { BookMarked, CirclePlus, Search } from 'lucide-react';
import { Button } from '../../components/ChronicleButton';
import { useWorldStore } from '../../store/useWorldStore';

export const ChroniclesPage = () => {
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const supabase = useSupabaseClient();
    const { fetchWorlds } = useWorldStore();
    const session = useSession();

    useEffect(() => {
        if (session?.user?.id) {
            fetchWorlds(session.user.id, supabase);
        }
    }, [session]);
    return (
        <div className='max-w-[1440px] mx-auto mt-10 px-2 md:px-4 space-y-10'>
            <div className="flex justify-between items-center border-b border-[#c2a774] pb-4">
                <h2 className="text-3xl flex flex-row gap-2 items-center font-garamond text-[#e5d9a5]"><BookMarked /> Хроники мира</h2>
                <Button onClick={() => setShowForm(true)} icon={<CirclePlus size={18} />} className='max-sm:gap-0'><span className='hidden md:block'>Добавить</span></Button>
            </div>
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0e1b12]/50 w-5 h-5 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Поиск..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-3 rounded-lg w-full bg-[#D6C5A2] text-[#0E1B12] border border-[#0E1B12] placeholder:text-[18px] placeholder:text-[#0e1b12]/50"
                />
            </div>

            <ChronicleViewSwitcher searchTerm={searchTerm} />

            <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
                <ChronicleForm onFinish={() => setShowForm(false)} supabase={supabase} />
            </Modal>
        </div>
    );
};
