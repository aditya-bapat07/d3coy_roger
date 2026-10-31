import React, { useEffect, useMemo, useRef, useState } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import { Maximize2, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import {
  AttackGraphResponse,
  DependencyGraphResponse,
  ChokePointResponse,
  RiskOverviewResponse,
} from '../types/api';
import { TOKENS, getRiskColor, purdueLabel } from '../tokens';
import { ScenarioMeta, isCrownJewel, shortName } from '../display';

interface GraphViewProps {
  attackGraph: AttackGraphResponse | null;
  dependencyGraph: DependencyGraphResponse | null;
  chokePoints: ChokePointResponse | null;
  loading?: boolean;
  onSelectAssetId: (assetId: string) => void;
  onClearSelection?: () => void;
  overview?: RiskOverviewResponse | null;
  scenarioMeta?: ScenarioMeta | null;
  selectedAssetId?: string | null;
}

type EdgeKind = 'exploit' | 'credential' | 'controls' | 'dependency';

interface HoverInfo {
  x: number;
  y: number;
  text: string;
}

const BANDS = ['INTERNET', 'L4', 'L3.5', 'L3', 'L2', 'L1', 'L0', 'SERVICES'];
const OT_BANDS = new Set(['L3', 'L2', 'L1', 'L0']);
const SITE_ORDER = ['external', 'vendor', 'corporate', 'dmz', 'power', 'water', 'hospital', 'city'];
const X_SPACING = 104;
const BAND_HEIGHT = 92;
const CREDENTIAL_TECHNIQUES = new Set(['T1694.001', 'T0859', 'T0812']);

const EDGE_COLORS: Record<EdgeKind, string> = {
  exploit: TOKENS.edgeExploit,
  credential: TOKENS.edgeCredential,
  controls: TOKENS.edgeControls,
  dependency: TOKENS.edgeDependency,
};

const EDGE_LABELS: Record<EdgeKind, string> = {
  exploit: 'Exploit',
  credential: 'Credential',
  controls: 'Controls',
  dependency: 'Dependency',
};

function shapeForType(type: string | undefined): { shape: string; w: number; h: number } {
  const t = (type ?? '').toLowerCase();
  if (t === 'network zone') return { shape: 'ellipse', w: 22, h: 22 };
  if (!t.includes('domain') && /plc|rtu|ied|controller/.test(t)) return { shape: 'hexagon', w: 40, h: 36 };
  if (/switch|firewall|vpn/.test(t)) return { shape: 'diamond', w: 40, h: 40 };
  if (/physical/.test(t)) return { shape: 'rectangle', w: 34, h: 24 };
  return { shape: 'round-rectangle', w: 40, h: 28 };
}

export const GraphView: React.FC<GraphViewProps> = ({
  attackGraph,
  dependencyGraph,
  chokePoints,
  onSelectAssetId,
  onClearSelection,
  overview,
  scenarioMeta,
  selectedAssetId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  const assetMap = useMemo(() => new Map((overview?.assets ?? []).map((a) => [a.asset_id, a])), [overview]);
  const typeMap = useMemo(() => new Map((scenarioMeta?.assets ?? []).map((a) => [a.id, a])), [scenarioMeta]);

  // Keep callbacks fresh without rebuilding the graph.
  const selectRef = useRef(onSelectAssetId);
  const clearRef = useRef(onClearSelection);
  selectRef.current = onSelectAssetId;
  clearRef.current = onClearSelection;

  useEffect(() => {
    if (!containerRef.current || !attackGraph || attackGraph.nodes.length === 0) return;

    cyRef.current?.destroy();
    cyRef.current = null;

    // ── Collect nodes into Purdue bands ──────────────────────────
    interface LayoutNode {
      id: string;
      band: string;
      site: string;
      data: Record<string, unknown>;
    }
    const layoutNodes: LayoutNode[] = [];

    attackGraph.nodes.forEach((n) => {
      const meta = typeMap.get(n.id);
      const risk = assetMap.get(n.id);
      const { shape, w, h } = shapeForType(meta?.type);
      const crown = risk ? isCrownJewel(risk) : false;
      const scale = crown ? 1.2 : 1;
      const strokeColor = shape === 'ellipse' ? TOKENS.nodeStroke : getRiskColor(n.risk_score);

      layoutNodes.push({
        id: n.id,
        band: BANDS.includes(n.purdue_level) ? n.purdue_level : 'L3',
        site: (n.site || '').toLowerCase(),
        data: {
          id: n.id,
          label: shortName(n.id, n.label),
          fullName: n.label,
          kind: 'asset',
          shape,
          w: w * scale,
          h: h * scale,
          stroke: strokeColor,
          risk: n.risk_score,
          zone: purdueLabel(n.purdue_level),
          crown,
        },
      });
    });

    (dependencyGraph?.nodes ?? [])
      .filter((n) => n.type === 'service')
      .forEach((n) => {
        layoutNodes.push({
          id: n.id,
          band: 'SERVICES',
          site: (n.site || '').toLowerCase(),
          data: {
            id: n.id,
            label: shortName(n.id, n.label),
            fullName: n.label,
            kind: 'service',
            shape: 'rectangle',
            w: 58,
            h: 24,
            stroke: TOKENS.accentPrimary,
            people: n.people_served,
            zone: 'City service',
            crown: false,
          },
        });
      });

    const bandNodes = new Map<string, LayoutNode[]>();
    BANDS.forEach((b) => bandNodes.set(b, []));
    layoutNodes.forEach((n) => bandNodes.get(n.band)!.push(n));
    const siteRank = (s: string) => {
      const i = SITE_ORDER.indexOf(s);
      return i === -1 ? SITE_ORDER.length : i;
    };
    bandNodes.forEach((list) => list.sort((a, b) => siteRank(a.site) - siteRank(b.site) || a.id.localeCompare(b.id)));

    const activeBands = BANDS.filter((b) => bandNodes.get(b)!.length > 0);
    const maxCount = Math.max(...activeBands.map((b) => bandNodes.get(b)!.length));
    const contentWidth = (maxCount - 1) * X_SPACING;
    const zoneWidth = contentWidth + 160;

    const elements: cytoscape.ElementDefinition[] = [];

    activeBands.forEach((band, bandIdx) => {
      const y = bandIdx * BAND_HEIGHT;
      const list = bandNodes.get(band)!;
      const label = purdueLabel(band).toUpperCase();
      const isOT = OT_BANDS.has(band);

      // Zone background lane (inert)
      elements.push({
        group: 'nodes',
        data: {
          id: `zone_${band}`,
          label,
          labelDx: -zoneWidth / 2 + label.length * 3.4 + 14,
          zw: zoneWidth,
          zh: BAND_HEIGHT - 10,
          zoneBg: isOT ? '#18110D' : '#100D0B',
          zoneBorder: isOT ? 'rgba(242, 106, 27, 0.12)' : 'rgba(255, 255, 255, 0.06)',
        },
        position: { x: 0, y: y + 6 },
        classes: `zone ${isOT ? 'zone-ot' : 'zone-it'}`,
        selectable: false,
        grabbable: false,
      });

      const startX = -((list.length - 1) * X_SPACING) / 2;
      list.forEach((n, i) => {
        const x = startX + i * X_SPACING;
        elements.push({ group: 'nodes', data: n.data, position: { x, y }, classes: n.data.kind as string });
        if (n.data.crown) {
          elements.push({
            group: 'nodes',
            data: { id: `star_${n.id}`, label: '★' },
            position: { x: x + (n.data.w as number) / 2 - 2, y: y - (n.data.h as number) / 2 + 2 },
            classes: 'star',
            selectable: false,
            grabbable: false,
          });
        }
      });
    });

    const nodeIds = new Set(layoutNodes.map((n) => n.id));

    attackGraph.edges.forEach((e) => {
      if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) return;
      const isCred =
        (e.technique_id && CREDENTIAL_TECHNIQUES.has(e.technique_id)) ||
        /credential|valid accounts/i.test(e.technique_name ?? '');
      const kind: EdgeKind = isCred ? 'credential' : 'exploit';
      const target = assetMap.get(e.target);
      elements.push({
        group: 'edges',
        data: {
          id: `atk_${e.id}`,
          source: e.source,
          target: e.target,
          kind,
          color: EDGE_COLORS[kind],
          cve: kind === 'exploit' ? target?.best_cve ?? null : null,
          technique: e.technique_id ? `${e.technique_id} ${e.technique_name ?? ''}` : '',
          proto: `${e.protocol}/${e.port}`,
          prob: e.exploit_probability,
        },
        classes: e.misconfiguration ? 'misconfig' : '',
      });
    });

    (dependencyGraph?.edges ?? []).forEach((e) => {
      if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) return;
      const srcIsService = e.source.startsWith('service_');
      const kind: EdgeKind = srcIsService ? 'dependency' : 'controls';
      elements.push({
        group: 'edges',
        data: {
          id: `dep_${e.id}`,
          source: e.source,
          target: e.target,
          kind,
          color: EDGE_COLORS[kind],
          depType: e.type,
          delay: e.failure_delay_hours,
        },
      });
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      layout: { name: 'preset' },
      autoungrabify: true,
      boxSelectionEnabled: false,
      minZoom: 0.3,
      maxZoom: 2.5,
      wheelSensitivity: 0.25,
      style: [
        {
          selector: 'node',
          style: {
            shape: 'data(shape)' as any,
            width: 'data(w)',
            height: 'data(h)',
            'background-color': '#140E0C',
            'background-opacity': 0.85,
            'border-width': 1.5,
            'border-color': 'data(stroke)',
            label: 'data(label)',
            'font-family': 'Inter, sans-serif',
            'font-size': 11,
            color: '#CFC8C3',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 5,
            'text-outline-color': '#0A0706',
            'text-outline-width': 2,
            'text-outline-opacity': 0.9,
            'shadow-blur': 8,
            'shadow-color': 'data(stroke)' as any,
            'shadow-opacity': 0.4,
            'shadow-offset-x': 0,
            'shadow-offset-y': 0,
            'transition-property': 'border-color, border-width, shadow-opacity, opacity',
            'transition-duration': 0.15,
          } as any,
        },
        {
          selector: 'node.service',
          style: {
            'background-fill': 'linear-gradient',
            'background-gradient-direction': 'to-right',
            'background-gradient-stop-colors': `${TOKENS.accentPrimary} ${TOKENS.accentPrimary} #140E0C #140E0C`,
            'background-gradient-stop-positions': '0% 12% 12% 100%',
            'border-width': 1,
            'border-color': 'rgba(255, 255, 255, 0.15)',
          } as any,
        },
        {
          selector: 'node.zone',
          style: {
            shape: 'round-rectangle',
            width: 'data(zw)',
            height: 'data(zh)',
            'background-color': 'data(zoneBg)' as any,
            'background-opacity': 0.65,
            'border-width': 1,
            'border-color': 'data(zoneBorder)' as any,
            label: 'data(label)',
            'font-size': 9,
            'font-weight': 600 as any,
            color: '#6F6863',
            'text-valign': 'top',
            'text-halign': 'center',
            'text-margin-x': 'data(labelDx)' as any,
            'text-margin-y': 14,
            'text-background-opacity': 0,
            events: 'no',
            'z-index': 0,
            'z-compound-depth': 'bottom',
          } as any,
        },
        {
          selector: 'node.star',
          style: {
            width: 1,
            height: 1,
            'background-opacity': 0,
            'border-width': 0,
            label: 'data(label)',
            color: TOKENS.crownJewel,
            'font-size': 13,
            'text-valign': 'center',
            'text-margin-y': 0,
            'text-background-opacity': 0,
            'shadow-blur': 10,
            'shadow-color': TOKENS.crownJewel,
            'shadow-opacity': 0.8,
            events: 'no',
            'z-index': 20,
          } as any,
        },
        {
          selector: 'edge',
          style: {
            width: 1.2,
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.7,
            'curve-style': 'bezier',
            opacity: 0.45,
            'z-index': 5,
            'transition-property': 'opacity, width, line-color',
            'transition-duration': 0.2,
          },
        },
        {
          selector: 'edge.misconfig',
          style: {
            'line-style': 'dashed',
            'line-dash-pattern': [5, 3],
          } as any,
        },
        { selector: 'edge.faded', style: { opacity: 0.12 } },
        { selector: 'node.faded', style: { opacity: 0.15 } },
        {
          selector: 'edge.hl',
          style: {
            width: 2.8,
            'line-color': TOKENS.accentHover,
            'target-arrow-color': TOKENS.accentHover,
            'line-style': 'dashed',
            'line-dash-pattern': [6, 3],
            opacity: 1,
            'shadow-blur': 12,
            'shadow-color': TOKENS.accentPrimary,
            'shadow-opacity': 0.8,
            'z-index': 10,
          } as any,
        },
        {
          selector: 'node.path',
          style: {
            'border-color': TOKENS.accentHover,
            'border-width': 2.5,
            'shadow-blur': 12,
            'shadow-color': TOKENS.accentHover,
            'shadow-opacity': 0.7,
            opacity: 1,
          } as any,
        },
        {
          selector: 'node.selected-node',
          style: {
            'border-color': TOKENS.nodeSelected,
            'border-width': 3,
            'shadow-blur': 16,
            'shadow-color': TOKENS.nodeSelected,
            'shadow-opacity': 0.95,
            opacity: 1,
          } as any,
        },
      ],
    });

    cy.on('tap', 'node.asset, node.service', (evt: EventObject) => {
      const id = evt.target.id();
      if (evt.target.hasClass('asset')) selectRef.current(id);
    });
    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) clearRef.current?.();
    });

    cy.on('mouseover', 'node.asset, node.service', (evt: EventObject) => {
      const d = evt.target.data();
      const p = evt.renderedPosition ?? evt.target.renderedPosition();
      const text =
        d.kind === 'service'
          ? `${d.fullName} · ${Number(d.people).toLocaleString()} people`
          : `${d.fullName} · Risk: ${Number(d.risk).toFixed(1)} · ${d.zone}`;
      setHover({ x: p.x, y: p.y, text });
      containerRef.current!.style.cursor = d.kind === 'asset' ? 'pointer' : 'default';
    });
    cy.on('mouseover', 'edge', (evt: EventObject) => {
      const d = evt.target.data();
      const p = evt.renderedPosition;
      let text = EDGE_LABELS[d.kind as EdgeKind];
      if (d.kind === 'exploit' || d.kind === 'credential') {
        text += ` · ${d.proto}`;
        if (d.cve) text += ` · ${d.cve}`;
        if (d.technique) text += ` · ${d.technique.trim()}`;
        if (evt.target.hasClass('misconfig')) text += ' · misconfigured rule';
      } else {
        text += ` · ${d.depType}${d.delay ? ` (+${d.delay}h)` : ''}`;
      }
      setHover({ x: p.x, y: p.y, text });
    });
    cy.on('mouseout', 'node, edge', () => {
      setHover(null);
      if (containerRef.current) containerRef.current.style.cursor = 'default';
    });
    cy.on('viewport', () => setHover(null));

    cy.fit(undefined, 24);
    cyRef.current = cy;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      cy.destroy();
      if (cyRef.current === cy) cyRef.current = null;
    };
  }, [attackGraph, dependencyGraph, assetMap, typeMap]);

  // Apply focus highlighting and animated flowing dash whenever the selection changes.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    cy.batch(() => {
      cy.elements().removeClass('hl faded path selected-node');
      if (!selectedAssetId) return;

      const node = cy.getElementById(selectedAssetId);
      if (node.empty()) return;

      node.addClass('selected-node');
      const path = assetMap.get(selectedAssetId)?.path_from_entry ?? [];
      const hlEdges = cy.collection();
      for (let i = 0; i < path.length - 1; i++) {
        hlEdges.merge(cy.edges(`[source = "${path[i]}"][target = "${path[i + 1]}"]`));
        cy.getElementById(path[i]).addClass('path');
      }
      cy.edges().not(hlEdges).addClass('faded');
      hlEdges.addClass('hl');
      const pathIds = new Set([...path, selectedAssetId]);
      cy.nodes('.asset, .service')
        .filter((n) => !pathIds.has(n.id()))
        .addClass('faded');
    });

    // Animate flowing dash offset on highlighted edges
    if (selectedAssetId) {
      let offset = 0;
      let lastTime = performance.now();
      const step = (time: number) => {
        if (time - lastTime > 40) {
          offset = (offset - 1.5) % 24;
          cy.edges('.hl').style('line-dash-offset', offset);
          lastTime = time;
        }
        animFrameRef.current = requestAnimationFrame(step);
      };
      animFrameRef.current = requestAnimationFrame(step);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [selectedAssetId, assetMap, attackGraph, dependencyGraph]);

  const zoomBy = (f: number) => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({ level: cy.zoom() * f, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  };

  const chokes = (chokePoints?.choke_points ?? []).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Description header & Circular glass zoom toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-[#A09A96]">
          Attack reachability (Purdue levels, top to bottom) and municipal services operated. Click an asset to trace its attack path.
        </p>
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => setShowLegend((prev) => !prev)}
            title="Toggle legend"
            className="glass-btn-circle"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoomBy(1.2)}
            title="Zoom in"
            className="glass-btn-circle"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoomBy(1 / 1.2)}
            title="Zoom out"
            className="glass-btn-circle"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => cyRef.current?.fit(undefined, 24)}
            title="Fit to view"
            className="glass-btn-circle"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas container: Glass card with dark background, corner orange radial glow, and faint dotted pattern */}
      <div
        className="glass-card relative overflow-hidden bg-[#0A0706]"
        style={{
          height: 'calc(100vh - 250px)',
          minHeight: 480,
          backgroundImage:
            'radial-gradient(circle at top right, rgba(242, 106, 27, 0.08) 0%, transparent 50%), radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 24px 24px',
        }}
      >
        <div ref={containerRef} className="absolute inset-0" />

        {!attackGraph && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[#6F6863]">
            Loading attack &amp; dependency graph…
          </div>
        )}

        {/* Dynamic Hover Tooltip */}
        {hover && (
          <div
            className="pointer-events-none absolute z-30 px-3 py-1.5 rounded-xl border border-white/10 bg-[#120D0B]/95 text-xs text-white shadow-2xl backdrop-blur-md whitespace-nowrap"
            style={{ left: hover.x + 14, top: hover.y + 14 }}
          >
            {hover.text}
          </div>
        )}

        {/* Legend: Compact glass panel at top-right (leaves bottom-left City services fully visible!) */}
        {showLegend && (
          <div className="glass-card absolute top-3 right-3 z-20 px-3.5 py-2.5 bg-[#120D0B]/90 backdrop-blur-xl border border-white/10 text-xs text-[#A09A96] space-y-2 shadow-2xl transition-all">
            <div className="flex items-center gap-3 text-[11px]">
              {(Object.keys(EDGE_COLORS) as EdgeKind[]).map((k) => (
                <span key={k} className="flex items-center gap-1.5 font-medium">
                  <span className="inline-block w-3.5 h-0.5 rounded-full" style={{ backgroundColor: EDGE_COLORS[k] }} />
                  {EDGE_LABELS[k]}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 text-[11px] pt-1 border-t border-white/[0.06]">
              {[
                ['Critical', TOKENS.riskCritical],
                ['High', TOKENS.riskHigh],
                ['Medium', TOKENS.riskMedium],
                ['Low', TOKENS.riskLow],
              ].map(([l, c]) => (
                <span key={l} className="flex items-center gap-1 font-medium">
                  <span className="inline-block w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                  {l}
                </span>
              ))}
              <span className="flex items-center gap-1 text-[#FFB340] font-medium">
                <span>★</span> Crown jewel
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3.5 border-t border-dashed border-white/40" /> Misconfig
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Choke points footer row: glass pills with orange links */}
      {chokes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6F6863] mr-1">
            Choke points
          </span>
          {chokes.map((cp) => (
            <div
              key={cp.asset_id}
              className="glass-pill px-3 py-1.5 rounded-full inline-flex items-center gap-2 text-xs"
            >
              <button
                onClick={() => onSelectAssetId(cp.asset_id)}
                className="text-[#F26A1B] hover:text-[#FF7A2B] hover:underline font-medium transition-colors"
              >
                {cp.name}
              </button>
              <span className="font-mono text-[11px] text-[#6F6863]">
                btw {cp.betweenness_centrality.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
