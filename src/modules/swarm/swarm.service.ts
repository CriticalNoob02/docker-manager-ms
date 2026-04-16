import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import os from "os";
import path from "path";
import docker from "../../config/docker";
import { NotFoundError, AppError } from "../../utils/errors";
import type { SwarmInfo, SwarmNode, SwarmService, SwarmTask, SwarmStack, ServicePort } from "./swarm.types";

const execFileAsync = promisify(execFile);

// ─── Info ────────────────────────────────────────────────────────────────────

export async function getSwarmInfo(): Promise<SwarmInfo> {
  try {
    const info = await docker.swarmInspect();
    const nodes = await docker.listNodes();
    const managers = nodes.filter((n: any) => n.Spec?.Role === "manager").length;

    return {
      id: info.ID,
      createdAt: info.CreatedAt,
      updatedAt: info.UpdatedAt,
      nodes: nodes.length,
      managers,
    };
  } catch {
    throw new AppError("Swarm não está ativo neste host", 409);
  }
}

export async function initSwarm(advertiseAddr?: string): Promise<{ joinTokenWorker: string; joinTokenManager: string }> {
  try {
    await docker.swarmInit({ AdvertiseAddr: advertiseAddr } as any);
  } catch (err: any) {
    // 503 = already part of a swarm
    if (err?.statusCode !== 503) throw new AppError(`Falha ao inicializar Swarm: ${err.message}`, 500);
  }
  const info = await docker.swarmInspect();
  return {
    joinTokenWorker: (info as any).JoinTokens?.Worker ?? "",
    joinTokenManager: (info as any).JoinTokens?.Manager ?? "",
  };
}

export async function getJoinTokens(): Promise<{ worker: string; manager: string }> {
  try {
    const info = await docker.swarmInspect();
    return {
      worker: (info as any).JoinTokens?.Worker ?? "",
      manager: (info as any).JoinTokens?.Manager ?? "",
    };
  } catch {
    throw new AppError("Swarm não está ativo neste host", 409);
  }
}

export async function leaveSwarm(force = false): Promise<void> {
  try {
    await (docker as any).swarmLeave({ Force: force });
  } catch (err: any) {
    throw new AppError(`Falha ao sair do Swarm: ${err.message}`, 500);
  }
}

// ─── Nodes ───────────────────────────────────────────────────────────────────

export async function listNodes(): Promise<SwarmNode[]> {
  const nodes = await docker.listNodes();
  return nodes.map(mapNode);
}

export async function inspectNode(id: string): Promise<SwarmNode> {
  try {
    const node = await docker.getNode(id).inspect();
    return mapNode(node);
  } catch {
    throw new NotFoundError("Node");
  }
}

export async function updateNode(
  id: string,
  role: "manager" | "worker",
  availability: "active" | "pause" | "drain"
): Promise<void> {
  try {
    const node = docker.getNode(id);
    const info = await node.inspect();
    await node.update({
      version: info.Version.Index,
      Availability: availability,
      Role: role,
      Labels: info.Spec?.Labels ?? {},
    });
  } catch (err: any) {
    if (err?.statusCode === 404) throw new NotFoundError("Node");
    throw err;
  }
}

export async function removeNode(id: string): Promise<void> {
  try {
    await docker.getNode(id).remove({ force: true } as any);
  } catch (err: any) {
    if (err?.statusCode === 404) throw new NotFoundError("Node");
    throw err;
  }
}

// ─── Services ────────────────────────────────────────────────────────────────

export async function listServices(): Promise<SwarmService[]> {
  const [services, tasks] = await Promise.all([
    docker.listServices({ status: true } as any),
    docker.listTasks({ filters: { "desired-state": ["running"] } } as any),
  ]);

  const runningByService: Record<string, number> = {};
  for (const t of tasks as unknown as any[]) {
    const sid = t.ServiceID;
    if (t.Status?.State === "running") {
      runningByService[sid] = (runningByService[sid] ?? 0) + 1;
    }
  }

  return (services as unknown as any[]).map((s) => mapService(s, runningByService[s.ID] ?? 0));
}

export async function inspectService(id: string): Promise<SwarmService> {
  try {
    const s = await docker.getService(id).inspect();
    const tasks = await docker.listTasks({
      filters: { service: [id], "desired-state": ["running"] },
    } as any);
    const running = (tasks as unknown as any[]).filter((t: any) => t.Status?.State === "running").length;
    return mapService(s, running);
  } catch (err: any) {
    if (err?.statusCode === 404) throw new NotFoundError("Service");
    throw err;
  }
}

