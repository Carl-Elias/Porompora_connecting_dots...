import React, { useCallback, useEffect, useState, useRef } from "react";
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
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import jsPDF from "jspdf";

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

// Inner component that has access to ReactFlow instance
const FlowControls: React.FC<{ onExport: () => void }> = ({ onExport }) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleZoomIn = () => {
    zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 300 });
  };

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 300 });
  };

  return (
    <ExportControls
      onExport={onExport}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onFitView={handleFitView}
    />
  );
};

// Export Controls Component (must be inside ReactFlow)
const ExportControls: React.FC<{
  onExport: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}> = ({ onExport, onZoomIn, onZoomOut, onFitView }) => {
  return (
    <Panel position="top-right" className="space-y-2">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-2 space-y-1">
        {/* Desktop View - Full buttons with text */}
        <div className="hidden md:block space-y-1">
          <button
            onClick={onZoomIn}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
            Zoom In
          </button>
          <button
            onClick={onZoomOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
            Zoom Out
          </button>
          <button
            onClick={onFitView}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
            Fit View
          </button>
          <hr className="border-gray-200" />
          <button
            onClick={onExport}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export as PDF
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Mobile View - Compact icon-only buttons in grid */}
        <div className="md:hidden grid grid-cols-2 gap-1">
          <button
            onClick={onZoomIn}
            className="flex flex-col items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
            <span className="text-xs mt-1">Zoom+</span>
          </button>
          <button
            onClick={onZoomOut}
            className="flex flex-col items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
            <span className="text-xs mt-1">Zoom-</span>
          </button>
          <button
            onClick={onFitView}
            className="flex flex-col items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Fit View"
          >
            <Maximize2 className="w-5 h-5" />
            <span className="text-xs mt-1">Fit</span>
          </button>
          <button
            onClick={onExport}
            className="flex flex-col items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Export as PDF"
          >
            <Download className="w-5 h-5" />
            <span className="text-xs mt-1">PDF</span>
          </button>
        </div>
      </div>
    </Panel>
  );
};

// Layout calculation functions
const calculateTreeLayout = (
  nodes: any[],
  viewMode: string,
  edges: any[] = []
) => {
  switch (viewMode) {
    case "tree":
      return calculateHierarchicalLayout(nodes, edges);
    case "generation":
      return calculateGenerationalLayout(nodes, edges);
    case "circular":
      return calculateCircularLayout(nodes);
    default:
      return calculateHierarchicalLayout(nodes, edges);
  }
};

