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
import { toast } from 'react-toastify';
import { useSession } from '@supabase/auth-helpers-react';

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
                    <div className="flex flex-col items-center text-sm">
                        {char.avatar && (
                            <img
                                src={char.avatar}
                                alt={char.name}
                                className="w-12 h-12 rounded-full object-cover mb-1 border border-white shadow"
                            />
                        )}
                        <span>{char.name}</span>
                    </div>
                ),
            },
            position: positions[char.id] ?? { x: 100 + index * 150, y: 100 },
            style: {
                padding: 10,
                borderRadius: 8,
                width: 100,
            },
        }));

        setNodes(updated);
    }, [characters, positions]);

    useEffect(() => {
        setDraftRelationships(relationships);
    }, [relationships]);

    useEffect(() => {
        const grouped = draftRelationships.reduce((acc, rel) => {
            const key = `${rel.source_id}-${rel.target_id}`;
            acc[key] = acc[key] || [];
            acc[key].push(rel);
            return acc;
        }, {} as Record<string, Relationship[]>);

        const updatedEdges: Edge[] = [];
        Object.values(grouped).forEach((group) => {
            group.forEach((rel, index) => {
                const curvature = 0.3 + (index - (group.length - 1) / 2) * 0.15;
                updatedEdges.push({
                    id: rel.id,
                    source: rel.source_id,
                    target: rel.target_id,
                    label: rel.type,
                    type: 'custom',
                    animated: true,
                    style: {
                        stroke: rel.color || '#888',
                    },
                    data: {
                        curvature,
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
                toast.error('Часть позиций не сохранилась');
            } else {
                toast.success('Связи и позиции успешно сохранены!');
            }

        } catch (error) {
            toast.error('Ошибка при сохранении связей или позиций');
            console.error(error);
        }
    };

    return (
        <div style={{ height: 600 }}>
            <ReactFlow
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
                <MiniMap />
                <Controls />
                <Background />
            </ReactFlow>

            <div className="text-right mt-10 px-4">
                <button
                    onClick={handleSave}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                    💾 Сохранить связи
                </button>
            </div>

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
                />
            )}
        </div>
    );
};