export async function scaleService(id: string, replicas: number): Promise<void> {
  try {
    const service = docker.getService(id);
    const info = await service.inspect();

    if (info.Spec?.Mode?.Global !== undefined) {
      throw new AppError("Serviços em modo global não suportam escalonamento manual", 400);
    }

    await service.update({
      version: info.Version.Index,
      ...info.Spec,
      Mode: { Replicated: { Replicas: replicas } },
    });
  } catch (err: any) {
    if (err?.statusCode === 404) throw new NotFoundError("Service");
    if (err instanceof AppError) throw err;
    throw err;
  }
}

export async function removeService(id: string): Promise<void> {
  try {
    await docker.getService(id).remove();
  } catch (err: any) {
    if (err?.statusCode === 404) throw new NotFoundError("Service");
    throw err;
  }
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function listTasks(serviceId?: string): Promise<SwarmTask[]> {
  const filters: any = serviceId ? { service: [serviceId] } : {};
  const [tasks, services, nodes] = await Promise.all([
    docker.listTasks({ filters } as any),
    docker.listServices().catch(() => [] as any[]),
    docker.listNodes().catch(() => [] as any[]),
  ]);

  const serviceNames: Record<string, string> = {};
  for (const s of services as unknown as any[]) serviceNames[s.ID] = s.Spec?.Name ?? s.ID;

  const nodeHostnames: Record<string, string> = {};
  for (const n of nodes as unknown as any[]) nodeHostnames[n.ID] = n.Description?.Hostname ?? n.ID;

  return (tasks as unknown as any[]).map((t) => mapTask(t, serviceNames, nodeHostnames));
}

// ─── Stacks ──────────────────────────────────────────────────────────────────

export async function listStacks(): Promise<SwarmStack[]> {
  try {
    const { stdout } = await execFileAsync("docker", ["stack", "ls", "--format", "{{.Name}}\t{{.Services}}"]);
    const lines = stdout.trim().split("\n").filter(Boolean);
    return lines.map((line) => {
      const [name, servicesStr] = line.split("\t");
      return { name: name.trim(), services: parseInt(servicesStr?.trim() ?? "0", 10) };
    });
  } catch {
    return [];
  }
}

export async function deployStack(name: string, composeYaml: string): Promise<void> {
  const tmpFile = path.join(os.tmpdir(), `stack-${name}-${Date.now()}.yml`);
  try {
    await fs.writeFile(tmpFile, composeYaml, "utf-8");
    await execFileAsync("docker", ["stack", "deploy", "-c", tmpFile, "--detach=false", name]);
  } finally {
    await fs.unlink(tmpFile).catch(() => {});
  }
}

export async function removeStack(name: string): Promise<void> {
  try {
    await execFileAsync("docker", ["stack", "rm", name]);
  } catch (err: any) {
    throw new AppError(`Falha ao remover stack: ${err.message}`, 500);
  }
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapNode(n: any): SwarmNode {
  return {
    id: n.ID,
    hostname: n.Description?.Hostname ?? "",
    status: n.Status?.State ?? "unknown",
    availability: n.Spec?.Availability ?? "active",
    role: n.Spec?.Role ?? "worker",
    engineVersion: n.Description?.Engine?.EngineVersion ?? "",
    addr: n.Status?.Addr ?? "",
    leader: n.ManagerStatus?.Leader === true,
  };
}

function mapService(s: any, running: number): SwarmService {
  const replicated = s.Spec?.Mode?.Replicated;
  const isGlobal = s.Spec?.Mode?.Global !== undefined;
  const ports: ServicePort[] = (s.Endpoint?.Ports ?? []).map((p: any) => ({
    protocol: p.Protocol ?? "tcp",
    targetPort: p.TargetPort ?? 0,
    publishedPort: p.PublishedPort ?? 0,
    publishMode: p.PublishMode ?? "ingress",
  }));

  return {
    id: s.ID,
    name: s.Spec?.Name ?? "",
    image: s.Spec?.TaskTemplate?.ContainerSpec?.Image ?? "",
    mode: isGlobal ? "global" : "replicated",
    replicas: isGlobal ? null : (replicated?.Replicas ?? 0),
    running,
    ports,
    createdAt: s.CreatedAt ?? "",
    updatedAt: s.UpdatedAt ?? "",
  };
}

function mapTask(t: any, serviceNames: Record<string, string>, nodeHostnames: Record<string, string>): SwarmTask {
  return {
    id: t.ID,
    serviceId: t.ServiceID ?? "",
    serviceName: serviceNames[t.ServiceID] ?? t.ServiceID ?? "",
    nodeId: t.NodeID ?? "",
    nodeHostname: nodeHostnames[t.NodeID] ?? t.NodeID ?? "",
    slot: t.Slot ?? 0,
    state: t.Status?.State ?? "unknown",
    desiredState: t.DesiredState ?? "unknown",
    image: t.Spec?.ContainerSpec?.Image ?? "",
    createdAt: t.CreatedAt ?? "",
    updatedAt: t.UpdatedAt ?? "",
    error: t.Status?.Err,
  };
}
