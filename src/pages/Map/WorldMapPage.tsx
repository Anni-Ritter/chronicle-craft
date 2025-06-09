import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { v4 as uuidv4 } from 'uuid';

import type { MapPoint } from '../../types/mapPoint';
import { useMapStorePoint } from '../../store/useMapStorePoint';
import type { DBMap } from '../../types/DBMap';
import { useParams } from 'react-router-dom';
import { MapPointModal } from '../../features/map/MapPointModal';
import { CreateMapPointModal } from '../../features/map/CreateMapPointModal';
import { getDominantColorFromImage } from '../../lib/GetDominantColorFromImage';

export const WorldMapPage: React.FC = () => {
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
    const [backgroundColor, setBackgroundColor] = useState<string>('#e0e0e0');
    const [newPointCoords, setNewPointCoords] = useState<{ x: number; y: number } | null>(null);
    const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
    const [transitioningBg, setTransitioningBg] = useState(false);
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
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    useEffect(() => {
        if (!mapUrl) return;

        setTransitioningBg(true);
        getDominantColorFromImage(mapUrl).then((color) => {
            if (color) setBackgroundColor(color);
            setTimeout(() => setTransitioningBg(false), 300);
        });
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

    const handleWheel = (e: React.WheelEvent) => {
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
            if (pinchStartRef.current && pinchScaleStartRef.current) {
                const delta = pinchCurrent / pinchStartRef.current;
                const newScale = Math.min(Math.max(pinchScaleStartRef.current * delta, minScale), 4);
                const scaleFactor = newScale / pinchScaleStartRef.current;

                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    const offsetX = centerX - rect.left;
                    const offsetY = centerY - rect.top;

                    const newOffsetX = (offset.x - offsetX) * scaleFactor + offsetX;
                    const newOffsetY = (offset.y - offsetY) * scaleFactor + offsetY;

                    setScale(newScale);
                    setOffset(clampOffset({ x: newOffsetX, y: newOffsetY }));
                }
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



    if (!map) {
        return <div className="p-6 text-red-600">Карта не найдена или вы не авторизованы.</div>;
    }
    return (
        <div className="md:p-6">
            <h1 className="text-3xl font-bold mb-4">{map.name}</h1>

            {mapUrl ? (
                <div
                    ref={containerRef}
                    className={`relative w-full h-[80vh] border rounded overflow-hidden ${isGrabbing ? 'cursor-grabbing' : 'cursor-grab'
                        } bg-gray-200`}
                    style={{
                        width: '100%',
                        height: '80vh',
                        backgroundColor: backgroundColor,
                        filter: transitioningBg ? 'blur(2px)' : 'none',
                        touchAction: 'none',
                    }}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onClick={handleMapClick}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
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
                                boxShadow: '0 0 60px rgba(0,0,0,0.3)',
                                borderRadius: '12px',
                            }}
                            draggable={false}
                        />
                        {/* <div
                            className="absolute inset-0"
                            style={{
                                background: `
                                          radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.3) 100%)
                                        `,
                                mixBlendMode: 'multiply',
                                pointerEvents: 'none',
                            }}
                        /> */}

                        {mapPoints.map((point) => (
                            <div
                                key={point.id}
                                className="absolute group z-0"
                                style={{
                                    left: `${point.x * 100}%`,
                                    top: `${point.y * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                    backdropFilter: 'blur(30px)',
                                    WebkitBackdropFilter: 'blur(30px)',
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPoint(point);
                                }}
                            >
                                {imageSize && (
                                    <div
                                        className="absolute z-0"
                                        style={{
                                            left: offset.x + imageSize!.width * scale / 2,
                                            top: offset.y + imageSize!.height * scale / 2,
                                            width: 200,
                                            height: 200,
                                            background: 'radial-gradient(circle, rgba(255,255,255,0.2), transparent)',
                                            transform: 'translate(-50%, -50%)',
                                            filter: 'blur(30px)',
                                            animation: 'pulse 3s ease-in-out infinite',
                                        }}
                                    />
                                )}
                                <div className="w-4 h-4 bg-red-500 rounded-full shadow-md transition-transform hover:scale-125 cursor-pointer" />
                                <span className="absolute top-5 left-1/2 -translate-x-1/2 text-xs text-black bg-white bg-opacity-75 px-1 rounded pointer-events-none">
                                    {point.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-gray-500">Карта не загружена</div>
            )}
            {selectedPoint && (
                <MapPointModal point={selectedPoint} onClose={() => setSelectedPoint(null)} />
            )}

            {newPointCoords && (
                <CreateMapPointModal
                    coords={newPointCoords}
                    onClose={() => setNewPointCoords(null)}
                    onSave={async (name: string) => {
                        if (!map || !session?.user?.id) return;

                        const newPoint: MapPoint = {
                            id: uuidv4(),
                            name,
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
        </div>
    );
};
