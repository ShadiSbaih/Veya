import { StyleSheet } from "react-native";
import { Colors } from "../constants/Colors";

export const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14, // A bit more breathing room
        borderRadius: 12,
        backgroundColor: Colors.surfaceLowest, // Base card color
        borderWidth: 1,
        borderColor: "transparent",
        marginBottom: 8,
    },
    rowSelected: { backgroundColor: Colors.surfaceHigh },
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
    time: { fontSize: 13, color: Colors.outline, marginLeft: 8 },
    lastMsg: {
        fontSize: 14, // Slightly larger for readability
        color: Colors.onSurfaceVariant,
        marginTop: 4,
    },
    contextualRow: {
        backgroundColor: "#fde0ec", // card-tint-rose or another pastel tint from Notion
        borderColor: "#fde0ec",
        shadowColor: "#0f0f0f",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 2,
    },
    contextBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: Colors.primary,
        borderRadius: 12, // 12 for badges/avatars usually means round, keep it circle
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.surfaceLowest,
    },
    contextName: {
        color: "#37352f", // charcoal from Notion
        fontSize: 18,
        fontWeight: "600",
    },
    contextSub: {
        fontSize: 13,
        color: "#5d5b54", // slate
        fontWeight: "500",
        marginTop: 2,
    }
});
