import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core } from 'cytoscape';
import {
  Network,
  Shield,
  Zap,
  Maximize2,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
} from 'lucide-react';
import {
  AttackGraphResponse,
  DependencyGraphResponse,
  ChokePointResponse,
} from '../types/api';
import { PURDUE_ZONE_COLORS, getRiskColor } from '../tokens';

interface GraphViewProps {
  attackGraph: AttackGraphResponse | null;
  dependencyGraph: DependencyGraphResponse | null;
  chokePoints: ChokePointResponse | null;
  loading?: boolean;
  onSelectAssetId: (assetId: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({
  attackGraph,
  dependencyGraph,
  chokePoints,
  loading = false,
  onSelectAssetId,
}) => {
  const [graphMode, setGraphMode] = useState<'attack' | 'dependency'>('attack');
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<any | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  // Initialize or re-render Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy existing instance
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    if (graphMode === 'attack') {
      if (!attackGraph || attackGraph.nodes.length === 0) return;

      const elements: any[] = [];
      const chokeSet = new Set((chokePoints?.choke_points || []).map((cp) => cp.asset_id));

      // Purdue Y-coordinate mapping for layered layout
      const purdueY: Record<string, number> = {
        INTERNET: 50,
        L4: 150,
        'L3.5': 270,
        L3: 390,
        L2: 510,
        L1: 630,
        L0: 750,
      };

      const xOffsets: Record<string, number> = {
        INTERNET: 400,
        L4: 150,
        'L3.5': 250,
        L3: 200,
        L2: 150,
        L1: 150,
        L0: 150,
      };

      attackGraph.nodes.forEach((n) => {
        const pLevel = n.purdue_level || 'L3';
        const y = purdueY[pLevel] || 300;
        const x = xOffsets[pLevel] || 200;
        xOffsets[pLevel] = x + 160;

        const isChoke = chokeSet.has(n.id);
        const nodeColor = PURDUE_ZONE_COLORS[pLevel] || '#3B82F6';
        const riskBorder = getRiskColor(n.risk_score);

        elements.push({
          data: {
            id: n.id,
            label: `${n.label}\n[${n.risk_score.toFixed(0)}]`,
            purdue: n.purdue_level,
            riskScore: n.risk_score,
            color: nodeColor,
            borderColor: isChoke ? '#A855F7' : riskBorder,
            borderWidth: isChoke ? 4 : 2,
            isChoke,
            rawNode: n,
          },
          position: { x, y },
        });
      });

      attackGraph.edges.forEach((e) => {
        elements.push({
          data: {
            id: e.id,
            source: e.source,
            target: e.target,
            label: `${e.protocol} (${(e.exploit_probability * 100).toFixed(0)}%)`,
            technique: e.technique_id,
            probability: e.exploit_probability,
            misconfiguration: e.misconfiguration,
          },
        });
      });

      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              color: '#F1F5F9',
              'font-size': '10px',
              'font-family': 'JetBrains Mono, monospace',
              'text-valign': 'center',
              'text-halign': 'center',
              'text-wrap': 'wrap',
              'text-max-width': '95px',
              'background-color': '#162032',
              'border-color': 'data(borderColor)',
              'border-width': 'data(borderWidth)',
              width: 100,
              height: 48,
              shape: 'round-rectangle',
            },
          },
          {
            selector: 'edge',
            style: {
              width: 2,
              'line-color': '#334155',
              'target-arrow-color': '#334155',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              label: 'data(label)',
              'font-size': '8px',
              'font-family': 'JetBrains Mono, monospace',
              color: '#94A3B8',
              'text-rotation': 'autorotate',
              'text-background-opacity': 0.8,
              'text-background-color': '#0F172A',
              'text-background-padding': '2px',
            },
          },
          {
            selector: 'edge[?misconfiguration]',
            style: {
              'line-color': '#EF4444',
              'target-arrow-color': '#EF4444',
              width: 2.5,
              'line-style': 'dashed',
            },
          },
          {
            selector: 'node:selected',
            style: {
              'border-color': '#38BDF8',
              'border-width': 4,
              'background-color': '#1E293B',
            },
          },
        ],
        layout: {
          name: 'preset',
        },
        minZoom: 0.2,
        maxZoom: 3,
        wheelSensitivity: 0.3,
      });

      cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        setSelectedNodeInfo(node.data('rawNode'));
        onSelectAssetId(node.id());
      });

      cy.fit(undefined, 40);
      cyRef.current = cy;
    } else {
      // Dependency Graph Mode
      if (!dependencyGraph || dependencyGraph.nodes.length === 0) return;

      const elements: any[] = [];
      dependencyGraph.nodes.forEach((n) => {
        elements.push({
          data: {
            id: n.id,
            label: `${n.label}\n(${n.baseline_outage_hours}h)`,
            site: n.site,
            type: n.type,
            people: n.people_served,
            rawNode: n,
          },
        });
      });

      dependencyGraph.edges.forEach((e) => {
        elements.push({
          data: {
            id: e.id,
            source: e.source,
            target: e.target,
            label: `${e.type} (+${e.failure_delay_hours}h delay)`,
            delay: e.failure_delay_hours,
            depType: e.type,
          },
        });
      });

      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              color: '#F1F5F9',
              'font-size': '10px',
              'font-family': 'Inter, sans-serif',
              'text-valign': 'center',
              'text-halign': 'center',
              'text-wrap': 'wrap',
              'text-max-width': '120px',
              'background-color': '#162032',
              'border-color': '#0284C7',
              'border-width': 2,
              width: 130,
              height: 52,
              shape: 'round-rectangle',
            },
          },
          {
            selector: 'node[type = "asset"]',
            style: {
              'background-color': '#1E293B',
              'border-color': '#EC4899',
              'border-width': 2,
              shape: 'diamond',
              width: 80,
              height: 50,
            },
          },
          {
            selector: 'edge',
            style: {
              width: 2.5,
              'line-color': '#0284C7',
              'target-arrow-color': '#0284C7',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              label: 'data(label)',
              'font-size': '8.5px',
              color: '#38BDF8',
              'text-background-opacity': 0.85,
              'text-background-color': '#0F172A',
              'text-background-padding': '2px',
            },
          },
        ],
        layout: {
          name: 'breadthfirst',
          directed: true,
          padding: 30,
          spacingFactor: 1.4,
        },
        minZoom: 0.2,
        maxZoom: 3,
        wheelSensitivity: 0.3,
      });

      cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        setSelectedNodeInfo(node.data('rawNode'));
      });

      cy.fit(undefined, 40);
      cyRef.current = cy;
    }
  }, [graphMode, attackGraph, dependencyGraph, chokePoints]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 40);

  return (
    <div className="space-y-4">
      {/* View Mode & Controls Bar */}
      <div className="p-3 rounded-xl bg-[#162032] border border-[#23324A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#111827] border border-[#23324A] rounded-lg p-1 text-xs">
            <button
              onClick={() => setGraphMode('attack')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition ${
                graphMode === 'attack'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Purdue Attack Reachability Graph
            </button>
            <button
              onClick={() => setGraphMode('dependency')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition ${
                graphMode === 'dependency'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Physical Consequence Cascade (CCE)
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden md:block">
            {graphMode === 'attack'
              ? 'Click any node to view traversal path & exploit chain.'
              : 'Displays cascading service failure delays and generator override.'}
          </div>
        </div>

        {/* Zoom & Fit Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-[#111827] border border-[#23324A] text-slate-300 hover:text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-[#111827] border border-[#23324A] text-slate-300 hover:text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFit}
            className="p-1.5 rounded-lg bg-[#111827] border border-[#23324A] text-slate-300 hover:text-white transition"
            title="Reset View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative rounded-xl border border-[#23324A] bg-[#0A0E17] h-[580px] overflow-hidden shadow-2xl">
        <div ref={containerRef} className="w-full h-full" />

        {loading && (
          <div className="absolute inset-0 bg-[#0A0E17]/80 backdrop-blur-sm flex flex-col items-center justify-center z-30">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-mono text-slate-300">Rendering Cyber-Physical Graph Topology...</p>
          </div>
        )}

        {/* Graph Legend Overlay */}
        <div className="absolute top-3 left-3 bg-[#111827]/90 border border-[#23324A] rounded-lg p-2.5 text-[11px] space-y-1.5 backdrop-blur z-10 pointer-events-none">
          <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
            {graphMode === 'attack' ? 'Purdue Model Zones' : 'Dependency Types'}
          </div>
          {graphMode === 'attack' ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {Object.entries(PURDUE_ZONE_COLORS).map(([lvl, color]) => (
                <div key={lvl} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-slate-300">{lvl}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-400" />
                <span className="text-slate-300">powers / controls</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-cyan-400" />
                <span className="text-slate-300">supplies_water</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-purple-400" />
                <span className="text-slate-300">monitors (level/sensor)</span>
              </div>
            </div>
          )}
        </div>

        {/* Selected Node Inspector Drawer */}
        {selectedNodeInfo && (
          <div className="absolute bottom-3 right-3 max-w-sm bg-[#111827]/95 border border-[#23324A] rounded-xl p-4 shadow-2xl text-xs space-y-2 backdrop-blur z-20">
            <div className="flex items-center justify-between border-b border-[#23324A] pb-2">
              <div className="font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                {selectedNodeInfo.label || selectedNodeInfo.name}
              </div>
              <button
                onClick={() => setSelectedNodeInfo(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            {selectedNodeInfo.risk_score !== undefined && (
              <div className="flex items-center justify-between text-slate-300">
                <span>Risk Score:</span>
                <span className="font-mono font-bold text-white">
                  {selectedNodeInfo.risk_score.toFixed(1)} / 100
                </span>
              </div>
            )}
            {selectedNodeInfo.purdue_level && (
              <div className="flex items-center justify-between text-slate-300">
                <span>Purdue Zone:</span>
                <span className="font-mono text-blue-300 font-semibold">
                  {selectedNodeInfo.purdue_level}
                </span>
              </div>
            )}
            {selectedNodeInfo.people_served !== undefined && (
              <div className="flex items-center justify-between text-slate-300">
                <span>People Served:</span>
                <span className="font-mono text-white">
                  {selectedNodeInfo.people_served.toLocaleString()}
                </span>
              </div>
            )}
            {selectedNodeInfo.vendor && (
              <div className="text-slate-400 text-[11px]">
                Product: {selectedNodeInfo.vendor} {selectedNodeInfo.product}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Strategic Choke Point Mitigations Bar */}
      <div className="p-4 rounded-xl bg-[#162032] border border-[#23324A] space-y-2.5">
        <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-purple-400" />
          Top Network Choke Points (Min-Cut / High Betweenness Bottlenecks)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(chokePoints?.choke_points || []).slice(0, 3).map((cp) => (
            <div
              key={cp.asset_id}
              className="p-3 rounded-lg bg-[#111827] border border-[#23324A] hover:border-purple-500/50 transition cursor-pointer"
              onClick={() => onSelectAssetId(cp.asset_id)}
            >
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>{cp.name}</span>
                <span className="text-[10px] text-purple-400 font-mono">
                  Btw: {cp.betweenness_centrality.toFixed(3)}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                {cp.recommended_action}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                <span>Cost: {cp.cost_engineer_hours}h</span>
                <span className="text-emerald-400 font-bold">
                  ΔRisk: -{(cp.estimated_risk_reduction * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
