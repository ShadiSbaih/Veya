import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/assets/constants/Colors";

interface SpaceCreationModalProps {
    visible: boolean;
    onClose: () => void;
    onCreate: (input: { title: string; goal?: string; deadline?: string }) => Promise<void>;
}

export default function SpaceCreationModal({ visible, onClose, onCreate }: SpaceCreationModalProps) {
    const [title, setTitle] = useState("");
    const [goal, setGoal] = useState("");
    const [deadline, setDeadline] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!visible) return;
        setTitle("");
        setGoal("");
        setDeadline("");
        setLoading(false);
    }, [visible]);

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    const handleCreate = async () => {
        if (!title.trim() || loading) return;
        setLoading(true);
        try {
            await onCreate({
                title: title.trim(),
                goal: goal.trim() || undefined,
                deadline: deadline.trim() || undefined,
            });
            onClose();
        } catch {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="layers-outline" size={22} color={Colors.primary} />
                        </View>
                        <View style={styles.headerCopy}>
                            <Text style={styles.title}>Create a Space</Text>
                            <Text style={styles.subtitle}>Give this conversation a shared outcome.</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={22} color={Colors.onSurfaceVariant} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentInsetAdjustmentBehavior="automatic"
                        contentContainerStyle={styles.content}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={styles.label}>Space name</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g. Hackathon prototype"
                            placeholderTextColor={Colors.outlineVariant}
                            maxLength={120}
                            style={styles.input}
                            autoFocus
                        />

                        <Text style={styles.label}>Goal <Text style={styles.optional}>(optional)</Text></Text>
                        <TextInput
                            value={goal}
                            onChangeText={setGoal}
                            placeholder="What should this group accomplish?"
                            placeholderTextColor={Colors.outlineVariant}
                            maxLength={500}
                            multiline
                            style={[styles.input, styles.multilineInput]}
                        />

                        <Text style={styles.label}>Deadline <Text style={styles.optional}>(optional)</Text></Text>
                        <TextInput
                            value={deadline}
                            onChangeText={setDeadline}
                            placeholder="e.g. 2026-08-25"
                            placeholderTextColor={Colors.outlineVariant}
                            style={styles.input}
                            autoCapitalize="none"
                        />
                        <Text style={styles.hint}>Use YYYY-MM-DD so everyone sees the same date.</Text>

                        <TouchableOpacity
                            onPress={handleCreate}
                            disabled={!title.trim() || loading}
                            style={[styles.createButton, (!title.trim() || loading) && styles.disabledButton]}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.onPrimary} />
                            ) : (
                                <Text style={styles.createButtonText}>Create Space</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.42)" },
    sheet: {
        maxHeight: "92%",
        backgroundColor: Colors.surfaceLowest,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceHigh,
    },
    headerIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.primaryContainer,
    },
    headerCopy: { flex: 1, gap: 3 },
    title: { color: Colors.onSurface, fontSize: 19, fontWeight: "700" },
    subtitle: { color: Colors.onSurfaceVariant, fontSize: 13 },
    closeButton: { padding: 6 },
    content: { padding: 20, gap: 10 },
    label: { color: Colors.onSurface, fontSize: 14, fontWeight: "600", marginTop: 6 },
    optional: { color: Colors.onSurfaceVariant, fontWeight: "400" },
    input: {
        minHeight: 48,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.outline,
        backgroundColor: Colors.surface,
        color: Colors.onSurface,
        fontSize: 16,
    },
    multilineInput: { minHeight: 92, paddingTop: 14, textAlignVertical: "top" },
    hint: { color: Colors.onSurfaceVariant, fontSize: 12, marginTop: -3 },
    createButton: {
        minHeight: 50,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.primary,
        marginTop: 12,
    },
    disabledButton: { opacity: 0.45 },
    createButtonText: { color: Colors.onPrimary, fontSize: 16, fontWeight: "700" },
});
