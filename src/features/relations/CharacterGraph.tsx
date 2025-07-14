import React, { useEffect, useState } from 'react';
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
import { HeartPlus, Save } from 'lucide-react';
import { Button } from '../../components/ChronicleButton';
import { FloatingAlert } from '../../components/FloatingAlert';

interface Props {
    characters: Character[];
    relationships: Relationship[];
    onSelectCharacter?: (charId: string) => void;
}

export const CharacterGraph: React.FC<Props> = ({
    characters,
    relationships,
    onSelectCharacter,
}) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [draftRelationships, setDraftRelationships] = useState<Relationship[]>([]);
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

    useEffect(() => {
        if (session?.user?.id) {
            fetchPositions(session.user.id, graphType, supabase);
        }
    }, [session]);

    useEffect(() => {
        const updated: Node[] = characters.map((char, index) => ({
            id: char.id,
            data: {
                label: (
                    <div className="flex flex-col items-center text-xs text-[#e5d9a5]">
                        {char.avatar && (
                            <img
                                src={char.avatar}
                                alt={char.name}
                                className="w-14 h-14 rounded-full object-cover mb-1 border border-[#e5d9a5] shadow-md"
                            />
                        )}
                        <span>{char.name}</span>
                    </div>
                ),
            },
            position: positions[char.id] ?? { x: 100 + index * 150, y: 100 },
            style: {
                padding: 10,
                borderRadius: 16,
                width: 110,
                backgroundColor: '#1f2b1f',
                border: '1px solid #e5d9a5',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            },
        }));

        setNodes(updated);
    }, [characters, positions]);

    useEffect(() => {
        setDraftRelationships(relationships);
    }, [relationships]);

    useEffect(() => {
        const grouped = draftRelationships.reduce((acc, rel) => {
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
                        stroke: rel.color || '#a0c48c',
                        strokeWidth: 3,
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
    }, [draftRelationships]);

    const onConnect = (connection: Connection) => {
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
        setDraftRelationships((prev) => [...prev, newRel]);
        setShowModal(false);
        setPendingConnection(null);
    };

    const handleEditRelation = async ({ label, color }: { label: string; color: string }) => {
        if (!selectedEdge) return;
        setDraftRelationships((prev) =>
            prev.map((rel) => (rel.id === selectedEdge.id ? { ...rel, type: label, color } : rel))
        );
        setSelectedEdge(null);
        setEditModalOpen(false);
    };

    const handleDeleteRelation = () => {
        if (!selectedEdge) return;
        setDraftRelationships((prev) => prev.filter((rel) => rel.id !== selectedEdge.id));
        setSelectedEdge(null);
        setEditModalOpen(false);
    };

    const handleSave = async () => {
        if (!session?.user?.id) return;

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
            <div className="relative h-[600px] mt-5 sm:h-[80vh] w-full overflow-hidden rounded-xl border border-[#e5d9a5] bg-[#1a2218] touch-none">
                <ReactFlow
                    fitView
                    panOnScroll
                    zoomOnScroll
                    zoomOnPinch
                    panOnDrag
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={(_, node) => onSelectCharacter?.(node.id)}
                    onEdgeClick={(_, edge) => {
                        setSelectedEdge(edge);
                        setEditModalOpen(true);
                    }}
                    onNodeDragStop={(_, node) => {
                        setPosition(node.id, node.position);
                        setNodes((nds) =>
                            nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n))
                        );
                    }}
                    edgeTypes={{ custom: CustomCurvedEdge }}
                >
                    {window.innerWidth > 640 && (
                        <MiniMap nodeColor="#e5d9a5" maskColor="rgba(26,34,24,0.9)" />
                    )}
                    <Controls showInteractive={false} style={{ background: '#2e4632', color: '#e5d9a5' }} />
                    <Background gap={16} color="#2e4632" />
                </ReactFlow>

                {selectedEdge && editModalOpen && (
                    <RelationTypeModal
                        isOpen
                        onSelect={handleEditRelation}
                        onClose={() => {
                            setEditModalOpen(false);
                            setSelectedEdge(null);
                        }}
                        onDelete={handleDeleteRelation}
                        initialData={{
                            label: selectedEdge.label?.toString() || '',
                            color: selectedEdge.style?.stroke || '#888',
                        }}
                        modalClassName="bg-[#1f2b1f] text-[#e5d9a5] border border-[#e5d9a5] rounded-xl p-6 shadow-xl"
                        buttonClassName="bg-[#e5d9a5] text-[#1f2b1f] font-medium px-4 py-2 rounded hover:bg-[#f0eac4]"
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
                        modalClassName="bg-[#1f2b1f] text-[#e5d9a5] border border-[#e5d9a5] rounded-xl p-6 shadow-xl"
                        buttonClassName="bg-[#e5d9a5] text-[#1f2b1f] font-medium px-4 py-2 rounded hover:bg-[#f0eac4]"
                    />
                )}

                <ManualRelationModal
                    isOpen={manualModalOpen}
                    characters={characters}
                    onClose={() => setManualModalOpen(false)}
                    onCreate={({ sourceId, targetId, label, color }) => {
                        const newRel: Relationship = {
                            id: crypto.randomUUID(),
                            source_id: sourceId,
                            target_id: targetId,
                            type: label,
                            color,
                            created_at: new Date().toISOString(),
                        };
                        setDraftRelationships((prev) => [...prev, newRel]);
                    }}
                />
            </div>
            <div className="flex flex-wrap gap-2 mt-8 w-full max-sm:justify-center">
                <Button
                    onClick={() => setManualModalOpen(true)}
                    icon={<HeartPlus />}
                    className="bg-[#2e4632] text-[#e5d9a5] hover:bg-[#3a5c3f] transition"
                >
                    Вручную
                </Button>
                <Button
                    onClick={handleSave}
                    icon={<Save />}
                    className="bg-[#e5d9a5] text-[#1f2b1f] hover:bg-[#f0eac4] transition"
                >
                    Сохранить связи
                </Button>
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