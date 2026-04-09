import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface StorageImageUploaderProps {
    onUpload: (url: string) => void;
    initialUrl?: string;
    bucket: string;
    pathPrefix?: string;
    emptyLabel?: string;
    previewClassName?: string;
}

export const StorageImageUploader = ({
    onUpload,
    initialUrl,
    bucket,
    pathPrefix = "",
    emptyLabel = "Загрузить изображение",
    previewClassName = "h-36 w-full rounded-xl object-cover border border-[#3a4a34]",
}: StorageImageUploaderProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(initialUrl ?? null);

    useEffect(() => {
        setPreview(initialUrl ?? null);
    }, [initialUrl]);

    const handleFileChange = async () => {
        const file = inputRef.current?.files?.[0];
        if (!file) return;
        setUploading(true);
        const ext = file.name.split(".").pop() ?? "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const filePath = pathPrefix ? `${pathPrefix}/${fileName}` : fileName;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, { upsert: false });

        if (uploadError) {
            alert(`Ошибка загрузки: ${uploadError.message}`);
            setUploading(false);
            return;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        if (data.publicUrl) {
            setPreview(data.publicUrl);
            onUpload(data.publicUrl);
        }
        setUploading(false);
    };

    return (
        <div className="space-y-2">
            <button
                type="button"
                className="w-full text-left"
                onClick={() => !uploading && inputRef.current?.click()}
            >
                {preview ? (
                    <img src={preview} alt="" className={previewClassName} />
                ) : (
                    <div className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-[#3a4a34] bg-[#0b1510] text-sm text-[#c7bc98]">
                        {emptyLabel}
                    </div>
                )}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
            />
            {uploading && <p className="text-xs text-[#c7bc98]">Загрузка...</p>}
        </div>
    );
};
