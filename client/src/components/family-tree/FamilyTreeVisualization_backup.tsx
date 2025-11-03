import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  BackgroundVariant,
  Connection,
  NodeTypes,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";

import { FamilyTreeData } from "../../types";
import { relationshipsAPI } from "../../services/api";
import FamilyMemberNode from "./FamilyMemberNode";
import AddRelationshipModal from "./AddRelationshipModal";
import {
  TreePine,
  Users,
  Plus,
  Link2,
  Layout,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Share2,
} from "lucide-react";

const nodeTypes: NodeTypes = {
  familyMember: FamilyMemberNode,
};

// Layout calculation functions
const calculateTreeLayout = (nodes: any[], viewMode: string) => {
  switch (viewMode) {
    case "tree":
      return calculateHierarchicalLayout(nodes);
    case "generation":
      return calculateGenerationalLayout(nodes);
    case "circular":
      return calculateCircularLayout(nodes);
    default:
      return calculateHierarchicalLayout(nodes);
  }
};

const calculateHierarchicalLayout = (nodes: any[]) => {
  const layerHeight = 250;
  const nodeWidth = 320;
  const startX = 100; // Start further from edge
  const startY = 100; // Start further from top

  console.log("Calculating hierarchical layout for nodes:", nodes.length); // Debug log

  return nodes.map((node, index) => {
    const layer = Math.floor(index / 3); // 3 nodes per layer
    const positionInLayer = index % 3;
    const totalInLayer = Math.min(3, nodes.length - layer * 3);
    const layerStartX = startX + (-(totalInLayer - 1) * nodeWidth) / 2;

    const position = {
      x: layerStartX + positionInLayer * nodeWidth,
      y: startY + layer * layerHeight,
    };

    console.log(
      `Node ${index} (${node.data?.label || node.id}) positioned at:`,
      position
    ); // Debug log

    return {
      ...node,
      position,
    };
  });
};

const calculateGenerationalLayout = (nodes: any[]) => {
  // Group by generation and arrange horizontally
  const nodeWidth = 320;
  const layerHeight = 220;
  const startX = 100;
  const startY = 100;

  console.log("Calculating generational layout for nodes:", nodes.length); // Debug log

  return nodes.map((node, index) => {
    const position = {
      x: startX + (index % 4) * nodeWidth,
      y: startY + Math.floor(index / 4) * layerHeight,
    };

    console.log(`Generational node ${index} positioned at:`, position); // Debug log

    return {
      ...node,
      position,
    };
  });
};

const calculateCircularLayout = (nodes: any[]) => {
  const radius = 300;
  const centerX = 500;
  const centerY = 350;

  console.log("Calculating circular layout for nodes:", nodes.length); // Debug log

  return nodes.map((node, index) => {
    const angle = (index * 2 * Math.PI) / nodes.length;
    const position = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };

    console.log(`Circular node ${index} positioned at:`, position); // Debug log

    return {
      ...node,
      position,
    };
  });
};

