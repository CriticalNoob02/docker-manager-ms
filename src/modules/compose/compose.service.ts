import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import yaml from "js-yaml";
import docker from "../../config/docker";
import { parseComposeGraph } from "./compose.parser";
import type { ComposeStack, ComposeGraph } from "./compose.types";

const execFileAsync = promisify(execFile);

// ─── listStacks ─────────────────────────────────────────────────────────────

export async function listStacks(): Promise<ComposeStack[]> {
  try {
    const { stdout } = await execFileAsync("docker", [
      "compose",
      "ls",
      "--format",
      "json",
    ]);

    const raw: Array<{ Name: string; Status: string; ConfigFiles: string }> =
      JSON.parse(stdout.trim());

    return raw.map((s) => ({
      name: s.Name,
      // ConfigFiles may be comma-separated when --env-file or multiple -f flags are used;
      // take the first entry which is always the primary compose file.
      configFile: s.ConfigFiles.split(",")[0].trim(),
      status: s.Status,
    }));
  } catch {
    // docker compose ls fails if no stacks are running — return empty list
    return [];
  }
}

// ─── getStackGraph ───────────────────────────────────────────────────────────

export async function getStackGraph(
  configFile: string,
  options: { includeVolumes?: boolean } = {}
): Promise<ComposeGraph> {
  // 1. Read + parse the compose YAML
  const raw = await fs.readFile(configFile, "utf-8");
  const composeDoc = yaml.load(raw) as Record<string, any>;

  // 2. Get all containers (including stopped ones)
  const containers = await docker.listContainers({ all: true });

  // 3. Build a name → { status, id } map
  //    docker-compose names containers as "<project>-<service>-1" or "<service>-1"
  //    We try to match via the "com.docker.compose.service" label first (most reliable).
  const containerStatusMap: Record<string, { status: string; id: string }> = {};

  for (const c of containers) {
    const serviceLabel = c.Labels?.["com.docker.compose.service"];
    if (serviceLabel) {
      containerStatusMap[serviceLabel] = {
        status: c.State,
        id: c.Id,
      };
    }
  }

  // 4. Build and return the graph
  return parseComposeGraph(composeDoc, containerStatusMap, options);
}
