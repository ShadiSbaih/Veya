import { StyleSheet } from "react-native";
import { Colors } from "../constants/Colors";

export const styles = StyleSheet.create({
    row: { flexDirection: "row", marginBottom: 2 },
    rowMe: { justifyContent: "flex-end" },
    rowThem: { justifyContent: "flex-start" },
    bubble: {
        maxWidth: "76%",
        overflow: "hidden",
        marginTop: 12,
    },
    bubbleMe: {
        borderRadius: 12,
        backgroundColor: Colors.primary,
    },
    bubbleThem: {
        borderRadius: 12,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.outlineVariant + '40',
    },
    senderName: {
        fontSize: 10,
        fontWeight: "600",
        color: Colors.primary,
        paddingHorizontal: 14,
        paddingTop: 8,
    },
    mediaWrapper: { padding: 4 },
    mediaImage: { width: 220, height: 180, borderRadius: 12 },
    mediaVideo: { width: 220, height: 160, borderRadius: 12 },
    msgText: {
        fontSize: 16,
        lineHeight: 24, // better readability
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 4,
        letterSpacing: -0.1,
    },
    msgTextMe: { color: Colors.onPrimary },
    msgTextThem: { color: Colors.onSurface },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        paddingHorizontal: 14,
        paddingBottom: 6,
    },
    footerRight: { justifyContent: "flex-end" },
    footerLeft: { justifyContent: "flex-start" },
    timeText: { fontSize: 11 },
    timeMe: { color: `${Colors.onPrimary}88` },
    timeThem: { color: Colors.onSurfaceVariant },
});
