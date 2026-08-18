import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "@/assets/constants/Colors";
import { Message } from "@/assets/types";

interface MessageActionsSheetProps {
    visible: boolean;
    message: Message | null;
    onClose: () => void;
    onConvertToTask: () => void;
}

export default function MessageActionsSheet({ visible, message, onClose, onConvertToTask }: MessageActionsSheetProps) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
                <View style={styles.sheet}>
                    <Text style={styles.kicker}>MAKE THIS USEFUL</Text>
                    <Text style={styles.heading}>Turn message into an outcome</Text>
                    <Text style={styles.preview} numberOfLines={3}>{message?.text || "This message has no text to convert."}</Text>
                    <TouchableOpacity onPress={onConvertToTask} disabled={!message?.text} style={[styles.action, !message?.text && styles.disabledAction]}>
                        <View style={styles.actionIcon}><Text style={styles.actionIconText}>✓</Text></View>
                        <View style={styles.actionCopy}>
                            <Text style={styles.actionTitle}>Turn into task</Text>
                            <Text style={styles.actionSubtitle}>Keep the commitment visible in this Space.</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.42)", justifyContent: "flex-end" },
    dismissArea: { flex: 1 },
    sheet: { backgroundColor: Colors.surfaceLowest, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
    kicker: { color: Colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
    heading: { color: Colors.onSurface, fontSize: 20, fontWeight: "700" },
    preview: { color: Colors.onSurfaceVariant, fontSize: 14, lineHeight: 20, backgroundColor: Colors.surface, borderRadius: 12, padding: 12 },
    action: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, backgroundColor: Colors.primaryContainer },
    disabledAction: { opacity: 0.5 },
    actionIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
    actionIconText: { color: Colors.onPrimary, fontWeight: "800", fontSize: 18 },
    actionCopy: { flex: 1, gap: 2 },
    actionTitle: { color: Colors.onSurface, fontSize: 15, fontWeight: "700" },
    actionSubtitle: { color: Colors.onSurfaceVariant, fontSize: 12 },
    cancelButton: { alignItems: "center", paddingVertical: 11 },
    cancelText: { color: Colors.onSurfaceVariant, fontSize: 15, fontWeight: "600" },
});
