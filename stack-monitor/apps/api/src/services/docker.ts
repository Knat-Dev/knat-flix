import type { ContainerInfo } from "@arr/shared";
import Docker from "dockerode";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

export const getContainers = async (): Promise<ContainerInfo[]> => {
  const containers = await docker.listContainers({ all: true });

  return containers.map((container: Docker.ContainerInfo) => ({
    id: container.Id,
    name:
      container.Names[0]?.replace(/^\//, "") || container.Id.substring(0, 12),
    image: container.Image,
    state: container.State as ContainerInfo["state"],
    status: container.Status,
    ports: container.Ports.map(
      (p: Docker.Port) =>
        `${p.PublicPort || ""}:${p.PrivatePort}/${p.Type || "tcp"}`
    ).filter(Boolean),
    cpu: undefined,
    memory: undefined,
  }));
};

export const getContainerStats = async (
  containerId: string
): Promise<{ cpu: number; memory: number } | null> => {
  try {
    const container = docker.getContainer(containerId);
    const stats = await container.stats({ stream: false });

    // Check if we have valid CPU stats
    if (!stats.cpu_stats?.cpu_usage?.total_usage) {
      return {
        cpu: 0,
        memory: stats.memory_stats?.usage || 0,
      };
    }

    // Calculate CPU percentage
    const cpuDelta =
      stats.cpu_stats.cpu_usage.total_usage -
      (stats.precpu_stats?.cpu_usage?.total_usage || 0);
    const systemDelta =
      stats.cpu_stats.system_cpu_usage -
      (stats.precpu_stats?.system_cpu_usage || 0);
    const numCpus = stats.cpu_stats.online_cpus || stats.cpu_stats.cpu_usage.percpu_usage?.length || 1;
    const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0;

    // Memory usage in bytes
    const memory = stats.memory_stats?.usage || 0;

    return {
      cpu: Math.min(100, Math.max(0, cpuPercent)),
      memory,
    };
  } catch (error) {
    console.error(`Error getting stats for container ${containerId}:`, error);
    return null;
  }
};

export const restartContainer = async (containerId: string): Promise<void> => {
  const container = docker.getContainer(containerId);
  await container.restart();
};

export const getContainerLogs = async (
  containerId: string,
  tail: number = 100
): Promise<string[]> => {
  try {
    const container = docker.getContainer(containerId);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
    });

    return logs.toString().split("\n").filter(Boolean);
  } catch (error) {
    console.error(`Error getting logs for container ${containerId}:`, error);
    return [];
  }
};
