import { z } from "zod";

// --- CONTAINER CONTRACT ---
export const ContainerStateSchema = z.enum([
  "running",
  "exited",
  "dead",
  "paused",
  "restarting",
  "created",
  "removing",
]);

export const ContainerInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  state: ContainerStateSchema,
  status: z.string(), // "Up 2 hours"
  ports: z.array(z.string()),
  cpu: z.number().optional(),
  memory: z.number().optional(),
});

export type ContainerInfo = z.infer<typeof ContainerInfoSchema>;

// --- BACKUP CONTRACT ---
export const BackupJobSchema = z.object({
  id: z.string(),
  filename: z.string(),
  sizeBytes: z.number(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  createdAt: z.string(),
  location: z.enum(["local", "s3"]),
  includesMediaConfig: z.boolean().optional(),
});

export type BackupJob = z.infer<typeof BackupJobSchema>;

// --- SOCKET EVENTS ---
export interface ServerToClientEvents {
  "containers:sync": (data: ContainerInfo[]) => void;
  "stats:tick": (data: Record<string, { cpu: number; memory: number }>) => void;
  "backup:progress": (job: BackupJob) => void;
}

export interface ClientToServerEvents {
  "logs:subscribe": (containerId: string) => void;
  "logs:unsubscribe": (containerId: string) => void;
}
