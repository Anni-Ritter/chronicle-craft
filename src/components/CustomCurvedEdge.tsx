import { getBezierPath, type EdgeProps } from "reactflow";

export const CustomCurvedEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    label,
    style,
    markerEnd,
    data,
}: EdgeProps) => {
    const curvature = data?.curvature ?? 0.3;
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        curvature,
    });

    return (
        <>
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={15}
                className="click-layer"
                pointerEvents="stroke"
                id={`${id}-click`}
            />

            <path
                id={id}
                d={edgePath}
                stroke={style?.stroke || "#888"}
                strokeWidth={style?.strokeWidth || 2}
                strokeDasharray={style?.strokeDasharray}
                fill="none"
                markerEnd={markerEnd as any}
                style={{ pointerEvents: "none" }}
            />

            {label && (
                <text
                    style={{
                        fontSize: 12,
                        fill: style?.stroke || "#000",
                        pointerEvents: "none",
                    }}
                >
                    <textPath
                        href={`#${id}`}
                        startOffset="50%"
                        textAnchor="middle"
                    >
                        {label}
                    </textPath>
                </text>
            )}
        </>
    );
};
