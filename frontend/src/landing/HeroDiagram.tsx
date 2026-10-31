"use client";
import React, { useState, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Link,
  Zap,
  Globe,
  ShieldAlert,
  Database,
  Cpu,
  Activity,
  Server,
  Monitor,
  Radio,
  Droplets,
  HeartPulse,
  Orbit,
  Network,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RadialOrbitalTimeline, {
  TimelineItem,
} from "@/components/ui/radial-orbital-timeline";

interface DiagramNode extends TimelineItem {
  shortLabel?: string;
  x: number;
  y: number;
  r: number;
  shape: "circle" | "hex" | "service";
  onAttackPath?: boolean;
  isCriticalTarget?: boolean;
}

const DIAGRAM_NODES: DiagramNode[] = [
  {
    id: 1,
    title: "Internet",
    shortLabel: "EXT",
    date: "L4 · External",
    content:
      "Untrusted external perimeter entry vector scanning public-facing remote access endpoints.",
    category: "Perimeter",
    icon: Globe,
    relatedIds: [2, 4],
    status: "completed",
    energy: 75,
    x: 75,
    y: 55,
    r: 14,
    shape: "circle",
    onAttackPath: true,
  },
  {
    id: 2,
    title: "IT-WS1",
    date: "L4 · Enterprise IT",
    content:
      "Corporate engineering workstation on enterprise VLAN with restricted jump-host access.",
    category: "Enterprise",
    icon: Monitor,
    relatedIds: [1, 3, 4, 5],
    status: "pending",
    energy: 34,
    x: 250,
    y: 65,
    r: 11,
    shape: "circle",
  },
  {
    id: 3,
    title: "DC-01",
    date: "L4 · Enterprise IT",
    content:
      "Primary Active Directory domain controller managing enterprise identity and group policy.",
    category: "Enterprise",
    icon: Server,
    relatedIds: [2, 6],
    status: "pending",
    energy: 48,
    x: 410,
    y: 65,
    r: 11,
    shape: "circle",
  },
  {
    id: 4,
    title: "Vendor VPN",
    shortLabel: "VPN",
    date: "L3.5 · DMZ Choke",
    content:
      "Compromised contractor VPN concentrator bridging IT and DMZ. Single highest-leverage choke point.",
    category: "DMZ",
    icon: ShieldAlert,
    relatedIds: [1, 2, 5, 9],
    status: "completed",
    energy: 86,
    x: 150,
    y: 135,
    r: 13,
    shape: "circle",
    onAttackPath: true,
  },
  {
    id: 5,
    title: "Historian",
    date: "L3.5 · DMZ Choke",
    content:
      "Dual-homed plant data historian aggregating telemetry from L3 SCADA servers into enterprise SQL.",
    category: "DMZ",
    icon: Database,
    relatedIds: [2, 4, 7, 8],
    status: "completed",
    energy: 81,
    x: 330,
    y: 135,
    r: 12,
    shape: "circle",
    onAttackPath: true,
  },
  {
    id: 6,
    title: "WSUS",
    date: "L3.5 · DMZ",
    content:
      "Patch management relay server staging offline updates for isolated OT enclaves.",
    category: "DMZ",
    icon: Server,
    relatedIds: [3],
    status: "pending",
    energy: 29,
    x: 450,
    y: 135,
    r: 10,
    shape: "circle",
  },
  {
    id: 7,
    title: "Water SCADA",
    shortLabel: "SCADA",
    date: "L3 · Operations",
    content:
      "Central supervisory control server issuing setpoint commands to municipal water treatment PLCs.",
    category: "Operations",
    icon: Activity,
    relatedIds: [5, 9, 11],
    status: "completed",
    energy: 91,
    x: 230,
    y: 205,
    r: 13,
    shape: "circle",
    onAttackPath: true,
  },
  {
    id: 8,
    title: "Pwr SCADA",
    date: "L3 · Operations",
    content:
      "Substation supervisory control master monitoring 33kV distribution feeders.",
    category: "Operations",
    icon: Activity,
    relatedIds: [5, 12],
    status: "in-progress",
    energy: 58,
    x: 380,
    y: 205,
    r: 11,
    shape: "circle",
  },
  {
    id: 9,
    title: "Water HMI",
    date: "L2 · Supervisory",
    content:
      "Local operator human-machine interface panel inside the water filtration control room.",
    category: "Supervisory",
    icon: Monitor,
    relatedIds: [4, 7, 10],
    status: "in-progress",
    energy: 52,
    x: 140,
    y: 275,
    r: 11,
    shape: "circle",
  },
  {
    id: 10,
    title: "Pump PLC",
    date: "L1/L0 · Control",
    content:
      "Intake booster pump programmable logic controller regulating raw water flow.",
    category: "Control",
    icon: Cpu,
    relatedIds: [9],
    status: "pending",
    energy: 41,
    x: 95,
    y: 345,
    r: 14,
    shape: "hex",
  },
  {
    id: 11,
    title: "Chlorine PLC",
    shortLabel: "PLC",
    date: "4.2 h to impact",
    content:
      "Safety-critical dosing PLC. Unauthorized Modbus register writes disrupt Water & Hospital feeds for 3.2L citizens.",
    category: "Control",
    icon: Cpu,
    relatedIds: [7, 13, 14],
    status: "completed",
    energy: 87,
    x: 220,
    y: 345,
    r: 17,
    shape: "hex",
    onAttackPath: true,
    isCriticalTarget: true,
  },
  {
    id: 12,
    title: "Sub RTU",
    date: "L1/L0 · Control",
    content:
      "Remote terminal unit controlling breaker telemetry at Navanagar East substation.",
    category: "Control",
    icon: Radio,
    relatedIds: [8],
    status: "pending",
    energy: 38,
    x: 370,
    y: 345,
    r: 11,
    shape: "circle",
  },
  {
    id: 13,
    title: "Water",
    date: "2.4L Citizens",
    content:
      "Municipal potable water supply for 2,40,000 residents dependent on automated chlorine dosing.",
    category: "Essential Service",
    icon: Droplets,
    relatedIds: [11],
    status: "completed",
    energy: 95,
    x: 177,
    y: 423,
    r: 18,
    shape: "service",
  },
  {
    id: 14,
    title: "Hospital",
    date: "80K Citizens",
    content:
      "District Civil Hospital dialysis, sterilization, and ICU water supply feed.",
    category: "Essential Service",
    icon: HeartPulse,
    relatedIds: [11],
    status: "completed",
    energy: 92,
    x: 312,
    y: 423,
    r: 18,
    shape: "service",
  },
];

// Orbital subset representing the primary kill-chain & critical nodes
const ORBITAL_KILLCHAIN_NODES: TimelineItem[] = [
  DIAGRAM_NODES[0], // Internet
  DIAGRAM_NODES[3], // Vendor VPN
  DIAGRAM_NODES[4], // Historian
  DIAGRAM_NODES[6], // Water SCADA
  DIAGRAM_NODES[10], // Chlorine PLC
  DIAGRAM_NODES[12], // Water
  DIAGRAM_NODES[13], // Hospital
];

export default function HeroDiagram() {
  const shouldReduceMotion = useReducedMotion();
  const [displayMode, setDisplayMode] = useState<"topology" | "orbital">(
    "topology"
  );
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {}
  );
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Purdue bands (y coordinates for bands and labels)
  const bands = [
    { label: "L4", y: 35, yLine: 95 },
    { label: "L3.5", y: 105, yLine: 165 },
    { label: "L3", y: 175, yLine: 235 },
    { label: "L2", y: 245, yLine: 305 },
    { label: "L1/L0", y: 315, yLine: 385 },
  ];

  // Hexagon point helper for PLCs
  const getHexPoints = (cx: number, cy: number, r: number) => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = DIAGRAM_NODES.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState: Record<number, boolean> = {};
      const isOpening = !prev[id];
      newState[id] = isOpening;

      if (isOpening) {
        setActiveNodeId(id);
        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);
      } else {
        setActiveNodeId(null);
        setPulseEffect({});
      }

      return newState;
    });
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target === containerRef.current ||
      target.tagName === "svg" ||
      target.tagName === "line" ||
      target.tagName === "polyline" ||
      target.tagName === "rect"
    ) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
    }
  };

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "completed":
        return "text-[#FF4D4F] bg-[#FF4D4F]/15 border-[#FF4D4F]/50";
      case "in-progress":
        return "text-[#F26A1B] bg-[#F26A1B]/15 border-[#F26A1B]/50";
      case "pending":
        return "text-white/70 bg-white/5 border-white/20";
      default:
        return "text-white/70 bg-white/5 border-white/20";
    }
  };

  const activeNode = DIAGRAM_NODES.find((n) => n.id === activeNodeId) || null;

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.85 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  };

  // All background edges between nodes
  const edges: Array<{ from: number; to: number; isDownstream?: boolean }> = [
    { from: 1, to: 2 },
    { from: 1, to: 4 },
    { from: 2, to: 3 },
    { from: 2, to: 4 },
    { from: 2, to: 5 },
    { from: 3, to: 6 },
    { from: 4, to: 5 },
    { from: 4, to: 9 },
    { from: 5, to: 7 },
    { from: 5, to: 8 },
    { from: 7, to: 9 },
    { from: 7, to: 11 },
    { from: 9, to: 10 },
    { from: 8, to: 12 },
    { from: 11, to: 13, isDownstream: true },
    { from: 11, to: 14, isDownstream: true },
  ];

  // Calculate card position in percentage of the 520x460 viewBox
  const getCardStyle = (node: DiagramNode): React.CSSProperties => {
    const leftPct = Math.min(74, Math.max(26, (node.x / 520) * 100));
    const isBottomHalf = node.y > 210;
    const nodeTopPct = (node.y / 460) * 100;

    if (isBottomHalf) {
      return {
        left: `${leftPct}%`,
        bottom: `${Math.max(4, 100 - nodeTopPct + 4)}%`,
        transform: "translateX(-50%)",
      };
    }

    return {
      left: `${leftPct}%`,
      top: `${Math.min(58, nodeTopPct + 4)}%`,
      transform: "translateX(-50%)",
    };
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative mx-auto w-full max-w-[540px] min-w-0 select-none"
    >
      {/* Background ambient radial glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,#F26A1B_0%,transparent_70%)] opacity-25 blur-3xl"
        aria-hidden="true"
      />

      {/* Mode Switcher Pill (Purdue Topology vs Orbital View) */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F26A1B] animate-pulse" />
          Click any node to inspect energy &amp; links
        </span>
        <div className="inline-flex items-center rounded-full p-0.5 bg-[#120D0B]/90 border border-white/10 backdrop-blur-md">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDisplayMode("topology");
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono transition-all ${
              displayMode === "topology"
                ? "bg-[#F26A1B]/20 text-[#F26A1B] border border-[#F26A1B]/40"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <Network size={10} />
            Topology
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDisplayMode("orbital");
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono transition-all ${
              displayMode === "orbital"
                ? "bg-[#F26A1B]/20 text-[#F26A1B] border border-[#F26A1B]/40"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <Orbit size={10} />
            Orbital
          </button>
        </div>
      </div>

      <span className="sr-only">
        Interactive Purdue model network architecture diagram depicting an attack
        trajectory from Internet through Vendor VPN, Historian, and Water SCADA
        to an OT Chlorine PLC, which cascades downstream physical disruption
        into water treatment and hospital services.
      </span>

      {displayMode === "orbital" ? (
        <div className="relative w-full h-[460px] flex items-center justify-center">
          <RadialOrbitalTimeline
            timelineData={ORBITAL_KILLCHAIN_NODES}
            radius={165}
            className="w-full h-full flex flex-col items-center justify-center bg-transparent overflow-visible"
          />
        </div>
      ) : (
        <div className="relative w-full">
          {/* Main SVG Graphic */}
          <motion.svg
            viewBox="0 0 520 460"
            className="w-full h-auto block max-w-full overflow-visible"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <defs>
              <filter
                id="red-glow"
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter
                id="orange-glow"
                x="-40%"
                y="-40%"
                width="180%"
                height="180%"
              >
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="node-energy-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F26A1B" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#F26A1B" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#F26A1B" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="crit-energy-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF4D4F" stopOpacity="0.42" />
                <stop offset="70%" stopColor="#FF4D4F" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#FF4D4F" stopOpacity="0" />
              </radialGradient>
            </defs>

            <style>{`
              @keyframes attackDash {
                to { stroke-dashoffset: -36; }
              }
              @keyframes pulseScale {
                0%, 100% { transform: scale(1); opacity: 0.45; }
                50% { transform: scale(1.4); opacity: 0.95; }
              }
              @keyframes orbitalPing {
                0% { transform: scale(1); opacity: 0.75; }
                75%, 100% { transform: scale(2.1); opacity: 0; }
              }
              .animate-attack-dash {
                stroke-dasharray: 8 4;
                animation: attackDash 3s linear infinite;
              }
              .animate-plc-pulse {
                transform-box: fill-box;
                transform-origin: center;
                animation: pulseScale 2.2s ease-in-out infinite;
              }
              .animate-svg-ping {
                transform-box: fill-box;
                transform-origin: center;
                animation: orbitalPing 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
              }
              @media (prefers-reduced-motion: reduce) {
                .animate-attack-dash { animation: none; stroke-dasharray: none; }
                .animate-plc-pulse { animation: none; }
                .animate-svg-ping { animation: none; }
              }
            `}</style>

            {/* Purdue level horizontal bands */}
            {bands.map((b, i) => (
              <g key={i} className="pointer-events-none">
                <text
                  x="16"
                  y={b.y}
                  fill="#6F6863"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                  letterSpacing="0.08em"
                >
                  {b.label}
                </text>
                <line
                  x1="16"
                  y1={b.yLine}
                  x2="504"
                  y2={b.yLine}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
              </g>
            ))}

            {/* Background & Dynamic Connection Lines */}
            <g className="pointer-events-none">
              {edges.map((edge, idx) => {
                const fromNode = DIAGRAM_NODES.find((n) => n.id === edge.from)!;
                const toNode = DIAGRAM_NODES.find((n) => n.id === edge.to)!;
                const isHighlighted =
                  activeNodeId !== null &&
                  ((activeNodeId === edge.from &&
                    isRelatedToActive(edge.to)) ||
                    (activeNodeId === edge.to &&
                      isRelatedToActive(edge.from)));

                return (
                  <line
                    key={idx}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={
                      isHighlighted
                        ? "#F26A1B"
                        : edge.isDownstream
                        ? "rgba(255,255,255,0.22)"
                        : "rgba(255,255,255,0.08)"
                    }
                    strokeWidth={
                      isHighlighted ? "2" : edge.isDownstream ? "1.3" : "1"
                    }
                    strokeDasharray={
                      isHighlighted
                        ? "5 3"
                        : edge.isDownstream
                        ? "4 3"
                        : "3 3"
                    }
                    className={
                      isHighlighted
                        ? "animate-attack-dash transition-all duration-300"
                        : "transition-all duration-300"
                    }
                  />
                );
              })}
            </g>

            {/* Highlighted active attack path */}
            <g className="pointer-events-none">
              {/* Background glow stroke */}
              <polyline
                points="75,55 150,135 330,135 230,205 220,345"
                fill="none"
                stroke="#FF4D4F"
                strokeWidth="3.5"
                strokeOpacity={activeNodeId ? "0.28" : "0.42"}
                filter="url(#red-glow)"
              />
              {/* Dash animated front stroke */}
              <polyline
                points="75,55 150,135 330,135 230,205 220,345"
                fill="none"
                stroke="#FF4D4F"
                strokeWidth="2.5"
                className="animate-attack-dash"
              />
            </g>

            {/* Interactive Nodes (with RadialOrbitalTimeline effects) */}
            {DIAGRAM_NODES.map((node) => {
              const isExpanded = !!expandedItems[node.id];
              const isRelated = isRelatedToActive(node.id);
              const isPulsing = !!pulseEffect[node.id];
              const energyRadius = node.energy * 0.24 + node.r + 6;
              const isDimmed =
                activeNodeId !== null && !isExpanded && !isRelated;

              const strokeColor = isExpanded
                ? "#FFFFFF"
                : isRelated
                ? "#F26A1B"
                : node.isCriticalTarget || node.title === "Water SCADA"
                ? "#FF4D4F"
                : node.onAttackPath
                ? "#FF7A2B"
                : "rgba(255,255,255,0.22)";

              const fillColor = isExpanded
                ? node.isCriticalTarget
                  ? "#FF4D4F"
                  : "#F26A1B"
                : isRelated
                ? "#2A1810"
                : "#120D0B";

              const textColor = isExpanded
                ? "#FFFFFF"
                : node.isCriticalTarget || node.title === "Water SCADA"
                ? "#FF4D4F"
                : node.onAttackPath
                ? "#FF7A2B"
                : "#A09A96";

              return (
                <motion.g
                  key={node.id}
                  variants={itemVariants}
                  className="cursor-pointer group"
                  style={{
                    opacity: isDimmed ? 0.45 : 1,
                    transition: "opacity 300ms ease",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItem(node.id);
                  }}
                >
                  {/* Radial Energy Aura (from radial-orbital-timeline) */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={energyRadius}
                    fill={
                      node.isCriticalTarget || node.title === "Water SCADA"
                        ? "url(#crit-energy-grad)"
                        : "url(#node-energy-grad)"
                    }
                    className={
                      isPulsing || isExpanded || node.isCriticalTarget
                        ? "animate-plc-pulse"
                        : "opacity-0 group-hover:opacity-90 transition-opacity duration-300"
                    }
                  />

                  {/* Concentric Ping Rings on Active, Related, or Critical Target */}
                  {(isExpanded || isPulsing || node.isCriticalTarget) && (
                    <>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.r + 6}
                        fill="none"
                        stroke={
                          node.isCriticalTarget ? "#FF4D4F" : "#F26A1B"
                        }
                        strokeWidth="1.5"
                        strokeOpacity="0.6"
                        className="animate-svg-ping"
                      />
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.r + 11}
                        fill="none"
                        stroke={
                          node.isCriticalTarget ? "#FF4D4F" : "#F26A1B"
                        }
                        strokeWidth="1"
                        strokeOpacity="0.35"
                        className="animate-svg-ping"
                        style={{ animationDelay: "0.5s" }}
                      />
                    </>
                  )}

                  {/* Node Shape: Service Pill, Hexagon PLC, or Circle */}
                  <g
                    style={{
                      transform: isExpanded
                        ? "scale(1.32)"
                        : isRelated
                        ? "scale(1.12)"
                        : "scale(1)",
                      transformOrigin: `${node.x}px ${node.y}px`,
                      transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {node.shape === "service" ? (
                      <>
                        <rect
                          x={node.x - (node.title === "Hospital" ? 37 : 32)}
                          y={node.y - 13}
                          width={node.title === "Hospital" ? 74 : 64}
                          height="26"
                          rx="5"
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={isExpanded || isRelated ? "2" : "1.2"}
                          filter={
                            isExpanded ? "url(#orange-glow)" : undefined
                          }
                        />
                        <text
                          x={node.x}
                          y={node.y + 3}
                          fill="#FFFFFF"
                          fontSize="10.5"
                          fontWeight="600"
                          textAnchor="middle"
                          fontFamily="Manrope, sans-serif"
                        >
                          {node.title}
                        </text>
                      </>
                    ) : node.shape === "hex" ? (
                      <>
                        {node.isCriticalTarget && !isExpanded && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="23"
                            fill="none"
                            stroke="#FF4D4F"
                            strokeWidth="2"
                            className="animate-plc-pulse"
                          />
                        )}
                        <polygon
                          points={getHexPoints(node.x, node.y, node.r)}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={
                            isExpanded || node.isCriticalTarget ? "2.5" : "1.5"
                          }
                          filter={
                            node.isCriticalTarget || isExpanded
                              ? "url(#red-glow)"
                              : undefined
                          }
                        />
                        {node.shortLabel && (
                          <text
                            x={node.x}
                            y={node.y + 3}
                            fill={textColor}
                            fontSize="9"
                            fontWeight="700"
                            textAnchor="middle"
                            fontFamily="JetBrains Mono"
                          >
                            {node.shortLabel}
                          </text>
                        )}
                      </>
                    ) : (
                      <>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={node.r}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={
                            isExpanded || node.onAttackPath ? "2" : "1.5"
                          }
                          filter={
                            isExpanded ? "url(#orange-glow)" : undefined
                          }
                        />
                        {node.shortLabel && (
                          <text
                            x={node.x}
                            y={node.y + 3.5}
                            fill={textColor}
                            fontSize="8.5"
                            fontWeight="700"
                            textAnchor="middle"
                            fontFamily="JetBrains Mono"
                          >
                            {node.shortLabel}
                          </text>
                        )}
                      </>
                    )}
                  </g>

                  {/* Node Title Label below shape (for circle & hex nodes) */}
                  {node.shape !== "service" && (
                    <text
                      x={node.x}
                      y={node.y + node.r + (node.isCriticalTarget ? 13 : 10)}
                      fill={
                        isExpanded || node.isCriticalTarget
                          ? "#FFFFFF"
                          : node.onAttackPath || isRelated
                          ? "#A09A96"
                          : "#6F6863"
                      }
                      fontSize={node.isCriticalTarget ? "9.5" : "8.5"}
                      fontWeight={
                        isExpanded || node.isCriticalTarget ? "600" : "400"
                      }
                      textAnchor="middle"
                      fontFamily={
                        node.isCriticalTarget
                          ? "Manrope, sans-serif"
                          : "JetBrains Mono"
                      }
                    >
                      {node.title}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </motion.svg>

          {/* Interactive Floating shadcn Card Popover (from radial-orbital-timeline.tsx) */}
          {activeNode && (
            <div
              className="absolute z-30 w-64 transition-all duration-300"
              style={getCardStyle(activeNode)}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="w-64 bg-[#120D0B]/95 backdrop-blur-xl border-white/25 shadow-2xl shadow-black/90 overflow-visible">
                {activeNode.y > 210 ? (
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-px h-2.5 bg-[#F26A1B]/60"></div>
                ) : (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-px h-2.5 bg-[#F26A1B]/60"></div>
                )}
                <CardHeader className="pb-2 p-3.5">
                  <div className="flex justify-between items-center gap-1">
                    <Badge
                      className={`px-2 py-0.5 text-[10px] font-mono ${getStatusStyles(
                        activeNode.status
                      )}`}
                    >
                      {activeNode.status === "completed"
                        ? "BREACH PATH"
                        : activeNode.status === "in-progress"
                        ? "AT RISK"
                        : "MONITORED"}
                    </Badge>
                    <span className="text-[10px] font-mono text-white/50">
                      {activeNode.date}
                    </span>
                  </div>
                  <CardTitle className="text-sm mt-2 text-white font-semibold flex items-center justify-between">
                    <span>{activeNode.title}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedItems({});
                        setActiveNodeId(null);
                        setPulseEffect({});
                      }}
                      className="text-[10px] font-mono text-white/40 hover:text-white px-1"
                    >
                      ✕
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-white/80 p-3.5 pt-0">
                  <p className="leading-relaxed text-white/70 text-[11px]">
                    {activeNode.content}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-white/10">
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="flex items-center text-white/70">
                        <Zap size={10} className="mr-1 text-[#F26A1B]" />
                        Risk / Energy Level
                      </span>
                      <span className="font-mono text-[#F26A1B] font-semibold">
                        {activeNode.energy}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#F26A1B] to-[#FF4D4F] transition-all duration-500"
                        style={{ width: `${activeNode.energy}%` }}
                      ></div>
                    </div>
                  </div>

                  {activeNode.relatedIds.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/10">
                      <div className="flex items-center mb-1.5">
                        <Link size={10} className="text-white/70 mr-1" />
                        <h4 className="text-[10px] uppercase tracking-wider font-mono font-medium text-white/60">
                          Connected Nodes
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {activeNode.relatedIds.map((relatedId) => {
                          const relatedItem = DIAGRAM_NODES.find(
                            (i) => i.id === relatedId
                          );
                          return (
                            <Button
                              key={relatedId}
                              variant="outline"
                              size="sm"
                              className="flex items-center h-6 px-2 py-0 text-[10px] font-mono rounded border-white/20 bg-white/5 hover:bg-[#F26A1B]/20 hover:border-[#F26A1B]/50 text-white/85 hover:text-white transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleItem(relatedId);
                              }}
                            >
                              {relatedItem?.title}
                              <ArrowRight
                                size={8}
                                className="ml-1 text-[#F26A1B]"
                              />
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Caption below diagram */}
      <p className="mt-2 text-center font-mono text-[11px] tracking-wider text-[#6F6863]">
        illustrative · interactive attack topology
      </p>
    </div>
  );
}
