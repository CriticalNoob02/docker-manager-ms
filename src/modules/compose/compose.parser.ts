import type { ServiceNode, GraphEdge, ComposeGraph } from "./compose.types";

type ServiceMap = Record<string, any>;
type VolumeMap = Record<string, any>;
type ContainerStatusMap = Record<string, { status: string; id: string }>;

// ─── Edge extractors ────────────────────────────────────────────────────────
// Each extractor is a pure function — add new ones without touching others.

function extractDependsOnEdges(services: ServiceMap): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (const [name, svc] of Object.entries(services)) {
    const deps = svc?.depends_on;
    if (!deps) continue;

    const targets: string[] =
      Array.isArray(deps)
        ? deps
        : typeof deps === "object"
        ? Object.keys(deps)
        : [];

    for (const dep of targets) {
      edges.push({
        id: `dep-${name}-${dep}`,
        source: name,
        target: dep,
        relation: "depends_on",
      });
    }
  }
  return edges;
}

function extractNetworkEdges(services: ServiceMap): GraphEdge[] {
  // Build network → [services] map, then create edges between co-members
  const networkMembers: Record<string, string[]> = {};

  for (const [name, svc] of Object.entries(services)) {
    const nets = svc?.networks;
    if (!nets) continue;
    const netNames: string[] = Array.isArray(nets) ? nets : Object.keys(nets);
    for (const net of netNames) {
      if (!networkMembers[net]) networkMembers[net] = [];
      networkMembers[net].push(name);
    }
  }

  const seen = new Set<string>();
  const edges: GraphEdge[] = [];

  for (const [net, members] of Object.entries(networkMembers)) {
    if (members.length < 2) continue;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = members[i];
        const b = members[j];
        const key = [a, b].sort().join("--");
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({
          id: `net-${net}-${a}-${b}`,
          source: a,
          target: b,
          relation: "network",
        });
      }
    }
  }
  return edges;
}

function extractEnvRefEdges(services: ServiceMap): GraphEdge[] {
  const serviceNames = Object.keys(services);
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  for (const [name, svc] of Object.entries(services)) {
    const env = svc?.environment;
    if (!env) continue;

    const values: string[] = Array.isArray(env)
      ? env.map((e: string) => e.split("=").slice(1).join("="))
      : Object.values(env).map(String);

    for (const val of values) {
      for (const target of serviceNames) {
        if (target === name) continue;
        if (!val.includes(target)) continue;
        const key = `${name}->${target}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({
          id: `env-${name}-${target}`,
          source: name,
          target,
          relation: "env_ref",
        });
      }
    }
  }
  return edges;
}

function extractVolumeEdges(services: ServiceMap, volumeKeys: string[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  for (const [name, svc] of Object.entries(services)) {
    const vols: string[] = (svc?.volumes ?? []).map((v: string) =>
      typeof v === "string" ? v.split(":")[0] : ""
    );

    for (const vol of vols) {
      if (!volumeKeys.includes(vol)) continue; // only named volumes, not bind mounts
      const key = `${name}--${vol}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        id: `vol-${name}-${vol}`,
        source: name,
        target: `vol-${vol}`,
        relation: "volume",
      });
    }
  }
  return edges;
}

// ─── Main parser ────────────────────────────────────────────────────────────

export function parseComposeGraph(
  composeDoc: Record<string, any>,
  containerStatuses: ContainerStatusMap,
  options: { includeVolumes?: boolean } = {}
): ComposeGraph {
  const services: ServiceMap = composeDoc.services ?? {};
  const volumes: VolumeMap = composeDoc.volumes ?? {};
  const volumeKeys = Object.keys(volumes);

  // Build service nodes
  const serviceNodes: ServiceNode[] = Object.entries(services).map(([name, svc]) => {
    const match = containerStatuses[name];
    const rawPorts: string[] = (svc?.ports ?? []).map((p: any) =>
      typeof p === "object" ? `${p.published ?? ""}:${p.target ?? ""}` : String(p)
    );
    return {
      id: name,
      type: "service",
      label: name,
      image: svc?.image ?? svc?.build ? (svc?.image ?? "(build)") : undefined,
      ports: rawPorts,
      status: match?.status,
      containerId: match?.id,
    };
  });

  // Build volume nodes (nice to have)
  const volumeNodes: ServiceNode[] = options.includeVolumes
    ? volumeKeys.map((vol) => ({
        id: `vol-${vol}`,
        type: "volume",
        label: vol,
      }))
    : [];

  // Collect edges from all extractors
  const edges: GraphEdge[] = [
    ...extractDependsOnEdges(services),
    ...extractNetworkEdges(services),
    ...extractEnvRefEdges(services),
    ...(options.includeVolumes ? extractVolumeEdges(services, volumeKeys) : []),
  ];

  // De-duplicate edges (same source+target may appear from multiple extractors)
  const seenEdges = new Set<string>();
  const uniqueEdges = edges.filter((e) => {
    const key = `${e.relation}:${e.source}:${e.target}`;
    if (seenEdges.has(key)) return false;
    seenEdges.add(key);
    return true;
  });

  return {
    nodes: [...serviceNodes, ...volumeNodes],
    edges: uniqueEdges,
  };
}