const calculateHierarchicalLayout = (nodes: any[], edges: any[] = []) => {
  const layerHeight = 300; // Vertical spacing between generations (increased more)
  const minNodeSpacing = 350; // Minimum horizontal spacing between nodes (increased more)
  const startY = 50;

  console.log("=== HIERARCHICAL LAYOUT ===");
  console.log("Calculating hierarchical layout for nodes:", nodes.length);
  console.log("Edges available:", edges.length);

  // Build parent-child map from edges
  const parentChildMap = new Map<string, string[]>(); // parentId -> [childIds]
  const childParentMap = new Map<string, string>(); // childId -> parentId

  nodes.forEach((node) => {
    parentChildMap.set(node.id, []);
  });

  edges.forEach((edge) => {
    if (edge.label === "parent" || !edge.label) {
      // edge.source is parent, edge.target is child
      if (!parentChildMap.has(edge.source)) {
        parentChildMap.set(edge.source, []);
      }
      parentChildMap.get(edge.source)!.push(edge.target);
      childParentMap.set(edge.target, edge.source);
    }
  });

  console.log(
    "Parent-child relationships:",
    Array.from(parentChildMap.entries())
  );

  // Build a map of all nodes by ID
  const nodeMap = new Map();
  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      ...node,
      generation: -1,
      children: [],
      parents: [],
    });
  });

  // For now, use the backend-provided generation data if available
  // Otherwise, calculate based on simple rules
  const generations = new Map<number, any[]>();

  nodes.forEach((node) => {
    // Try to get generation from node data, or default to 0
    const generation = node.data?.generation ?? 0;

    console.log(
      `Node ${node.data?.label}: generation = ${generation}`,
      node.data
    );

    if (!generations.has(generation)) {
      generations.set(generation, []);
    }
    generations.get(generation)!.push(node);
  });

  // If no generation data, fall back to simple layout
  if (
    generations.size === 0 ||
    (generations.size === 1 && generations.has(0))
  ) {
    // Simple fallback: distribute nodes evenly
    const nodesPerRow = 4;
    return nodes.map((node, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;
      const totalInRow = Math.min(
        nodesPerRow,
        nodes.length - row * nodesPerRow
      );
      const rowStartX = 600 - ((totalInRow - 1) * minNodeSpacing) / 2;

      return {
        ...node,
        position: {
          x: rowStartX + col * minNodeSpacing,
          y: startY + row * layerHeight,
        },
      };
    });
  }

  // Layout nodes by generation with parent-child alignment
  const positionedNodes: any[] = [];
  const sortedGenerations = Array.from(generations.keys()).sort(
    (a, b) => a - b // Sort from lowest (ancestors) to highest (descendants)
  );

  console.log("Sorted generations:", sortedGenerations);

  // Track X positions assigned to each node
  const xPositions = new Map<string, number>();
  let generationYPositions = new Map<number, number>();

  // First pass: Assign Y positions to each generation
  sortedGenerations.forEach((gen, genIndex) => {
    const yPosition = startY + genIndex * layerHeight;
    generationYPositions.set(gen, yPosition);
  });

  // Second pass: Position nodes generation by generation, aligning children under parents
  sortedGenerations.forEach((gen, genIndex) => {
    const genNodes = generations.get(gen)!;
    const yPosition = generationYPositions.get(gen)!;

    console.log(
      `Generation ${gen} (index ${genIndex}): ${genNodes.length} nodes at Y=${yPosition}`
    );

    if (genIndex === 0) {
      // First generation (root/ancestors): center them
      const totalNodesInGen = genNodes.length;
      const totalWidth = (totalNodesInGen - 1) * minNodeSpacing;
      const centerX = 600;
      const genStartX = centerX - totalWidth / 2;

      genNodes.forEach((node, index) => {
        const xPos = genStartX + index * minNodeSpacing;
        xPositions.set(node.id, xPos);

        positionedNodes.push({
          ...node,
          position: { x: xPos, y: yPosition },
        });
        console.log(`  - ${node.data?.label}: (${xPos}, ${yPosition})`);
      });
    } else {
      // Subsequent generations: position children under their parents
      // First, group nodes by their parent to avoid overlaps between different families
      const nodesByParent = new Map<string, any[]>();
      const nodesWithoutParent: any[] = [];

      genNodes.forEach((node) => {
        const parentId = childParentMap.get(node.id);
        if (parentId && xPositions.has(parentId)) {
          if (!nodesByParent.has(parentId)) {
            nodesByParent.set(parentId, []);
          }
          nodesByParent.get(parentId)!.push(node);
        } else {
          nodesWithoutParent.push(node);
        }
      });

      // Track occupied X ranges to avoid overlaps
      const occupiedRanges: Array<{ start: number; end: number }> = [];

      const isOverlapping = (start: number, end: number): boolean => {
        return occupiedRanges.some(
          (range) =>
            (start >= range.start && start <= range.end) ||
            (end >= range.start && end <= range.end) ||
            (start <= range.start && end >= range.end)
        );
      };

      // Position children for each parent
      nodesByParent.forEach((children, parentId) => {
        const parentX = xPositions.get(parentId)!;
        const totalSiblings = children.length;

        if (totalSiblings === 1) {
          // Single child: directly under parent
          const xPos = parentX;
          const nodeWidth = 250; // Approximate node width

          // Check for overlap and adjust if needed
          let finalX = xPos;
          while (
            isOverlapping(finalX - nodeWidth / 2, finalX + nodeWidth / 2)
          ) {
            finalX += 50; // Shift right by 50px
          }

          xPositions.set(children[0].id, finalX);
          occupiedRanges.push({
            start: finalX - nodeWidth / 2,
            end: finalX + nodeWidth / 2,
          });

          positionedNodes.push({
            ...children[0],
            position: { x: finalX, y: yPosition },
          });
          console.log(
            `  - ${children[0].data?.label}: (${finalX}, ${yPosition}) under parent at ${parentX}`
          );
        } else {
          // Multiple children: distribute them around parent position
          const siblingSpacing = minNodeSpacing * 0.9; // Increased from 0.8 to 0.9
          const totalWidth = (totalSiblings - 1) * siblingSpacing;
          let startX = parentX - totalWidth / 2;

          // Check if this entire group overlaps with existing nodes
          const nodeWidth = 250;
          const groupStart = startX - nodeWidth / 2;
          const groupEnd = startX + totalWidth + nodeWidth / 2;

          if (isOverlapping(groupStart, groupEnd)) {
            // Find the rightmost occupied position and start after it
            const maxEnd = Math.max(...occupiedRanges.map((r) => r.end));
            startX = maxEnd + minNodeSpacing / 2;
          }

          children.forEach((node, childIndex) => {
            const xPos = startX + childIndex * siblingSpacing;
            xPositions.set(node.id, xPos);

            occupiedRanges.push({
              start: xPos - nodeWidth / 2,
              end: xPos + nodeWidth / 2,
            });

            positionedNodes.push({
              ...node,
              position: { x: xPos, y: yPosition },
            });
            console.log(
              `  - ${node.data?.label}: (${xPos}, ${yPosition}) under parent at ${parentX}`
            );
          });
        }
      });

      // Position nodes without parents
      nodesWithoutParent.forEach((node) => {
        const nodeWidth = 250;
        let xPos = 600; // Start at center

        // Find an unoccupied position
        while (isOverlapping(xPos - nodeWidth / 2, xPos + nodeWidth / 2)) {
          xPos += minNodeSpacing;
        }

        xPositions.set(node.id, xPos);
        occupiedRanges.push({
          start: xPos - nodeWidth / 2,
          end: xPos + nodeWidth / 2,
        });

        positionedNodes.push({
          ...node,
          position: { x: xPos, y: yPosition },
        });
        console.log(
          `  - ${node.data?.label}: (${xPos}, ${yPosition}) no parent`
        );
      });
    }
  });

  console.log("Positioned nodes by generation:", positionedNodes.length);
  return positionedNodes;
};

