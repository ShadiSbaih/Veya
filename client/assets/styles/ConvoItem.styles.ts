import { StyleSheet } from "react-native";
import { Colors } from "../constants/Colors";

export const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 15,
        borderRadius: 18,
        backgroundColor: Colors.surfaceLowest, // Base card color
        borderWidth: 1,
        borderColor: Colors.surfaceHigh,
        marginBottom: 10,
    },
    rowSelected: { backgroundColor: Colors.primaryContainer, borderColor: Colors.primaryContainer },
    info: { flex: 1, minWidth: 0 },
    topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
    nameCol: { flex: 1, minWidth: 0 },
    name: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.onSurface,
        letterSpacing: -0.2,
    },
    handle: {
        fontSize: 13,
        fontWeight: "500",
        color: Colors.onSurfaceVariant, // Less prominent
        marginTop: 2,
    },
    time: { fontSize: 12, color: Colors.onSurfaceVariant, marginLeft: 8 },
    lastMsg: {
        fontSize: 14, // Slightly larger for readability
        color: Colors.onSurfaceVariant,
        marginTop: 4,
    },
    contextualRow: {
        backgroundColor: Colors.aiContainer,
        borderColor: Colors.aiContainer,
    },
    contextBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: Colors.ai,
        borderRadius: 12, // 12 for badges/avatars usually means round, keep it circle
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.aiContainer,
    },
    contextName: {
        color: Colors.onAiContainer,
        fontSize: 16,
        fontWeight: "600",
    },
    contextSub: {
        fontSize: 13,
        color: Colors.onSurfaceVariant,
        fontWeight: "500",
        marginTop: 2,
    }
});
