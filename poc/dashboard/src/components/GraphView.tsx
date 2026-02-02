import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Node as FlowNode,
  Edge as FlowEdge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  Handle,
} from 'reactflow';
import dagre from '@dagrejs/dagre';
import 'reactflow/dist/style.css';
import { StatusBadge } from './StatusBadge';
import type { Node, Edge } from '../api';

interface GraphViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (node: Node) => void;
}

// Custom node component
function CustomNode({ data }: { data: Node & { onClick?: () => void } }) {
  const statusColor =
    data.status === 'Approved' ? 'border-rosie-green' :
    data.status === 'Rejected' ? 'border-rosie-red' :
    'border-rosie-yellow';

  const bgGlow =
    data.status === 'Approved' ? 'shadow-[0_0_15px_rgba(0,255,136,0.2)]' :
    data.status === 'Rejected' ? 'shadow-[0_0_15px_rgba(255,71,87,0.2)]' :
    'shadow-[0_0_15px_rgba(255,215,0,0.2)]';

  return (
    <div
      className={`
        bg-rosie-surface border-2 ${statusColor} rounded-lg p-3 min-w-[160px]
        cursor-pointer hover:bg-rosie-surface-light transition-all ${bgGlow}
      `}
      onClick={data.onClick}
    >
      <Handle type="target" position={Position.Top} className="!bg-rosie-border" />

      <div className="text-center">
        <div className="font-mono text-rosie-cyan font-semibold text-sm mb-1">
          {data.gxp_id}
        </div>
        <div className="text-rosie-text-muted text-xs mb-2 truncate max-w-[140px]">
          {data.title || data.type}
        </div>
        <StatusBadge status={data.status} size="sm" showIcon={false} />
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-rosie-border" />
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

// Layout function using dagre
function getLayoutedElements(nodes: FlowNode[], edges: FlowEdge[], direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 180;
  const nodeHeight = 100;

  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export function GraphView({ nodes, edges, onNodeClick }: GraphViewProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Convert to ReactFlow format
  const { initialNodes, initialEdges } = useMemo(() => {
    const flowNodes: FlowNode[] = nodes.map((node) => ({
      id: node.id,
      type: 'custom',
      data: {
        ...node,
        onClick: () => {
          setSelectedNode(node);
          onNodeClick?.(node);
        },
      },
      position: { x: 0, y: 0 },
    }));

    const flowEdges: FlowEdge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source_id,
      target: edge.target_id,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#2a2a36', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#2a2a36',
      },
    }));

    return getLayoutedElements(flowNodes, flowEdges);
  }, [nodes, edges, onNodeClick]);

  const [flowNodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when data changes
  useMemo(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes.map((node) => ({
        id: node.id,
        type: 'custom',
        data: {
          ...node,
          onClick: () => {
            setSelectedNode(node);
            onNodeClick?.(node);
          },
        },
        position: { x: 0, y: 0 },
      })),
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source_id,
        target: edge.target_id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#2a2a36', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#2a2a36',
        },
      }))
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges, onNodeClick, setNodes, setEdges]);

  if (nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-rosie-text-muted">
        <div className="text-center">
          <p className="text-lg mb-2">No trace graph yet</p>
          <p className="text-sm">Run <code className="text-rosie-cyan">rosie sync</code> to populate</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#2a2a36" gap={20} />
        <Controls
          showInteractive={false}
          className="!bg-rosie-surface !border-rosie-border !rounded-lg"
        />
      </ReactFlow>
    </div>
  );
}
