export interface ServiceNode {
  id: string;
  type: "service" | "volume";
  label: string;
  image?: string;
  ports?: string[];
  status?: string;      // "running" | "exited" | "paused" | undefined (not deployed)
  containerId?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: "depends_on" | "network" | "env_ref" | "volume";
}

export interface ComposeGraph {
  nodes: ServiceNode[];
  edges: GraphEdge[];
}

export interface ComposeStack {
  name: string;
  configFile: string;
  status: string;
}
