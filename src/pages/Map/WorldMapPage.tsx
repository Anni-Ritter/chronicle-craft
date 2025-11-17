import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { v4 as uuidv4 } from 'uuid';

import type { MapPoint } from '../../types/mapPoint';
import type { IconType } from '../../types/mapPoint';
import { useMapStorePoint } from '../../store/useMapStorePoint';
import type { DBMap } from '../../types/DBMap';
import { useParams } from 'react-router-dom';
import { MapPointModal } from '../../features/map/MapPointModal';
import { CreateMapPointModal } from '../../features/map/CreateMapPointModal';
import Table from "../../assets/black-wooden-background.png";
import { Church, Gem, Landmark, MapIcon, Tent, ZoomIn, ZoomOut, RefreshCcw, Sparkles, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Button } from '../../components/ChronicleButton';

export const WorldMapPage = () => {
    const supabase = useSupabaseClient();
    const session = useSession();
    const { mapId } = useParams();
    const containerRef = useRef<HTMLDivElement>(null);
    const ignoreNextClickRef = useRef(false);

    const { mapPoints, fetchMapPoints, addMapPoint } = useMapStorePoint();
    const [map, setMap] = useState<DBMap | null>(null);
    const [mapUrl, setMapUrl] = useState<string | null>(null);
    const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [startDrag, setStartDrag] = useState<{ x: number; y: number } | null>(null);
    const [isGrabbing, setIsGrabbing] = useState(false);
    const [newPointCoords, setNewPointCoords] = useState<{ x: number; y: number } | null>(null);
    const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
    const [isLegendOpen, setIsLegendOpen] = useState(true);
    const pinchStartRef = useRef<number | null>(null);
    const pinchScaleStartRef = useRef<number | null>(null);

    const getPinchDistance = (e: React.TouchEvent) => {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const minScale = useMemo(() => {
        if (!imageSize || !containerSize) return 0.5;
        const scaleX = containerSize.width / imageSize.width;
        const scaleY = containerSize.height / imageSize.height;
        return Math.min(scaleX, scaleY);
    }, [imageSize, containerSize]);

    useEffect(() => {
        if (mapId && session?.user?.id) {
            loadMap(mapId);
            fetchMapPoints(mapId, supabase);
        }
    }, [mapId, session]);

    useEffect(() => {
        const updateContainerSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        updateContainerSize();
        window.addEventListener('resize', updateContainerSize);
        return () => window.removeEventListener('resize', updateContainerSize);
    }, []);

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setDragging(false);
            setStartDrag(null);
            setIsGrabbing(false);
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);
    useEffect(() => {
        if (!mapUrl) return;
    }, [mapUrl]);
    useEffect(() => {
        if (!imageSize || !containerSize) return;

        const scaledWidth = imageSize.width * scale;
        const scaledHeight = imageSize.height * scale;

        const shouldCenterX = scaledWidth <= containerSize.width;
        const shouldCenterY = scaledHeight <= containerSize.height;

        setOffset((prev) => {
            const x = shouldCenterX
                ? (containerSize.width - scaledWidth) / 2
                : Math.min(Math.max(prev.x, containerSize.width - scaledWidth), 0);

            const y = shouldCenterY
                ? (containerSize.height - scaledHeight) / 2
                : Math.min(Math.max(prev.y, containerSize.height - scaledHeight), 0);

            return { x, y };
        });
    }, [scale, imageSize, containerSize]);

    const loadMap = async (id: string) => {
        const { data, error } = await supabase
            .from('maps')
            .select('*')
            .eq('id', id)
            .single();

        if (!error && data) {
            setMap(data as DBMap);
            const { data: publicUrl } = supabase.storage.from('map').getPublicUrl(data.image_path);
            setMapUrl(publicUrl.publicUrl);
        } else {
            setMap(null);
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheelEvent = (e: WheelEvent) => {
            e.preventDefault();

            if (!containerRef.current || !imageSize) return;

            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const prevScale = scale;
            const delta = -e.deltaY / 500;
            const newScale = Math.min(Math.max(prevScale + delta, minScale), 4);

            const scaleFactor = newScale / prevScale;

            const newOffsetX = (offset.x - mouseX) * scaleFactor + mouseX;
            const newOffsetY = (offset.y - mouseY) * scaleFactor + mouseY;

            setScale(newScale);
            setOffset(clampOffset({ x: newOffsetX, y: newOffsetY }));
        };

        container.addEventListener('wheel', handleWheelEvent, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheelEvent);
        };
    }, [scale, offset, minScale, imageSize]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        setStartDrag({ x: e.clientX, y: e.clientY });
        setIsGrabbing(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging || !startDrag) return;

        const dx = e.clientX - startDrag.x;
        const dy = e.clientY - startDrag.y;

        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
            ignoreNextClickRef.current = true;
        }

        setStartDrag({ x: e.clientX, y: e.clientY });
        setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }));
    };

    const handleMouseUp = () => {
        setDragging(false);
        setStartDrag(null);
        setIsGrabbing(false);
    };

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (
            ignoreNextClickRef.current ||
            !map ||
            !session?.user?.id ||
            !imageSize ||
            !containerRef.current
        ) {
            ignoreNextClickRef.current = false;
            return;
        }

        const imgElement = containerRef.current.querySelector('img');
        if (!imgElement) return;

        const imgRect = imgElement.getBoundingClientRect();
        const relativeX = (e.clientX - imgRect.left) / imgRect.width;
        const relativeY = (e.clientY - imgRect.top) / imgRect.height;

        if (relativeX < 0 || relativeX > 1 || relativeY < 0 || relativeY > 1) return;

        setNewPointCoords({ x: relativeX, y: relativeY });
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            setDragging(true);
            setStartDrag({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        }

        if (e.touches.length === 2) {
            setDragging(false);
            pinchStartRef.current = getPinchDistance(e);
            pinchScaleStartRef.current = scale;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && dragging && startDrag) {
            const dx = e.touches[0].clientX - startDrag.x;
            const dy = e.touches[0].clientY - startDrag.y;

            setStartDrag({ x: e.touches[0].clientX, y: e.touches[0].clientY });
            setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }));
        }

        if (e.touches.length === 2) {
            const pinchCurrent = getPinchDistance(e);
            if (pinchStartRef.current && pinchScaleStartRef.current && containerRef.current) {
                const delta = pinchCurrent / pinchStartRef.current;
                const newScale = Math.min(Math.max(pinchScaleStartRef.current * delta, minScale), 4);
                const scaleFactor = newScale / scale;
                const rect = containerRef.current.getBoundingClientRect();
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
                const newOffsetX = (offset.x - centerX) * scaleFactor + centerX;
                const newOffsetY = (offset.y - centerY) * scaleFactor + centerY;

                setScale(newScale);
                setOffset(clampOffset({ x: newOffsetX, y: newOffsetY }));
            }
        }
    };

    const handleTouchEnd = () => {
        setDragging(false);
        setStartDrag(null);
        pinchStartRef.current = null;
        pinchScaleStartRef.current = null;
    };

    const clampOffset = (newOffset: { x: number; y: number }) => {
        if (!imageSize || !containerSize) return newOffset;

        const scaledWidth = imageSize.width * scale;
        const scaledHeight = imageSize.height * scale;

        const minX = Math.min(0, containerSize.width - scaledWidth);
        const minY = Math.min(0, containerSize.height - scaledHeight);

        const maxX = 0;
        const maxY = 0;

        return {
            x: Math.min(Math.max(newOffset.x, minX), maxX),
            y: Math.min(Math.max(newOffset.y, minY), maxY),
        };
    };

    const handleZoomIn = (e: React.MouseEvent) => {
        e.stopPropagation();
        setScale((prev) => Math.min(prev + 0.2, 4));
        setOffset((prev) => clampOffset(prev));
    };

    const handleZoomOut = (e: React.MouseEvent) => {
        e.stopPropagation();
        setScale((prev) => Math.max(prev - 0.2, minScale));
        setOffset((prev) => clampOffset(prev));
    };

    const handleResetView = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!imageSize || !containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;

        const scaleX = containerWidth / imageSize.width;
        const scaleY = containerHeight / imageSize.height;
        const bestFitScale = Math.min(scaleX, scaleY);

        setScale(bestFitScale);
        const offsetX = (containerWidth - imageSize.width * bestFitScale) / 2;
        const offsetY = (containerHeight - imageSize.height * bestFitScale) / 2;
        setOffset({ x: offsetX, y: offsetY });
    };

    if (!map) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-b from-[#040806] via-[#0b1510] to-[#040806] flex items-center justify-center px-4">
                <div className="max-w-md w-full rounded-3xl border border-[#c2a77466] bg-[#111b13]/90 p-6 text-center shadow-[0_0_32px_rgba(0,0,0,0.9)] text-[#e5d9a5] font-lora space-y-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-[#c2a77466] bg-[#151e16] mb-2">
                        <MapIcon className="w-6 h-6 text-[#c2a774]" />
                    </div>
                    <h2 className="text-xl font-garamond">Карта недоступна</h2>
                    <p className="text-sm text-[#c7bc98]">
                        Карта не найдена или вы не авторизованы. Попробуйте вернуться к списку миров и открыть
                        карту заново.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full text-[#e5d9a5]">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-16 -left-10 w-64 h-64 rounded-full bg-[#c2a77433] blur-3xl" />
                <div className="absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-[#c2a77422] blur-3xl" />
                <div className="absolute bottom-0 left-1/3 w-56 h-56 rounded-full bg-[#c2a7741a] blur-3xl" />
            </div>

            <main className="relative z-10 px-4 pt-10 pb-10 space-y-8 md:space-y-10">
                <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-[#c2a774]/60 pb-4">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3a4a34] bg-[#101712]/80 text-[11px] md:text-xs font-lora text-[#c7bc98] uppercase tracking-[0.18em]">
                            <span className="w-1 h-1 rounded-full bg-[#c2a774]" />
                            <span>Карта мира</span>
                        </div>
                        <div className="flex items-center flex-wrap gap-3">
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-garamond font-bold flex items-center gap-2">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1b261a] border border-[#c2a77466] shadow-[0_0_18px_#000] text-[#c2a774]">
                                    <MapIcon className="w-5 h-5" />
                                </span>
                                {map.name}
                            </h1>
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#44553e] bg-[#182216] px-2.5 py-0.5 text-[11px] text-[#c7bc98] font-lora">
                                <Sparkles className="w-3 h-3 text-[#c2a774]" />
                                Нажмите на карту, чтобы добавить точку
                            </span>
                        </div>
                    </div>
                    <div className="flex md:justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setIsLegendOpen((prev) => !prev)}
                            className="flex items-center gap-2 text-xs md:text-sm"
                        >
                            {isLegendOpen ? (
                                <div className='flex flex-row gap-2 items-center'>
                                    <PanelRightClose className="w-4 h-4" />
                                    Скрыть легенду
                                </div>
                            ) : (
                                <div className='flex flex-row gap-2 items-center'>
                                    <PanelRightOpen className="w-4 h-4" />
                                    Показать легенду
                                </div>
                            )}
                        </Button>
                    </div>
                </header>

                <section
                    className={`
                        grid gap-6 md:gap-8 items-stretch
                        ${isLegendOpen ? 'lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]' : 'lg:grid-cols-1'}
                    `}
                >
                    <div className="relative">
                        <div
                            ref={containerRef}
                            className={`relative w-full max-sm:max-w-[85vw] rounded-3xl border border-[#c2a77455] overflow-hidden shadow-[0_0_45px_#000] ${isGrabbing ? 'cursor-grabbing' : 'cursor-grab'
                                } bg-gray-200`}
                            style={{
                                width: '100%',
                                height: isLegendOpen ? '70vh' : '80vh',
                                backgroundImage: `url(${Table})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                touchAction: 'none',
                            }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onClick={handleMapClick}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-[40px] bg-gradient-to-b from-black/40 via-black/0 to-transparent z-10" />
                            <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
                                <Button
                                    onClick={handleZoomIn}
                                    className="h-8 w-8 p-0 flex items-center justify-center rounded-xl bg-[#101712]/90 border border-[#3a4a34] shadow-sm hover:bg-[#1b261b]"
                                    title="Приблизить"
                                >
                                    <ZoomIn className="w-4 h-4 text-[#e5d9a5]" />
                                </Button>
                                <Button
                                    onClick={handleZoomOut}
                                    className="h-8 w-8 p-0 flex items-center justify-center rounded-xl bg-[#101712]/90 border border-[#3a4a34] shadow-sm hover:bg-[#1b261b]"
                                    title="Отдалить"
                                >
                                    <ZoomOut className="w-4 h-4 text-[#e5d9a5]" />
                                </Button>
                                <Button
                                    onClick={handleResetView}
                                    className="h-8 w-8 p-0 flex items-center justify-center rounded-xl bg-[#101712]/90 border border-[#3a4a34] shadow-sm hover:bg-[#1b261b]"
                                    title="Сбросить вид"
                                >
                                    <RefreshCcw className="w-4 h-4 text-[#e5d9a5]" />
                                </Button>
                            </div>

                            {!isLegendOpen && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsLegendOpen(true);
                                    }}
                                    className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1 rounded-full bg-[#101712]/90 border border-[#3a4a34] px-3 py-1 text-[11px] text-[#e5d9a5] font-lora hover:bg-[#1b261b]"
                                >
                                    <PanelRightOpen className="w-3 h-3" />
                                    Легенда
                                </button>
                            )}

                            {mapUrl ? (
                                <div
                                    style={{
                                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                                        transformOrigin: 'top left',
                                        position: 'relative',
                                        display: 'inline-block',
                                        width: imageSize?.width ?? 'auto',
                                        height: imageSize?.height ?? 'auto',
                                    }}
                                >
                                    <img
                                        src={mapUrl}
                                        alt="Map"
                                        onLoad={(e) => {
                                            const img = e.currentTarget;
                                            const width = img.naturalWidth;
                                            const height = img.naturalHeight;
                                            setImageSize({ width, height });

                                            if (containerRef.current) {
                                                const containerWidth = containerRef.current.offsetWidth;
                                                const containerHeight = containerRef.current.offsetHeight;

                                                const scaleX = containerWidth / width;
                                                const scaleY = containerHeight / height;
                                                const bestFitScale = Math.min(scaleX, scaleY);
                                                setScale(bestFitScale);

                                                const offsetX = (containerWidth - width * bestFitScale) / 2;
                                                const offsetY = (containerHeight - height * bestFitScale) / 2;
                                                setOffset({ x: offsetX, y: offsetY });
                                            }
                                        }}
                                        style={{
                                            display: 'block',
                                            boxShadow: '0 0 60px rgba(0,0,0,0.3), 0 0 0 12px #a88d63',
                                            borderRadius: '16px',
                                        }}
                                        draggable={false}
                                    />

                                    {mapPoints.map((point) => (
                                        <div
                                            key={point.id}
                                            className="absolute group z-0"
                                            style={{
                                                left: `${point.x * 100}%`,
                                                top: `${point.y * 100}%`,
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedPoint(point);
                                            }}
                                        >
                                            <div className="relative group flex flex-col items-center">
                                                <div
                                                    className="transition-transform hover:scale-125 cursor-pointer text-[#c2a774] bg-[#0e1b12]/80 border border-[#c2a774] rounded-full p-1.5 shadow-md group-hover:shadow-lg"
                                                >
                                                    {point.icon_type === 'default' && <MapIcon size={28} />}
                                                    {point.icon_type === 'camp' && <Tent size={28} />}
                                                    {point.icon_type === 'city' && <Landmark size={28} />}
                                                    {point.icon_type === 'temple' && <Church size={28} />}
                                                    {point.icon_type === 'treasure' && <Gem size={28} />}
                                                </div>

                                                <span
                                                    className="absolute top-11 left-1/2 -translate-x-1/2 text-[11px] text-[#0e1b12] bg-[#f5f1e6] border border-[#c2a774] font-lora rounded px-2 py-[2px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-0 whitespace-nowrap"
                                                >
                                                    {point.name}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[#d6c5a2] font-lora text-sm">
                                    Карта не загружена
                                </div>
                            )}
                        </div>
                    </div>
                    {isLegendOpen && (
                        <aside className="space-y-4 lg:space-y-5">
                            <div className="rounded-2xl border border-[#3a4a34] bg-[#141f16]/90 shadow-md p-4 sm:p-5 font-lora space-y-3">
                                <h2 className="text-base md:text-lg font-garamond text-[#e5d9a5] flex items-center gap-2">
                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1b261a] border border-[#c2a77466] text-[#c2a774]">
                                        <MapIcon className="w-4 h-4" />
                                    </span>
                                    Легенда карты
                                </h2>
                                <p className="text-xs md:text-sm text-[#c7bc98]">
                                    Наведите курсор на значок, чтобы увидеть название точки. Клик по значку — подробности.
                                </p>

                                <ul className="mt-2 space-y-2 text-sm">
                                    <LegendItem
                                        icon={<MapIcon className="w-4 h-4 text-[#c2a774]" />}
                                        label="Обычная точка"
                                        text="Любая произвольная отметка на карте."
                                    />
                                    <LegendItem
                                        icon={<Tent className="w-4 h-4 text-[#c2a774]" />}
                                        label="Лагерь"
                                        text="Временные стоянки, лагеря, базы."
                                    />
                                    <LegendItem
                                        icon={<Landmark className="w-4 h-4 text-[#c2a774]" />}
                                        label="Город / поселение"
                                        text="Города, деревни, укреплённые точки."
                                    />
                                    <LegendItem
                                        icon={<Church className="w-4 h-4 text-[#c2a774]" />}
                                        label="Храм / святилище"
                                        text="Места силы, храмы, священные руины."
                                    />
                                    <LegendItem
                                        icon={<Gem className="w-4 h-4 text-[#c2a774]" />}
                                        label="Сокровище"
                                        text="Клады, артефакты, тайники."
                                    />
                                </ul>
                            </div>

                            <div className="rounded-2xl border border-[#3a4a34] bg-[#141f16]/90 shadow-md p-4 sm:p-5 font-lora space-y-3">
                                <h3 className="text-sm md:text-base font-garamond text-[#e5d9a5] flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#c2a774]" />
                                    Управление картой
                                </h3>
                                <ul className="text-xs md:text-sm text-[#c7bc98] space-y-1.5 list-disc pl-4">
                                    <li>Зажмите левую кнопку мыши, чтобы перетаскивать карту.</li>
                                    <li>Используйте колесо мыши или кнопки справа сверху, чтобы масштабировать.</li>
                                    <li>Клик по свободному месту на карте — создание новой точки.</li>
                                    <li>Клик по уже существующему значку — открытие подробной информации.</li>
                                </ul>
                            </div>
                        </aside>
                    )}
                </section>

                {selectedPoint && (
                    <MapPointModal point={selectedPoint} onClose={() => setSelectedPoint(null)} />
                )}

                {newPointCoords && (
                    <CreateMapPointModal
                        coords={newPointCoords}
                        onClose={() => setNewPointCoords(null)}
                        onSave={async (data: {
                            name: string;
                            description?: string;
                            iconType: IconType;
                        }) => {
                            const { name, description, iconType } = data;
                            if (!map || !session?.user?.id) return;
                            const newPoint: MapPoint = {
                                id: uuidv4(),
                                name,
                                description,
                                icon_type: iconType,
                                x: newPointCoords.x,
                                y: newPointCoords.y,
                                user_id: session.user.id,
                                map_id: map.id,
                                linked_characters: [],
                                linked_chronicles: [],
                                created_at: new Date().toISOString(),
                            };

                            await addMapPoint(newPoint, supabase);
                            setNewPointCoords(null);
                        }}
                    />
                )}
            </main>
        </div>
    );
};

const LegendItem = ({
    icon,
    label,
    text,
}: {
    icon: React.ReactNode;
    label: string;
    text: string;
}) => (
    <li className="flex items-start gap-2">
        <div className="mt-[2px] flex h-6 w-6 items-center justify-center rounded-full bg-[#1b261a] border border-[#3a4a34] shrink-0">
            {icon}
        </div>
        <div className="space-y-0.5">
            <div className="text-xs md:text-sm text-[#e5d9a5]">{label}</div>
            <p className="text-[11px] md:text-xs text-[#c7bc98]">{text}</p>
        </div>
    </li>
);
