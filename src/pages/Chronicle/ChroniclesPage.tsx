import React, { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { ChronicleForm } from '../../features/chronicle/ChronicleForm';
import { ChronicleViewSwitcher } from '../../features/chronicle/ChronicleViewSwitcher';

export const ChroniclesPage: React.FC = () => {
    const [showForm, setShowForm] = useState(false);
    const supabase = useSupabaseClient();

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Хроники мира</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    {showForm ? 'Отмена' : '➕ Добавить хронику'}
                </button>
            </div>

            {showForm && (
                <div className="mb-8">
                    <ChronicleForm
                        onFinish={() => setShowForm(false)}
                        supabase={supabase}
                    />
                </div>
            )}

            <ChronicleViewSwitcher />
        </div>
    );
};
