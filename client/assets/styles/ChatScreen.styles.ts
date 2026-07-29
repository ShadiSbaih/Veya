import { StyleSheet, Platform } from "react-native";
import { Colors } from "../constants/Colors";

export const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.surfaceLowest },
    kav: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 8 : 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceHigh,
        backgroundColor: Colors.surfaceLowest, // Crisp white header
        gap: 12,
    },
    backBtn: { padding: 4 },
    headerInfo: { flex: 1, minWidth: 0 },
    headerName: { fontSize: 17, fontWeight: "600", color: Colors.onSurface, letterSpacing: -0.2 },
    headerHandle: { fontSize: 14, fontWeight: "500", color: Colors.onSurfaceVariant },
    headerSub: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 2 },
    headerActions: { flexDirection: "row", gap: 6 },
    headerBtn: { padding: 8, borderRadius: 8, backgroundColor: Colors.surface }, // rounded.md
    messageList: { paddingHorizontal: 16, paddingVertical: 16 },
    typingRow: { paddingHorizontal: 20, paddingVertical: 4 },
    typingText: { fontSize: 12, color: Colors.primary, fontStyle: "italic", fontWeight: "500" },
    inputBar: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.surfaceHigh,
        backgroundColor: Colors.surfaceLowest,
    },
    mediaPreview: {
        marginBottom: 12,
        alignSelf: "flex-start",
        position: "relative",
    },
    mediaThumb: {
        width: 100,
        height: 100,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.outlineVariant,
    },
    mediaRemove: {
        position: "absolute",
        top: -10,
        right: -10,
        backgroundColor: Colors.error,
        borderRadius: 12,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8, // Notion rounded.md instead of pill
        backgroundColor: Colors.surface, // Light surface for input
        borderWidth: 1,
        borderColor: Colors.surfaceHigh,
    },
    attachBtn: { padding: 8, opacity: 0.7 },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: Colors.onSurface,
        maxHeight: 120,
        paddingVertical: 10,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 8, // Square-ish rounded button
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.primary,
    },
    sendBtnDisabled: { opacity: 0.4 },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    emptyText: { fontSize: 16, color: Colors.onSurfaceVariant, fontWeight: "500" },
});
