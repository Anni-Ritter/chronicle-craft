import { useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface AvatarUploaderProps {
    onUpload: (url: string) => void;
    initialUrl?: string;
}

export const AvatarUploader = ({ onUpload, initialUrl }: AvatarUploaderProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(initialUrl ?? null);

    const handleFileChange = async () => {
        const file = inputRef.current?.files?.[0];
        if (!file) return;

        setUploading(true);
        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}.${ext}`;

        const { error } = await supabase.storage
            .from("avatars")
            .upload(fileName, file);

        if (error) {
            alert("Ошибка загрузки: " + error.message);
            setUploading(false);
            return;
        }

        const { data } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName);

        if (data?.publicUrl) {
            setPreview(data.publicUrl);
            onUpload(data.publicUrl);
        }

        setUploading(false);
    };

    return (
        <div>
            {preview && (
                <img
                    src={preview}
                    alt="Аватар"
                    className="w-32 h-32 rounded-full object-cover border mb-2"
                />
            )}
            <input
                type="file"
                accept="image/*"
                ref={inputRef}
                onChange={handleFileChange}
                disabled={uploading}
            />
            {uploading && <p className="text-sm text-gray-500">Загрузка...</p>}
        </div>
    );
};