const calculateGenerationalLayout = (nodes: any[], edges: any[] = []) => {
  const minNodeSpacing = 350; // Horizontal spacing (increased more)
  const layerHeight = 300; // Vertical spacing between generations (increased more)
  const startY = 50;

  console.log("=== GENERATIONAL LAYOUT ===");
  console.log("Calculating generational layout for nodes:", nodes.length);

  // Group nodes by generation
  const generations = new Map<number, any[]>();

  nodes.forEach((node) => {
    const generation = node.data?.generation ?? 0;
    if (!generations.has(generation)) {
      generations.set(generation, []);
    }
    generations.get(generation)!.push(node);
  });

  // Sort generations from ancestors to descendants
  const sortedGenerations = Array.from(generations.keys()).sort(
    (a, b) => a - b
  );
  console.log("Generations found:", sortedGenerations);

  const positionedNodes: any[] = [];

  sortedGenerations.forEach((gen, genIndex) => {
    const genNodes = generations.get(gen)!;
    const yPosition = startY + genIndex * layerHeight;

    // Calculate total width needed and center it
    const totalWidth = (genNodes.length - 1) * minNodeSpacing;
    const startX = 600 - totalWidth / 2; // Center horizontally

    console.log(
      `Generation ${gen}: ${genNodes.length} nodes at Y=${yPosition}, starting X=${startX}`
    );

    genNodes.forEach((node, index) => {
      const xPos = startX + index * minNodeSpacing;

      positionedNodes.push({
        ...node,
        position: { x: xPos, y: yPosition },
      });

      console.log(
        `  ${index + 1}. ${node.data?.label}: (${xPos}, ${yPosition})`
      );
    });
  });

  console.log("Total positioned nodes:", positionedNodes.length);
  return positionedNodes;
};

