export const getDominantColorFromImage = async (imageUrl: string): Promise<string | null> => {
    try {
        const img = await fetch(imageUrl, { mode: 'cors' }).then(res => res.blob());
        const imageBitmap = await createImageBitmap(img);

        const canvas = document.createElement('canvas');
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(imageBitmap, 0, 0);

        const w = canvas.width;
        const h = canvas.height;

        const { data } = ctx.getImageData(
            w * 0.25, h * 0.25,
            w * 0.5, h * 0.5
        );

        const colorMap = new Map<string, number>();

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (a < 128) continue;

            const key = `${r},${g},${b}`;
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        const dominant = [...colorMap.entries()].reduce((a, b) => (b[1] > a[1] ? b : a));
        return `rgb(${dominant[0]})`;
    } catch (err) {
        console.error('Failed to extract dominant color:', err);
        return null;
    }
};
