import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface AvatarUploaderProps {
    onUpload: (url: string) => void;
    initialUrl?: string;
    bucket?: string;
    pathPrefix?: string;
}

export const AvatarUploader = ({ onUpload, initialUrl, bucket = 'avatars', pathPrefix = '', }: AvatarUploaderProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
    const previousUrlRef = useRef<string | null>(initialUrl ?? null);
    useEffect(() => {
        setPreview(initialUrl ?? null);
    }, [initialUrl]);

    const handleFileChange = async () => {
        const file = inputRef.current?.files?.[0];
        if (!file) return;

        setUploading(true);
        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}.${ext}`;
        const filePath = pathPrefix ? `${pathPrefix}/${fileName}` : fileName;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, { upsert: false });

        if (uploadError) {
            alert("Ошибка загрузки: " + uploadError.message);
            setUploading(false);
            return;
        }

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

        if (urlData?.publicUrl) {
            setPreview(urlData.publicUrl);
            onUpload(urlData.publicUrl);

            if (previousUrlRef.current) {
                const oldPath = previousUrlRef.current.split(`${bucket}/`)[1];
                if (oldPath) {
                    await supabase.storage.from(bucket).remove([oldPath]);
                    console.log("Удалён старый файл:", oldPath);
                }
            }

            previousUrlRef.current = urlData.publicUrl;
        }
        setUploading(false);
    };

    const handleClick = () => {
        if (!uploading) {
            inputRef.current?.click();
        }
    };

    return (
        <div className="relative w-32 h-32 group cursor-pointer" onClick={handleClick}>
            {preview ? (
                <img
                    src={preview}
                    alt="Аватар"
                    className="w-full h-full rounded-full object-cover border border-gray-300"
                />
            ) : (
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center border border-gray-300 text-gray-500 text-sm">
                    Нет аватара
                </div>
            )}

            <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
                📷
                <span className="text-white text-sm flex items-center gap-1">
                    Изменить
                </span>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
            />

            {uploading && (
                <p className="text-center mt-2 text-xs text-gray-500">Загрузка...</p>
            )}
        </div>
    );
};