const FamilyTreeVisualization: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<FamilyTreeData | null>(null);
  const [viewMode, setViewMode] = useState<"tree" | "generation" | "circular">(
    "tree"
  );
  const [showAddRelationshipModal, setShowAddRelationshipModal] =
    useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Force reload trigger

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    const loadFamilyTree = async () => {
      try {
        setIsLoading(true);
        const response = await relationshipsAPI.getFamilyTree();
        const data = response.data.data as FamilyTreeData;
        setTreeData(data);

        console.log("Family tree data:", data); // Debug log

        // Check if we have the expected tree structure
        if (
          data.treeStructure &&
          data.treeStructure.nodes &&
          data.treeStructure.nodes.length > 0
        ) {
          // Use the tree structure from backend
          const flowNodes = data.treeStructure.nodes.map((node) => ({
            id: node.id,
            type: "familyMember",
            position: node.position,
            data: {
              person: node.data.person,
              label: node.data.label,
            },
            draggable: true,
          }));

          const flowEdges = data.treeStructure.edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            type: "smoothstep",
            animated: true,
            style: {
              stroke: "url(#gradient)",
              strokeWidth: 3,
            },
            labelStyle: {
              fontSize: 11,
              fontWeight: 600,
              fill: "#374151",
              fontFamily: "Inter, system-ui, sans-serif",
            },
            labelBgStyle: {
              fill: "rgba(255, 255, 255, 0.9)",
              fillOpacity: 0.9,
              rx: 8,
              ry: 8,
            },
          }));

          // Calculate layout
          const layoutNodes = calculateTreeLayout(flowNodes, viewMode);
          console.log("Layout nodes:", layoutNodes); // Debug log
          console.log("Flow edges:", flowEdges); // Debug log
          setNodes(layoutNodes);
          setEdges(flowEdges);
        } else if (data.familyMembers && data.familyMembers.length > 0) {
          // Fallback: Create nodes directly from family members when no tree structure exists
          console.log("No tree structure, creating nodes from family members");

          const familyNodes = data.familyMembers.map((member, index) => ({
            id: member._id,
            type: "familyMember",
            position: { x: 0, y: 0 }, // Will be calculated by layout
            data: {
              person: member,
              label: `${member.firstName} ${member.lastName}`,
            },
            draggable: true,
          }));

          // Calculate layout for family members
          const layoutNodes = calculateTreeLayout(familyNodes, viewMode);
          console.log("Fallback layout nodes:", layoutNodes); // Debug log
          setNodes(layoutNodes);
          setEdges([]); // No relationships yet
        } else {
          console.log("No family members found");
          setNodes([]);
          setEdges([]);
        }
      } catch (err: any) {
        console.error("Family tree loading error:", err);
        setError(err.response?.data?.message || "Failed to load family tree");
      } finally {
        setIsLoading(false);
      }
    };

    loadFamilyTree();
  }, [setNodes, setEdges, viewMode, refreshTrigger]);
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading family tree...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!treeData || treeData.familyMembers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No family members yet
          </h3>
          <p className="mt-2 text-gray-500">
            Start building your family tree by adding family members
          </p>
          <button
            onClick={() => {
              /* TODO: Navigate to add member */
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add Family Member
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <TreePine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Family Tree</h2>
              <p className="text-sm text-gray-600">
                {treeData?.stats.totalMembers || 0} members •{" "}
                {treeData?.stats.totalRelationships || 0} connections
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: "tree", label: "Tree", icon: TreePine },
              { key: "generation", label: "Generations", icon: Users },
              { key: "circular", label: "Circle", icon: Layout },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as any)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${
                    viewMode === key
                      ? "bg-white text-indigo-600 shadow-md"
                      : "text-gray-600 hover:text-indigo-600"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
              <Plus className="w-4 h-4" />
              Add Member
            </button>
            <button
              onClick={() => setShowAddRelationshipModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Link2 className="w-4 h-4" />
              Add Relationship
            </button>
          </div>
        </div>
      </div>

      {/* React Flow Container */}
      <div
        className="relative"
        style={{ height: "calc(100vh - 120px)", width: "100%" }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.3,
            minZoom: 0.1,
            maxZoom: 1.5,
          }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          minZoom={0.1}
          maxZoom={2}
          attributionPosition="bottom-left"
          className="bg-transparent"
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
        >
          {/* Custom Controls */}
          <Panel position="top-right" className="space-y-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-2 space-y-1">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <ZoomIn className="w-4 h-4" />
                Zoom In
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <ZoomOut className="w-4 h-4" />
                Zoom Out
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Maximize2 className="w-4 h-4" />
                Fit View
              </button>
              <hr className="border-gray-200" />
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </Panel>

          <Controls
            position="bottom-right"
            className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg"
            showInteractive={false}
          />

          <Background
            variant={BackgroundVariant.Dots}
            gap={25}
            size={1.5}
            color="#e5e7eb"
            className="opacity-50"
          />

          {/* Gradient Definitions */}
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 0,
              height: 0,
            }}
          >
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </ReactFlow>
      </div>

      {/* Add Relationship Modal */}
      <AddRelationshipModal
        isOpen={showAddRelationshipModal}
        onClose={() => setShowAddRelationshipModal(false)}
        onRelationshipAdded={() => {
          // Reload the family tree data by triggering a refresh
          setShowAddRelationshipModal(false);
          setRefreshTrigger((prev) => prev + 1);
          console.log("Relationship added, refreshing tree data..."); // Debug log
        }}
      />
    </div>
  );
};

export default FamilyTreeVisualization;
