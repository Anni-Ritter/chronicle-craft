import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface AvatarUploaderProps {
    onUpload: (url: string) => void;
    initialUrl?: string;
    bucket?: string;
    pathPrefix?: string;
}

export const AvatarUploader = ({
    onUpload,
    initialUrl,
    bucket = "avatars",
    pathPrefix = "",
}: AvatarUploaderProps) => {
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
        <div className="inline-flex flex-col items-center gap-2">
            <div
                className="relative group cursor-pointer"
                onClick={handleClick}
            >
                {preview ? (
                    <img
                        src={preview}
                        alt="Аватар"
                        className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-full border border-[#c2a774] shadow-[0_0_18px_#000]"
                    />
                ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#0b1510] border border-[#3a4a34] flex flex-col items-center justify-center text-[11px] text-[#c7bc98] shadow-[0_0_18px_#000]">
                        <span className="text-lg mb-1">📷</span>
                        <span className="leading-tight text-center px-2">
                            Добавить аватар
                        </span>
                    </div>
                )}

                <div className="absolute inset-0 bg-black/55 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <span className="text-sm">📷</span>
                    <span className="text-[11px] text-[#f5e9c6] mt-0.5">
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
            </div>

            {uploading && (
                <p className="text-center text-[11px] text-[#c7bc98]">
                    Загрузка...
                </p>
            )}
        </div>
    );
};
