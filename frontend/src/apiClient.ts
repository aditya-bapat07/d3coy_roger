/**
 * Vidura Unified API Client with Automatic Offline & Fallback Support.
 *
 * When VITE_FALLBACK=1 is set (or if the backend is unreachable in offline mode),
 * requests automatically resolve from static responses in /fallback/*.json.
 */

export const isFallbackMode = (): boolean => {
  return (
    import.meta.env.VITE_FALLBACK === '1' ||
    import.meta.env.VITE_FALLBACK === 'true'
  );
};

export const API_BASE = 'http://127.0.0.1:8000/api';

/**
 * Resolves API path and request options to the corresponding fallback JSON path.
 */
function resolveFallbackPath(path: string, options?: RequestInit): string {
  // Normalize path by stripping host and leading /api
  let cleanPath = path.replace(/^http:\/\/[^/]+/, '');
  if (cleanPath.startsWith('/api')) {
    cleanPath = cleanPath.substring(4);
  }
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

  const method = (options?.method || 'GET').toUpperCase();

  // 1. Health, Meta, Scenario, Assumptions, Validation
  if (cleanPath.startsWith('/health')) return '/fallback/health.json';
  if (cleanPath.startsWith('/meta')) return '/fallback/meta.json';
  if (cleanPath.startsWith('/assumptions')) return '/fallback/assumptions.json';
  if (cleanPath.startsWith('/scenario')) return '/fallback/scenario.json';
  if (cleanPath.startsWith('/validation')) return '/fallback/validation.json';
  if (cleanPath.startsWith('/choke-points')) return '/fallback/choke_points.json';
  if (cleanPath.startsWith('/graph/dependency')) return '/fallback/graph_dependency.json';
  if (cleanPath.startsWith('/threat-drop') && method === 'GET') return '/fallback/threat_drop.json';

  // 2. Risk Overview
  if (cleanPath.startsWith('/risk/assets')) {
    if (cleanPath.includes('persona=opportunistic')) return '/fallback/risk_assets_opportunistic.json';
    if (cleanPath.includes('persona=insider')) return '/fallback/risk_assets_insider.json';
    return '/fallback/risk_assets_nation_state.json';
  }

  // 3. Attack Graph
  if (cleanPath.startsWith('/graph/attack')) {
    if (cleanPath.includes('persona=opportunistic')) return '/fallback/graph_attack_opportunistic.json';
    if (cleanPath.includes('persona=insider')) return '/fallback/graph_attack_insider.json';
    return '/fallback/graph_attack_nation_state.json';
  }

  // 4. Anomaly Inspection & Injections
  if (cleanPath.startsWith('/anomaly/')) {
    if (cleanPath.includes('water_scada')) return '/fallback/anomaly_water_scada.json';
    if (cleanPath.includes('vendor_vpn')) return '/fallback/anomaly_vendor_vpn.json';
    if (cleanPath.includes('chlorine') || cleanPath.includes('water_plc')) return '/fallback/anomaly_water_plc.json';
    return '/fallback/anomaly_water_scada.json';
  }
  if (cleanPath.startsWith('/anomaly/inject')) {
    return '/fallback/anomaly_inject_water_scada.json';
  }

  // 5. POST Flows
  if (cleanPath === '/reset' || cleanPath === '/session/reset') {
    return '/fallback/reset.json';
  }

  if (cleanPath.startsWith('/threat-drop/toggle')) {
    try {
      const body = options?.body ? JSON.parse(options.body.toString()) : {};
      if (body.active === false) return '/fallback/threat_drop_toggle_inactive.json';
    } catch {
      // ignore JSON parse error
    }
    return '/fallback/threat_drop_toggle_active.json';
  }

  if (cleanPath.startsWith('/remediation/plan')) {
    return '/fallback/remediation_plan_20h.json';
  }

  if (cleanPath.startsWith('/simulate')) {
    try {
      const body = options?.body ? JSON.parse(options.body.toString()) : {};
      const actions = body.applied_actions || [];
      if (actions.length >= 3) return '/fallback/whatif_water_plc_all_three.json';
      if (actions.includes('act_mfa_vpn')) return '/fallback/whatif_water_plc_mfa_vpn.json';
      if (actions.includes('act_seg_jump')) return '/fallback/whatif_water_plc_seg_jump.json';
      if (actions.includes('act_mon_water_plc')) return '/fallback/whatif_water_plc_mon.json';
    } catch {
      // ignore JSON parse error
    }
    return '/fallback/simulate.json';
  }

  // Default fallback
  return '/fallback/health.json';
}

/**
 * Universal fetch wrapper that routes to local fallback static files when
 * offline or in fallback mode.
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  // Compute normalized full URL
  let normalizedPath = path.replace(/^http:\/\/[^/]+/, '');
  if (!normalizedPath.startsWith('/')) normalizedPath = '/' + normalizedPath;
  if (!normalizedPath.startsWith('/api/')) {
    normalizedPath = '/api' + normalizedPath;
  }
  const fullUrl = `http://127.0.0.1:8000${normalizedPath}`;

  if (isFallbackMode()) {
    const fallbackPath = resolveFallbackPath(path, options);
    return fetch(fallbackPath);
  }

  try {
    const response = await fetch(fullUrl, options);
    if (!response.ok && response.status >= 500) {
      // Server error: fallback gracefully
      const fallbackPath = resolveFallbackPath(path, options);
      console.warn(`[Vidura API] Backend error (${response.status}); falling back to ${fallbackPath}`);
      return fetch(fallbackPath);
    }
    return response;
  } catch (networkError) {
    // Network offline / connection refused: fallback gracefully
    const fallbackPath = resolveFallbackPath(path, options);
    console.warn(`[Vidura API] Network offline; serving fallback data from ${fallbackPath}`);
    return fetch(fallbackPath);
  }
}

/**
 * JSON convenience wrapper for apiFetch.
 */
export async function apiFetchJson<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    throw new Error(`API Request to ${path} failed with status ${res.status}`);
  }
  return res.json();
}
