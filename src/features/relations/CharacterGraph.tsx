import { useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { Connection, Edge, Node } from 'reactflow';
import type { Character } from '../../types/character';
import type { Relationship } from '../../types/relationshipType';

import { useRelationshipStore } from '../../store/useRelationshipStore';
import { useCharacterPositionStore } from '../../store/useCharacterPositionStore';
import { supabase } from '../../lib/supabaseClient';
import { RelationTypeModal } from './RelationTypeModal';
import { CustomCurvedEdge } from '../../components/CustomCurvedEdge';
import { useSession } from '@supabase/auth-helpers-react';
import { ManualRelationModal } from '../../components/ManualRelationModal';
import { HeartPlus, Save, Sparkles } from 'lucide-react';
import { Button } from '../../components/ChronicleButton';
import { FloatingAlert } from '../../components/FloatingAlert';
import { useDraftRelationshipStore } from '../../store/useDraftRelationshipStore';

interface CharacterGraphProps {
    characters: Character[];
    relationships: Relationship[];
    onSelectCharacter?: (charId: string) => void;
    allCharacters?: Character[];
    /** Только просмотр: без правок связей, перетаскивания и сохранения */
    readOnly?: boolean;
}

export const CharacterGraph = ({
    characters,
    relationships,
    onSelectCharacter,
    allCharacters,
    readOnly = false,
}: CharacterGraphProps) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [manualModalOpen, setManualModalOpen] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    const session = useSession();
    const graphType = 'default';

    const { addRelationship, updateRelationship, removeRelationship } = useRelationshipStore();
    const { fetchPositions, savePosition, setPosition, positions } = useCharacterPositionStore();
    const {
        draftRelationships,
        setDraftRelationships,
    } = useDraftRelationshipStore();

    const relsForGraph = readOnly ? relationships : draftRelationships;

    useEffect(() => {
        if (session?.user?.id) {
            fetchPositions(session.user.id, graphType, supabase);
        }
    }, [session, fetchPositions]);

    useEffect(() => {
        if (readOnly) return;
        setDraftRelationships(relationships);
    }, [readOnly, relationships, setDraftRelationships]);

    useEffect(() => {
        const activeCharacterIds = new Set<string>();

        relsForGraph.forEach((rel) => {
            activeCharacterIds.add(rel.source_id);
            activeCharacterIds.add(rel.target_id);
        });

        characters.forEach((char) => activeCharacterIds.add(char.id));

        const activeCharacters = (allCharacters || []).filter((char) =>
            activeCharacterIds.has(char.id)
        );

        const updated: Node[] = activeCharacters.map((char, index) => ({
            id: char.id,
            data: {
                label: (
                    <div className="flex flex-col items-center text-[13px] md:text-xl text-[#e5d9a5] font-lora">
                        {char.avatar && (
                            <img
                                src={char.avatar}
                                alt={char.name}
                                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover mb-1 border border-[#c2a774aa] shadow-[0_0_14px_#000]"
                            />
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-[#0b1510]/70 border border-[#3a4a34] max-w-[120px] text-center truncate">
                            {char.name}
                        </span>
                    </div>
                ),
            },
            position: positions[char.id] ?? { x: 100 + index * 150, y: 100 },
            style: {
                padding: 8,
                borderRadius: 18,
                width: 130,
                background: 'rgba(15, 23, 18, 0.92)',
                border: '1px solid rgba(194, 167, 116, 0.65)',
                boxShadow: '0 0 24px rgba(0,0,0,0.8)',
            },
        }));

        setNodes(updated);
    }, [relsForGraph, characters, allCharacters, positions, setNodes]);

    useEffect(() => {
        const grouped = relsForGraph.reduce((acc, rel) => {
            const key = [rel.source_id, rel.target_id].sort().join('-');
            acc[key] = acc[key] || [];
            acc[key].push(rel);
            return acc;
        }, {} as Record<string, Relationship[]>);

        const updatedEdges: Edge[] = [];
        Object.values(grouped).forEach((group) => {
            group.forEach((rel, index) => {
                const offset = index - (group.length - 1) / 2;
                const curvature = 0.3 + offset * 0.2;
                const textDy = -8 + offset * 12;

                updatedEdges.push({
                    id: rel.id,
                    source: rel.source_id,
                    target: rel.target_id,
                    label: rel.type,
                    type: 'custom',
                    animated: true,
                    style: {
                        stroke: rel.color || '#c2a774',
                        strokeWidth: 2.5,
                    },
                    data: {
                        curvature,
                        indexOffset: offset,
                        textDy,
                    },
                });
            });
        });

        setEdges(updatedEdges);
    }, [relsForGraph, setEdges]);

    const onConnect = (connection: Connection) => {
        if (readOnly) return;
        setPendingConnection(connection);
        setShowModal(true);
    };

    const handleAddRelation = async ({ label, color }: { label: string; color: string }) => {
        if (!pendingConnection?.source || !pendingConnection?.target) return;
        const newRel: Relationship = {
            id: crypto.randomUUID(),
            source_id: pendingConnection.source,
            target_id: pendingConnection.target,
            type: label,
            color,
            created_at: new Date().toISOString(),
        };
        setDraftRelationships([...draftRelationships, newRel]);
        setShowModal(false);
        setPendingConnection(null);
    };

    const handleEditRelation = ({ label, color }: { label: string; color: string }) => {
        if (!selectedEdge) return;

        const updated = draftRelationships.map((rel) =>
            rel.id === selectedEdge.id ? { ...rel, type: label, color } : rel
        );
        setDraftRelationships(updated);
        setSelectedEdge(null);
        setEditModalOpen(false);
    };

    const handleDeleteRelation = () => {
        if (!selectedEdge) return;

        const filtered = draftRelationships.filter((rel) => rel.id !== selectedEdge.id);
        setDraftRelationships(filtered);
        setSelectedEdge(null);
        setEditModalOpen(false);
    };

    const handleSave = async () => {
        if (readOnly || !session?.user?.id) return;

        const existingIds = relationships.map((r) => r.id);
        const toAdd = draftRelationships.filter((r) => !existingIds.includes(r.id));
        const toUpdate = draftRelationships.filter((r) =>
            relationships.some((old) => old.id === r.id && (old.type !== r.type || old.color !== r.color))
        );
        const toDelete = relationships.filter((r) => !draftRelationships.some((d) => d.id === r.id));

        try {
            for (const rel of toAdd) await addRelationship(rel, supabase);
            for (const rel of toUpdate) await updateRelationship(rel, supabase);
            for (const rel of toDelete) await removeRelationship(rel.id, supabase);

            let hasError = false;
            for (const node of nodes) {
                const { error } = await savePosition(
                    node.id,
                    node.position,
                    session.user.id,
                    graphType,
                    supabase
                );
                if (error) {
                    hasError = true;
                    console.error(`Ошибка при сохранении позиции ${node.id}:`, error);
                }
            }

            if (hasError) {
                setStatusMessage({ type: 'error', text: 'Часть позиций не сохранилась' });
            } else {
                setStatusMessage({ type: 'success', text: 'Связи и позиции успешно сохранены!' });
            }

        } catch (error) {
            setStatusMessage({ type: 'error', text: 'Ошибка при сохранении связей или позиций' });
            console.error(error);
        }
    };

    return (
        <>
            <div className="relative mt-6 h-[600px] sm:h-[78vh] w-full overflow-hidden rounded-3xl border border-[#3a4a34] bg-[#050806]/90 shadow-[0_0_40px_#000]">
                <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_10%_0%,#c2a77426,transparent_55%),radial-gradient(circle_at_90%_100%,#8ec08e22,transparent_55%)]" />

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex max-sm:gap-4 md:items-center max-sm:flex-col md:justify-between px-4 sm:px-6 pt-4 pb-3 border-b border-[#3a4a34]/80 bg-gradient-to-r from-[#0b1510ee] via-[#111712ee] to-[#0b1510ee]">
                        <div className="flex flex-col gap-0.5">
                            <div className="inline-flex items-center gap-1.5 text-[18px] uppercase tracking-[0.18em] text-[#c7bc98] font-lora">
                                <span className="w-1 h-1 rounded-full bg-[#c2a774]" />
                                <span>Граф связей</span>
                            </div>
                            <div className="flex items-center gap-1 text-[16px] text-[#c7bc98]/90">
                                <Sparkles size={14} className="text-[#c2a774]" />
                                <span>
                                    {readOnly
                                        ? 'Только просмотр'
                                        : 'Перетаскивайте персонажей и соединяйте их линиями'}
                                </span>
                            </div>
                        </div>

                        {!readOnly ? (
                        <div className="flex flex-col md:flex-row gap-2 sm:gap-3">
                            <Button
                                onClick={() => setManualModalOpen(true)}
                                icon={<HeartPlus className="max-sm:w-4 max-sm:h-4" />}
                                className="bg-[#223120] border border-[#3a4a34] text-[#e5d9a5] hover:bg-[#2c3a2b] hover:border-[#c2a774aa] transition text-xs sm:text-sm px-3 py-2 rounded-xl"
                            >
                                <span className="max-sm:text-xs">Вручную</span>
                            </Button>
                            <Button
                                onClick={handleSave}
                                icon={<Save className="max-sm:w-4 max-sm:h-4" />}
                                className="bg-gradient-to-r from-[#c2a774] to-[#e5d9a5] text-[#1f2b1f] hover:from-[#e5d9a5] hover:to-[#fffbe6] border border-[#c2a774] shadow-[0_0_16px_#c2a77455] transition text-xs sm:text-sm px-3 py-2 rounded-xl"
                            >
                                <span className="max-sm:text-xs">Сохранить связи</span>
                            </Button>
                        </div>
                        ) : null}
                    </div>

                    <div className="flex-1">
                        <ReactFlow
                            fitView
                            panOnScroll
                            zoomOnScroll
                            zoomOnPinch
                            panOnDrag
                            nodes={nodes}
                            edges={edges}
                            nodesDraggable={!readOnly}
                            nodesConnectable={!readOnly}
                            edgesUpdatable={!readOnly}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={(_, node) => onSelectCharacter?.(node.id)}
                            onEdgeClick={
                                readOnly
                                    ? undefined
                                    : (_, edge) => {
                                          setSelectedEdge(edge);
                                          setEditModalOpen(true);
                                      }
                            }
                            onNodeDragStop={
                                readOnly
                                    ? undefined
                                    : (_, node) => {
                                          setPosition(node.id, node.position);
                                          setNodes((nds) =>
                                              nds.map((n) =>
                                                  n.id === node.id ? { ...n, position: node.position } : n
                                              )
                                          );
                                      }
                            }
                            edgeTypes={{ custom: CustomCurvedEdge }}
                        >
                            {window.innerWidth > 640 && (
                                <MiniMap
                                    nodeColor="#c2a774"
                                    maskColor="rgba(5,8,6,0.96)"
                                    style={{
                                        background: '#050806',
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                    }}
                                />
                            )}
                            <Controls
                                showInteractive={false}
                                style={{
                                    background: '#111712',
                                    borderRadius: 999,
                                    border: '1px solid #3a4a34',
                                    color: '#e5d9a5',
                                }}
                            />
                            <Background gap={18} color="#283528" />
                        </ReactFlow>
                    </div>
                </div>

                {selectedEdge && editModalOpen && (
                    <RelationTypeModal
                        isOpen
                        onSelect={(data) => Promise.resolve(handleEditRelation(data))}
                        onClose={() => {
                            setEditModalOpen(false);
                            setSelectedEdge(null);
                        }}
                        onDelete={handleDeleteRelation}
                        initialData={{
                            label: selectedEdge.label?.toString() || '',
                            color: selectedEdge.style?.stroke || '#888',
                        }}
                        modalClassName="bg-[#111712] text-[#e5d9a5] border border-[#c2a77488] rounded-2xl p-6 shadow-[0_0_30px_#000]"
                        buttonClassName="bg-gradient-to-r from-[#c2a774] to-[#e5d9a5] text-[#1f2b1f] font-medium px-4 py-2 rounded-xl hover:from-[#e5d9a5] hover:to-[#fffbe6]"
                    />
                )}

                {showModal && (
                    <RelationTypeModal
                        isOpen
                        onSelect={handleAddRelation}
                        onClose={() => {
                            setShowModal(false);
                            setPendingConnection(null);
                        }}
                        modalClassName="bg-[#111712] text-[#e5d9a5] border border-[#c2a77488] rounded-2xl p-6 shadow-[0_0_30px_#000]"
                        buttonClassName="bg-gradient-to-r from-[#c2a774] to-[#e5d9a5] text-[#1f2b1f] font-medium px-4 py-2 rounded-xl hover:from-[#e5d9a5] hover:to-[#fffbe6]"
                    />
                )}

                {!readOnly ? (
                <ManualRelationModal
                    isOpen={manualModalOpen}
                    characters={allCharacters || []}
                    onClose={() => setManualModalOpen(false)}
                    onCreate={async ({ sourceId, targetId, label, color }) => {
                        const newRel: Relationship = {
                            id: crypto.randomUUID(),
                            source_id: sourceId,
                            target_id: targetId,
                            type: label,
                            color,
                            created_at: new Date().toISOString(),
                        };
                        setDraftRelationships([...draftRelationships, newRel]);
                        try {
                            await addRelationship(newRel, supabase);
                            setStatusMessage({ type: 'success', text: 'Связь успешно создана!' });
                        } catch (error) {
                            console.error('Ошибка при сохранении связи:', error);
                            setStatusMessage({ type: 'error', text: 'Ошибка при сохранении связи' });
                        }
                        if (session) {
                            await savePosition(
                                sourceId,
                                positions[sourceId] ?? { x: 100, y: 100 },
                                session.user.id,
                                graphType,
                                supabase
                            );
                            await savePosition(
                                targetId,
                                positions[targetId] ?? { x: 200, y: 100 },
                                session.user.id,
                                graphType,
                                supabase
                            );
                        }
                    }}
                />
                ) : null}
            </div>

            {statusMessage && (
                <FloatingAlert
                    type={statusMessage.type}
                    message={statusMessage.text}
                    onClose={() => setStatusMessage(null)}
                    position="top-right"
                />
            )}
        </>
    );
};
