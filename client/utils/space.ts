import { SpaceStatus } from "@/assets/types";

export const SPACE_STATUS_OPTIONS: SpaceStatus[] = [
    "discussing",
    "deciding",
    "executing",
    "completed",
    "archived",
];

export function getSpaceStatusLabel(status: SpaceStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatSpaceDeadline(deadline?: string): string | undefined {
    if (!deadline) return undefined;
    const parsed = new Date(deadline);
    if (Number.isNaN(parsed.getTime())) return deadline;
    return parsed.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
