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
import { Colors } from "@/assets/constants/Colors";
import { User } from "@/assets/types";

interface TaskCreationModalProps {
    visible: boolean;
    participants: User[];
    initialTitle?: string;
    sourceMessageId?: string;
    onClose: () => void;
    onCreate: (input: {
        title: string;
        description?: string;
        assignee?: string;
        dueDate?: string;
        sourceMessageId?: string;
    }) => Promise<void>;
}

export default function TaskCreationModal({
    visible,
    participants,
    initialTitle,
    sourceMessageId,
    onClose,
    onCreate,
}: TaskCreationModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignee, setAssignee] = useState<string | undefined>();
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!visible) return;
        setTitle(initialTitle || "");
        setDescription("");
        setAssignee(undefined);
        setDueDate("");
        setLoading(false);
    }, [visible, initialTitle, sourceMessageId]);

    const handleCreate = async () => {
        if (!title.trim() || loading) return;
        setLoading(true);
        try {
            await onCreate({
                title: title.trim(),
                description: description.trim() || undefined,
                assignee,
                dueDate: dueDate.trim() || undefined,
                sourceMessageId,
            });
            onClose();
        } catch {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Create action</Text>
                            <Text style={styles.subtitle}>Keep the next step visible in this Space.</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>×</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                        <Text style={styles.label}>Action</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="What needs to get done?"
                            placeholderTextColor={Colors.outlineVariant}
                            maxLength={160}
                            style={styles.input}
                            autoFocus
                        />

                        <Text style={styles.label}>Details <Text style={styles.optional}>(optional)</Text></Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Add useful context"
                            placeholderTextColor={Colors.outlineVariant}
                            maxLength={1000}
                            multiline
                            style={[styles.input, styles.multilineInput]}
                        />

                        <Text style={styles.label}>Assign to <Text style={styles.optional}>(optional)</Text></Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assigneeList}>
                            <TouchableOpacity
                                onPress={() => setAssignee(undefined)}
                                style={[styles.personChip, !assignee && styles.selectedPersonChip]}
                            >
                                <Text style={[styles.personText, !assignee && styles.selectedPersonText]}>Anyone</Text>
                            </TouchableOpacity>
                            {participants.map((participant) => (
                                <TouchableOpacity
                                    key={participant._id}
                                    onPress={() => setAssignee(participant._id)}
                                    style={[styles.personChip, assignee === participant._id && styles.selectedPersonChip]}
                                >
                                    <Text style={[styles.personText, assignee === participant._id && styles.selectedPersonText]}>
                                        {participant.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.label}>Due date <Text style={styles.optional}>(optional)</Text></Text>
                        <TextInput
                            value={dueDate}
                            onChangeText={setDueDate}
                            placeholder="e.g. 2026-08-25"
                            placeholderTextColor={Colors.outlineVariant}
                            style={styles.input}
                            autoCapitalize="none"
                        />

                        <TouchableOpacity onPress={handleCreate} disabled={!title.trim() || loading} style={[styles.createButton, (!title.trim() || loading) && styles.disabledButton]}>
                            {loading ? <ActivityIndicator color={Colors.onPrimary} /> : <Text style={styles.createButtonText}>Add action</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.42)" },
    sheet: { maxHeight: "92%", backgroundColor: Colors.surfaceLowest, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.surfaceHigh },
    title: { color: Colors.onSurface, fontSize: 19, fontWeight: "700" },
    subtitle: { color: Colors.onSurfaceVariant, fontSize: 13, marginTop: 3 },
    closeButton: { padding: 4 },
    closeText: { color: Colors.onSurfaceVariant, fontSize: 28, lineHeight: 28 },
    content: { padding: 20, gap: 10 },
    label: { color: Colors.onSurface, fontSize: 14, fontWeight: "600", marginTop: 6 },
    optional: { color: Colors.onSurfaceVariant, fontWeight: "400" },
    input: { minHeight: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.outline, backgroundColor: Colors.surface, color: Colors.onSurface, fontSize: 16 },
    multilineInput: { minHeight: 92, paddingTop: 14, textAlignVertical: "top" },
    assigneeList: { gap: 8, paddingVertical: 2 },
    personChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: Colors.surfaceHigh },
    selectedPersonChip: { backgroundColor: Colors.primary },
    personText: { color: Colors.onSurfaceVariant, fontSize: 13, fontWeight: "600" },
    selectedPersonText: { color: Colors.onPrimary },
    createButton: { minHeight: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary, marginTop: 12 },
    disabledButton: { opacity: 0.45 },
    createButtonText: { color: Colors.onPrimary, fontSize: 16, fontWeight: "700" },
});
