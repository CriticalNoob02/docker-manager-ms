export interface SwarmInfo {
  id: string;
  createdAt: string;
  updatedAt: string;
  nodes: number;
  managers: number;
}

export interface SwarmNode {
  id: string;
  hostname: string;
  status: string;          // "ready" | "down" | "disconnected"
  availability: string;    // "active" | "pause" | "drain"
  role: string;            // "manager" | "worker"
  engineVersion: string;
  addr: string;
  leader: boolean;
}

export interface SwarmService {
  id: string;
  name: string;
  image: string;
  mode: string;            // "replicated" | "global"
  replicas: number | null; // null for global mode
  running: number;
  ports: ServicePort[];
  createdAt: string;
  updatedAt: string;
}

export interface ServicePort {
  protocol: string;
  targetPort: number;
  publishedPort: number;
  publishMode: string;
}

export interface SwarmTask {
  id: string;
  serviceId: string;
  serviceName: string;
  nodeId: string;
  nodeHostname: string;
  slot: number;
  state: string;           // "running" | "failed" | "complete" | "shutdown" | ...
  desiredState: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface SwarmStack {
  name: string;
  services: number;
}
