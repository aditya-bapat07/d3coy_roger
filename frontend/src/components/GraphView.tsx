import React, { useEffect, useMemo, useRef, useState } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
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
  const [hover, setHover] = useState<HoverInfo | null>(null);

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
          stroke: shape === 'ellipse' ? TOKENS.nodeStroke : getRiskColor(n.risk_score),
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
            w: 56,
            h: 24,
            stroke: TOKENS.nodeStroke,
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
    const zoneWidth = contentWidth + 150;

    const elements: cytoscape.ElementDefinition[] = [];

    activeBands.forEach((band, bandIdx) => {
      const y = bandIdx * BAND_HEIGHT;
      const list = bandNodes.get(band)!;
      const label = purdueLabel(band);

      // Zone background rectangle (inert)
      elements.push({
        group: 'nodes',
        data: {
          id: `zone_${band}`,
          label,
          labelDx: -zoneWidth / 2 + label.length * 3.1 + 12,
          zw: zoneWidth,
          zh: BAND_HEIGHT - 10,
        },
        position: { x: 0, y: y + 6 },
        classes: 'zone',
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
            'background-color': '#FFFFFF',
            'border-width': 2,
            'border-color': 'data(stroke)',
            label: 'data(label)',
            'font-family': 'Inter, sans-serif',
            'font-size': 11,
            color: TOKENS.textPrimary,
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 4,
            'text-background-color': TOKENS.bgGraph,
            'text-background-opacity': 0.85,
            'text-background-padding': '1px',
          },
        },
        {
          selector: 'node.service',
          style: {
            'background-fill': 'linear-gradient',
            'background-gradient-direction': 'to-right',
            'background-gradient-stop-colors': `${TOKENS.accentPrimary} ${TOKENS.accentPrimary} #FFFFFF #FFFFFF`,
            'background-gradient-stop-positions': '0% 9% 9% 100%',
            'border-width': 1,
          } as any,
        },
        {
          selector: 'node.zone',
          style: {
            shape: 'round-rectangle',
            width: 'data(zw)',
            height: 'data(zh)',
            'background-color': TOKENS.bgSecondary,
            'background-opacity': 0.55,
            'border-width': 1,
            'border-color': TOKENS.borderSubtle,
            label: 'data(label)',
            'font-size': 10,
            color: TOKENS.textTertiary,
            'text-valign': 'top',
            'text-halign': 'center',
            'text-margin-x': 'data(labelDx)' as any,
            'text-margin-y': 15,
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
            color: TOKENS.riskCritical,
            'font-size': 12,
            'text-valign': 'center',
            'text-margin-y': 0,
            'text-background-opacity': 0,
            events: 'no',
            'z-index': 20,
          } as any,
        },
        {
          selector: 'edge',
          style: {
            width: 1.5,
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.7,
            'curve-style': 'bezier',
            opacity: 0.7,
            'z-index': 5,
          },
        },
        { selector: 'edge.misconfig', style: { 'line-style': 'dashed', 'line-dash-pattern': [5, 3] } as any },
        { selector: 'edge.faded', style: { opacity: 0.15 } },
        { selector: 'node.faded', style: { opacity: 0.45 } },
        {
          selector: 'edge.hl',
          style: {
            width: 2.5,
            'line-color': TOKENS.edgeHighlighted,
            'target-arrow-color': TOKENS.edgeHighlighted,
            opacity: 1,
            'z-index': 10,
          },
        },
        { selector: 'node.path', style: { 'font-weight': 600 as any, opacity: 1 } },
        {
          selector: 'node.selected-node',
          style: { 'border-color': TOKENS.nodeSelected, 'border-width': 3, 'font-weight': 600 as any, opacity: 1 },
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
      cy.destroy();
      if (cyRef.current === cy) cyRef.current = null;
    };
  }, [attackGraph, dependencyGraph, assetMap, typeMap]);

  // Apply focus highlighting whenever the selection changes.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
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
  }, [selectedAssetId, assetMap, attackGraph, dependencyGraph]);

  const zoomBy = (f: number) => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({ level: cy.zoom() * f, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  };

  const chokes = (chokePoints?.choke_points ?? []).slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-secondary">
          Attack reachability (Purdue levels, top to bottom) and the city services each OT asset operates. Click an asset
          to trace its most likely attack path.
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => zoomBy(1.2)} title="Zoom in" className="p-1.5 rounded text-ink-secondary hover:text-ink hover:bg-canvas-secondary transition-colors duration-150">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => zoomBy(1 / 1.2)} title="Zoom out" className="p-1.5 rounded text-ink-secondary hover:text-ink hover:bg-canvas-secondary transition-colors duration-150">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => cyRef.current?.fit(undefined, 24)} title="Fit to view" className="p-1.5 rounded text-ink-secondary hover:text-ink hover:bg-canvas-secondary transition-colors duration-150">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative bg-canvas-graph border border-line rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 190px)', minHeight: 480 }}>
        <div ref={containerRef} className="absolute inset-0" />

        {!attackGraph && <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-tertiary">Loading graph…</div>}

        {hover && (
          <div
            className="pointer-events-none absolute z-20 px-2 py-1 rounded border border-line bg-canvas-elevated text-xs text-ink whitespace-nowrap"
            style={{ left: hover.x + 12, top: hover.y + 12 }}
          >
            {hover.text}
          </div>
        )}

        <div className="absolute bottom-3 left-3 z-10 rounded border border-line bg-white/85 px-3 py-2 text-xs text-ink-secondary space-y-1.5">
          <div className="flex items-center gap-3">
            {(Object.keys(EDGE_COLORS) as EdgeKind[]).map((k) => (
              <span key={k} className="flex items-center gap-1">
                <span className="inline-block w-4 h-0.5" style={{ backgroundColor: EDGE_COLORS[k] }} />
                {EDGE_LABELS[k]}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {[
              ['Critical', TOKENS.riskCritical],
              ['High', TOKENS.riskHigh],
              ['Medium', TOKENS.riskMedium],
              ['Low', TOKENS.riskLow],
            ].map(([l, c]) => (
              <span key={l} className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full border-2 bg-white" style={{ borderColor: c }} />
                {l}
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span style={{ color: TOKENS.riskCritical }}>★</span> Crown jewel
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 border-t border-dashed" style={{ borderColor: TOKENS.nodeStroke }} /> Misconfigured
            </span>
          </div>
        </div>
      </div>

      {chokes.length > 0 && (
        <p className="text-sm text-ink-secondary">
          <span className="text-xs font-medium uppercase tracking-wide mr-2">Choke points</span>
          {chokes.map((cp, i) => (
            <React.Fragment key={cp.asset_id}>
              {i > 0 && <span className="mx-2 text-ink-tertiary">·</span>}
              <button onClick={() => onSelectAssetId(cp.asset_id)} className="text-accent hover:text-accent-hover hover:underline transition-colors duration-150">
                {cp.name}
              </button>
              <span className="ml-1 font-mono text-xs text-ink-tertiary">btw {cp.betweenness_centrality.toFixed(2)}</span>
            </React.Fragment>
          ))}
        </p>
      )}
    </div>
  );
};
