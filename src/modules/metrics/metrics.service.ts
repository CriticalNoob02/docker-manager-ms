import docker from "../../config/docker";

interface ContainerResourceStats {
  memUsageMb: number;
  memLimitMb: number;
  cpuPercent: number;
  ioReadMb: number;
  ioWriteMb: number;
  netRxMb: number;
  netTxMb: number;
}

async function readContainerStatsOnce(id: string): Promise<ContainerResourceStats | null> {
  try {
    const container = docker.getContainer(id);
    // With stream: false, dockerode resolves the Promise with the already-parsed
    // JSON object (not a ReadableStream), so we can use it directly.
    const s = (await container.stats({ stream: false })) as unknown as any;

    const cpuDelta =
      s.cpu_stats.cpu_usage.total_usage - s.precpu_stats.cpu_usage.total_usage;
    const systemDelta =
      s.cpu_stats.system_cpu_usage - s.precpu_stats.system_cpu_usage;
    const numCpus =
      s.cpu_stats.online_cpus ?? s.cpu_stats.cpu_usage.percpu_usage?.length ?? 1;
    const cpu = systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0;

    const memUsage = s.memory_stats?.usage ?? 0;
    const memLimit = s.memory_stats?.limit ?? 0;

    const blkio: Array<{ op: string; value: number }> =
      s.blkio_stats?.io_service_bytes_recursive ?? [];
    const ioRead = blkio
      .filter((b) => b.op === "Read")
      .reduce((acc, b) => acc + b.value, 0);
    const ioWrite = blkio
      .filter((b) => b.op === "Write")
      .reduce((acc, b) => acc + b.value, 0);

    const nets: Record<string, { rx_bytes: number; tx_bytes: number }> =
      s.networks ?? {};
    const netRx = Object.values(nets).reduce(
      (acc, n) => acc + (n.rx_bytes ?? 0),
      0
    );
    const netTx = Object.values(nets).reduce(
      (acc, n) => acc + (n.tx_bytes ?? 0),
      0
    );

    return {
      memUsageMb: memUsage / 1024 / 1024,
      memLimitMb: memLimit / 1024 / 1024,
      cpuPercent: parseFloat(cpu.toFixed(2)),
      ioReadMb: ioRead / 1024 / 1024,
      ioWriteMb: ioWrite / 1024 / 1024,
      netRxMb: netRx / 1024 / 1024,
      netTxMb: netTx / 1024 / 1024,
    };
  } catch {
    return null;
  }
}

export async function getMetrics() {
  const dockerAny = docker as any;
  const [allContainers, allImages, allNetworks] = await Promise.all([
    dockerAny.listContainers({ all: true, size: true }) as Promise<any[]>,
    docker.listImages({ all: false }),
    docker.listNetworks(),
  ]);

  const runningContainers = allContainers.filter(
    (c: any) => c.State === "running"
  );
  const stoppedContainers = allContainers.filter(
    (c: any) => c.State !== "running"
  );

  // One-shot stats for all running containers in parallel
  const statsResults = await Promise.all(
    runningContainers.map((c: any) => readContainerStatsOnce(c.Id))
  );
  const stats = statsResults.filter(Boolean) as ContainerResourceStats[];

  const totalMemMb = stats.reduce((acc, s) => acc + s.memUsageMb, 0);
  const totalMemLimitMb = stats.reduce((acc, s) => acc + s.memLimitMb, 0);
  const totalCpu = stats.reduce((acc, s) => acc + s.cpuPercent, 0);
  const totalIoReadMb = stats.reduce((acc, s) => acc + s.ioReadMb, 0);
  const totalIoWriteMb = stats.reduce((acc, s) => acc + s.ioWriteMb, 0);
  const totalNetRxMb = stats.reduce((acc, s) => acc + s.netRxMb, 0);
  const totalNetTxMb = stats.reduce((acc, s) => acc + s.netTxMb, 0);

  // Storage sizes
  const imagesSizeBytes = allImages.reduce(
    (acc: number, img: any) => acc + (img.Size ?? 0),
    0
  );
  const containersSizeBytes = allContainers.reduce(
    (acc: number, c: any) => acc + (c.SizeRootFs ?? 0),
    0
  );

  // Build networkId -> containers map from container list (listNetworks() does NOT
  // populate the Containers field — only individual network inspect() does).
  const networkContainersMap: Record<string, Array<{ name: string; ipv4: string }>> = {};
  for (const c of allContainers) {
    const nets: Record<string, any> = (c as any).NetworkSettings?.Networks ?? {};
    for (const [, net] of Object.entries(nets)) {
      const netId: string = net.NetworkID;
      if (!netId) continue;
      if (!networkContainersMap[netId]) networkContainersMap[netId] = [];
      networkContainersMap[netId].push({
        name: (c as any).Names?.[0]?.replace(/^\//, "") ?? c.Id.slice(0, 12),
        ipv4: net.IPAddress ?? "",
      });
    }
  }

  // Compose networks — those with the compose project label
  const composeNetworks = allNetworks
    .filter((n: any) => n.Labels?.["com.docker.compose.project"])
    .map((n: any) => {
      const attached = networkContainersMap[n.Id] ?? [];
      return {
        id: n.Id,
        name: n.Name,
        driver: n.Driver,
        project: n.Labels["com.docker.compose.project"] as string,
        service: (n.Labels["com.docker.compose.network"] as string) ?? null,
        containerCount: attached.length,
        containers: attached,
      };
    });

  // Group compose networks by project
  const projectMap: Record<
    string,
    {
      project: string;
      networks: typeof composeNetworks;
    }
  > = {};
  for (const net of composeNetworks) {
    if (!projectMap[net.project]) {
      projectMap[net.project] = { project: net.project, networks: [] };
    }
    projectMap[net.project].networks.push(net);
  }

  return {
    containers: {
      total: allContainers.length,
      running: runningContainers.length,
      stopped: stoppedContainers.length,
    },
    resources: {
      memUsageMb: parseFloat(totalMemMb.toFixed(2)),
      memLimitMb: parseFloat(totalMemLimitMb.toFixed(2)),
      cpuPercent: parseFloat(totalCpu.toFixed(2)),
      ioReadMb: parseFloat(totalIoReadMb.toFixed(2)),
      ioWriteMb: parseFloat(totalIoWriteMb.toFixed(2)),
      netRxMb: parseFloat(totalNetRxMb.toFixed(2)),
      netTxMb: parseFloat(totalNetTxMb.toFixed(2)),
    },
    storage: {
      imagesSizeBytes,
      containersSizeBytes,
      totalImages: allImages.length,
      totalContainers: allContainers.length,
    },
    composeProjects: Object.values(projectMap),
  };
}