const calculateCircularLayout = (nodes: any[]) => {
  const radius = Math.max(400, nodes.length * 60); // Larger radius for more spacing
  const centerX = 800;
  const centerY = 450;

  console.log("Calculating circular layout for nodes:", nodes.length);

  return nodes.map((node, index) => {
    const angle = (index * 2 * Math.PI) / nodes.length;
    const position = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };

    console.log(`Circular node ${index} positioned at:`, position);

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

  // Export tree as PDF function
  const exportTreeAsPDF = async () => {
    try {
      // Get the ReactFlow viewport element
      const viewport = document.querySelector(
        ".react-flow__viewport"
      ) as HTMLElement;
      if (!viewport) {
        console.error("Viewport not found");
        alert("Please wait for the tree to load before exporting.");
        return;
      }

      // Get the container element
      const container = document.querySelector(".react-flow") as HTMLElement;
      if (!container) {
        console.error("Container not found");
        return;
      }

      // Create a temporary container to capture the tree
      const clonedViewport = viewport.cloneNode(true) as HTMLElement;
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = `${viewport.scrollWidth}px`;
      tempContainer.style.height = `${viewport.scrollHeight}px`;
      tempContainer.style.background = "white";
      tempContainer.appendChild(clonedViewport);
      document.body.appendChild(tempContainer);

      // Wait for fonts and styles to load
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Use html2canvas to capture the viewport
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

      // Convert canvas to image
      const imgData = canvas.toDataURL("image/png");

      // Create PDF with proper dimensions
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate PDF dimensions (A4 landscape or custom based on content)
      const pdfWidth = imgWidth > imgHeight ? 297 : 210; // A4 dimensions in mm
      const pdfHeight = imgWidth > imgHeight ? 210 : 297;

      // Calculate scaling to fit content
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      // Create PDF
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });

      // Add image to PDF
      pdf.addImage(
        imgData,
        "PNG",
        (pdfWidth - scaledWidth) / 2,
        (pdfHeight - scaledHeight) / 2,
        scaledWidth,
        scaledHeight
      );

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `family-tree-${timestamp}.pdf`;

      // Save PDF
      pdf.save(filename);

      console.log("PDF exported successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    }
  };

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
          // Use the tree structure from backend with enhanced data (positions already calculated)
          const flowNodes = data.treeStructure.nodes.map((node) => ({
            id: node.id,
            type: "familyMember",
            position: node.position, // Use backend calculated positions
            data: {
              person: node.data.person,
              label: node.data.label,
              isCurrentUserFamily: node.data.isCurrentUserFamily,
              isCentralNode: node.data.isCentralNode,
              generation: node.data.generation,
              relationshipToCentral: node.data.relationshipToCentral,
              relationshipDisplayName: node.data.relationshipDisplayName,
            },
            draggable: true,
          }));

          // Create simple parent-child edges only
          const nodeIds = flowNodes.map((n) => n.id);
          console.log("📦 Node IDs:", nodeIds);
          console.log(
            "📦 Edges:",
            data.treeStructure.edges.map((e) => ({
              id: e.id,
              label: e.label,
              source: e.source,
              target: e.target,
            }))
          );

          // Filter to show only parent→child relationships (not child→parent)
          const flowEdges = data.treeStructure.edges
            .filter((edge) => {
              // Only show edges where parent points to child (label === "parent" means source is parent of target)
              const isParentToChild = edge.label === "parent";
              const sourceExists = nodeIds.includes(edge.source);
              const targetExists = nodeIds.includes(edge.target);

              if (isParentToChild && (!sourceExists || !targetExists)) {
                console.error(
                  `❌ Missing node for edge: ${edge.source} -> ${edge.target} (${edge.label})`
                );
              }

              return isParentToChild && sourceExists && targetExists;
            })
            .map((edge) => {
              return {
                id: edge.id,
                source: edge.source,
                target: edge.target,
                type: "step", // Step edges for rectangular hierarchy
                sourceHandle: "bottom", // Connect from bottom of parent
                targetHandle: "top", // Connect to top of child
                animated: false,
                style: {
                  stroke: "#6366f1",
                  strokeWidth: 2,
                },
              };
            });

          console.log("✅ Valid edges:", flowEdges.length);

          // Apply frontend layout algorithm to position nodes by generation
          console.log("Applying hierarchical layout based on generations...");
          const layoutedNodes = calculateTreeLayout(
            flowNodes,
            viewMode,
            flowEdges
          );

          console.log(
            "Using hierarchical view with parent-child edges:",
            flowEdges.length
          ); // Debug log
          setNodes(layoutedNodes);
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
    <div className="h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      {/* Compact Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-3 md:p-4 flex-shrink-0">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
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

          {/* View Mode Controls - Desktop */}
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
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-3">
          {/* Title and Stats */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TreePine className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Family Tree</h2>
              <p className="text-xs text-gray-600">
                {treeData?.stats.totalMembers || 0} members •{" "}
                {treeData?.stats.totalRelationships || 0} connections
              </p>
            </div>
          </div>

          {/* View Mode Controls - Mobile (Icon only) */}
          <div className="flex bg-gray-100 rounded-lg p-1 w-full">
            {[
              { key: "tree", label: "Tree", icon: TreePine },
              { key: "generation", label: "Gens", icon: Users },
              { key: "circular", label: "Circle", icon: Layout },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as any)}
                className={`
                  flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all
                  ${
                    viewMode === key
                      ? "bg-white text-indigo-600 shadow-md"
                      : "text-gray-600"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* React Flow Container */}
      <div className="flex-1 relative overflow-auto">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.2,
            minZoom: 0.2,
            maxZoom: 1.2,
            includeHiddenNodes: false,
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
          <FlowControls onExport={exportTreeAsPDF} />

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
