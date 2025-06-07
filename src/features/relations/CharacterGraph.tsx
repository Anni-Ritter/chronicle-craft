import React, { useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge
} from 'reactflow';
import type { Connection, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import type { Character } from '../../types/character';
import type { Relationship } from '../../types/relationshipType';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { supabase } from '../../lib/supabaseClient';
import { RelationTypeModal } from './RelationTypeModal';


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

    useEffect(() => {
        const updatedNodes: Node[] = characters.map((char, index) => ({
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
                )
            },
            position: { x: 100 + index * 150, y: 100 },
            style: {
                padding: 10,
                borderRadius: 8,
                width: 100,
            }
        }));

        setNodes(updatedNodes);
    }, [characters]);

    useEffect(() => {
        const updatedEdges: Edge[] = relationships.map((rel) => ({
            id: rel.id,
            source: rel.source_id,
            target: rel.target_id,
            label: rel.type,
            animated: true,
            style: {
                stroke: getStrokeColorByType(rel.type),
                strokeDasharray: getDashByType(rel.type),
            },
        }));

        setEdges(updatedEdges);
    }, [relationships]);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
    const [showModal, setShowModal] = useState(false);

    const { addRelationship, updateRelationship, removeRelationship } = useRelationshipStore();

    const onConnect = (connection: Connection) => {
        setPendingConnection(connection);
        setShowModal(true);
    };

    const handleTypeSelect = async (type: Relationship['type']) => {
        if (!pendingConnection?.source || !pendingConnection?.target) return;

        const newRel: Relationship = {
            id: crypto.randomUUID(),
            source_id: pendingConnection.source,
            target_id: pendingConnection.target,
            type,
            created_at: new Date().toISOString(),
        };

        const { error } = await addRelationship(newRel, supabase);
        if (error) {
            console.error('Ошибка при добавлении связи:', error);
        } else {
            const newEdge: Edge = {
                id: newRel.id,
                source: newRel.source_id,
                target: newRel.target_id,
                label: newRel.type,
                animated: true,
                style: {
                    stroke: getStrokeColorByType(type),
                    strokeDasharray: getDashByType(type),
                },
            };
            setEdges((prev) => addEdge(newEdge, prev));
        }

        setPendingConnection(null);
        setShowModal(false);
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
                fitView
            >
                <MiniMap />
                <Controls />
                <Background />
            </ReactFlow>

            {selectedEdge && (
                <RelationTypeModal
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setSelectedEdge(null);
                    }}
                    onSelect={async (newType) => {
                        const updatedRel: Relationship = {
                            id: selectedEdge.id,
                            source_id: selectedEdge.source,
                            target_id: selectedEdge.target,
                            type: newType as Relationship['type'],
                            created_at: new Date().toISOString(),
                        };

                        const { error } = await updateRelationship(updatedRel, supabase);
                        if (!error) {
                            setEdges((prev) =>
                                prev.map((e) =>
                                    e.id === selectedEdge.id
                                        ? {
                                            ...e,
                                            label: newType,
                                            style: {
                                                stroke: getStrokeColorByType(newType),
                                                strokeDasharray: getDashByType(newType),
                                            },
                                        }
                                        : e
                                )
                            );
                        }

                        setEditModalOpen(false);
                        setSelectedEdge(null);
                    }}
                    onDelete={async () => {
                        const { error } = await removeRelationship(selectedEdge.id, supabase);
                        if (!error) {
                            setEdges((prev) => prev.filter((e) => e.id !== selectedEdge.id));
                        }
                        setEditModalOpen(false);
                        setSelectedEdge(null);
                    }}
                />
            )}
            {showModal && (
                <RelationTypeModal
                    isOpen={showModal}
                    onSelect={handleTypeSelect}
                    onClose={() => {
                        setShowModal(false);
                        setPendingConnection(null);
                    }}
                />
            )}
        </div>
    );
};

function getStrokeColorByType(type: string): string {
    const map: Record<string, string> = {
        друг: '#4ade80',
        возлюбленные: '#3b82f6',
        враг: '#f87171',
        родство: '#60a5fa',
        союз: '#c084fc',
        бывший: '#9ca3af',
        загадка: '#facc15',
        ученик: '#38bdf8',
    };
    return map[type] || '#aaa';
}

function getDashByType(type: string): string | undefined {
    if (type === 'враг' || type === 'загадка' || type === 'союз') return '5 5';
    if (type === 'бывший') return '2 4 2';
    return undefined;
}
