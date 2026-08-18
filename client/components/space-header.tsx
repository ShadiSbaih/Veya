import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/assets/constants/Colors";
import { Space, SpaceStatus, Task, TaskStatus } from "@/assets/types";
import { formatSpaceDeadline, getSpaceStatusLabel, SPACE_STATUS_OPTIONS } from "@/utils/space";

interface SpaceHeaderProps {
    space: Space;
    onStatusChange: (status: SpaceStatus) => Promise<void>;
    onAddTask?: () => void;
    tasks?: Task[];
    onTaskStatusChange?: (task: Task, status: TaskStatus) => Promise<void>;
}

export default function SpaceHeader({ space, onStatusChange, onAddTask, tasks = [], onTaskStatusChange }: SpaceHeaderProps) {
    const [expanded, setExpanded] = useState(false);
    const [updating, setUpdating] = useState(false);

    const handleStatusChange = async (status: SpaceStatus) => {
        if (status === space.status || updating) return;
        setUpdating(true);
        try {
            await onStatusChange(status);
        } finally {
            setUpdating(false);
        }
    };

    const deadline = formatSpaceDeadline(space.deadline);

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.header} onPress={() => setExpanded((value) => !value)} activeOpacity={0.75}>
                <View style={styles.iconContainer}>
                    <Ionicons name="layers" size={20} color={Colors.primary} />
                </View>
                <View style={styles.copy}>
                    <Text style={styles.title} numberOfLines={1}>{space.title}</Text>
                    <Text style={styles.goal} numberOfLines={1}>{space.goal || "A shared space for this conversation"}</Text>
                </View>
                <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{getSpaceStatusLabel(space.status)}</Text>
                </View>
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={Colors.outlineVariant} />
            </TouchableOpacity>

            {expanded && (
                <View style={styles.details}>
                    <View style={styles.metaRow}>
                        <Ionicons name="flag-outline" size={16} color={Colors.onSurfaceVariant} />
                        <Text style={styles.metaText}>{space.goal || "No goal added yet"}</Text>
                    </View>
                    {deadline && (
                        <View style={styles.metaRow}>
                            <Ionicons name="calendar-outline" size={16} color={Colors.onSurfaceVariant} />
                            <Text style={styles.metaText}>Due {deadline}</Text>
                        </View>
                    )}
                    <View style={styles.actionsHeading}>
                        <Text style={styles.sectionLabel}>Actions</Text>
                        <Text style={styles.actionCount}>{tasks.filter((task) => task.status === "done").length}/{tasks.length} done</Text>
                    </View>
                    {tasks.length === 0 ? (
                        <Text style={styles.emptyActions}>No actions yet. Add the next concrete step.</Text>
                    ) : (
                        <View style={styles.taskList}>
                            {tasks.map((task) => (
                                <TouchableOpacity
                                    key={task._id}
                                    onPress={() => onTaskStatusChange?.(task, task.status === "done" ? "todo" : "done")}
                                    style={styles.taskRow}
                                    disabled={!onTaskStatusChange}
                                >
                                    <Ionicons
                                        name={task.status === "done" ? "checkmark-circle" : "ellipse-outline"}
                                        size={19}
                                        color={task.status === "done" ? Colors.primary : Colors.onSurfaceVariant}
                                    />
                                    <Text style={[styles.taskTitle, task.status === "done" && styles.completedTaskTitle]} numberOfLines={2}>
                                        {task.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    <Text style={styles.sectionLabel}>Move Space to</Text>
                    <View style={styles.statusOptions}>
                        {SPACE_STATUS_OPTIONS.map((status) => (
                            <TouchableOpacity
                                key={status}
                                onPress={() => handleStatusChange(status)}
                                disabled={updating}
                                style={[styles.statusOption, status === space.status && styles.activeStatusOption]}
                            >
                                <Text style={[styles.statusOptionText, status === space.status && styles.activeStatusOptionText]}>
                                    {getSpaceStatusLabel(status)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {onAddTask && (
                        <TouchableOpacity onPress={onAddTask} style={styles.addActionButton}>
                            <Ionicons name="add" size={16} color={Colors.primary} />
                            <Text style={styles.addActionText}>Add action</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: Colors.primaryContainer, borderBottomWidth: 1, borderBottomColor: Colors.surfaceHigh },
    header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 11 },
    iconContainer: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surfaceLowest },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    title: { color: Colors.onSurface, fontSize: 15, fontWeight: "700" },
    goal: { color: Colors.onSurfaceVariant, fontSize: 12 },
    statusPill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: Colors.surfaceLowest },
    statusText: { color: Colors.primaryDeep, fontSize: 11, fontWeight: "700" },
    details: { paddingHorizontal: 16, paddingBottom: 14, gap: 9 },
    metaRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    metaText: { flex: 1, color: Colors.onSurfaceVariant, fontSize: 13 },
    sectionLabel: { color: Colors.onSurface, fontSize: 12, fontWeight: "700", marginTop: 2 },
    actionsHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 3 },
    actionCount: { color: Colors.onSurfaceVariant, fontSize: 12, fontWeight: "600" },
    emptyActions: { color: Colors.onSurfaceVariant, fontSize: 12, paddingVertical: 4 },
    taskList: { gap: 7 },
    taskRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 },
    taskTitle: { flex: 1, color: Colors.onSurface, fontSize: 13, lineHeight: 18 },
    completedTaskTitle: { color: Colors.onSurfaceVariant, textDecorationLine: "line-through" },
    statusOptions: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
    statusOption: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.surfaceLowest },
    activeStatusOption: { backgroundColor: Colors.primary },
    statusOptionText: { color: Colors.onSurfaceVariant, fontSize: 12, fontWeight: "600" },
    activeStatusOptionText: { color: Colors.onPrimary },
    addActionButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: Colors.surfaceLowest },
    addActionText: { color: Colors.primary, fontSize: 12, fontWeight: "700" },
});
