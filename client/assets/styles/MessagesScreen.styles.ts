import { StyleSheet, Platform } from "react-native";
import { Colors } from "../constants/Colors";

export const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.surfaceLowest,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 12 : 24,
        paddingBottom: 16,
        backgroundColor: Colors.surfaceLowest,
    },
    title: { 
        fontSize: 32,
        fontWeight: "700", 
        color: Colors.onSurface,
        letterSpacing: -1.0,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    iconButton: {
        position: "relative",
        padding: 4,
    },
    floatingBadge: {
        position: "absolute",
        top: 0,
        right: -4,
        backgroundColor: Colors.primary,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    floatingBadgeText: {
        fontSize: 10,
        fontWeight: "bold",
        color: Colors.onPrimary,
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginHorizontal: 24,
        marginBottom: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: Colors.surfaceLow,
    },
    searchInput: { flex: 1, fontSize: 16, color: Colors.onSurface },
    divider: { height: 1, backgroundColor: Colors.surfaceHigh, marginHorizontal: 24 },
    listContent: { paddingHorizontal: 12, paddingBottom: 40, paddingTop: 6, flexGrow: 1 },
    empty: { 
        flex: 1,
        alignItems: "center", 
        justifyContent: "flex-start",
        paddingTop: 20, 
        gap: 8 
    },
    emptyTitle: { fontSize: 20, fontWeight: "600", color: Colors.onSurface, letterSpacing: -0.5, marginTop: -20 },
    emptySubtitle: { fontSize: 15, color: Colors.onSurfaceVariant },
});
