import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/assets/constants/Colors";

interface DecisionCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (question: string, options: string[]) => Promise<void>;
}

export default function DecisionCreationModal({ visible, onClose, onCreate }: DecisionCreationModalProps) {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]); // start with 2 empty options

  const reset = () => {
    setQuestion("");
    setOptions(["", ""]);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const submit = async () => {
    const validOptions = options.map(o => o.trim()).filter(o => o.length > 0);
    if (!question.trim() || validOptions.length < 2) return;

    setLoading(true);
    try {
      await onCreate(question.trim(), validOptions);
      handleClose();
    } catch (error) {
      console.log("Failed to create decision", error);
      setLoading(false);
    }
  };

  const validOptionsCount = options.filter(o => o.trim().length > 0).length;
  const canSubmit = question.trim().length > 0 && validOptionsCount >= 2;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Decision</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.form}>
              <Text style={styles.label}>Question</Text>
              <TextInput
                style={[styles.input, { outline: "none" } as any]}
                placeholder="e.g. Where should we eat?"
                value={question}
                onChangeText={setQuestion}
              />

              <Text style={[styles.label, { marginTop: 24 }]}>Options</Text>
              {options.map((opt, index) => (
                <View key={index} style={styles.optionRow}>
                  <TextInput
                    style={[styles.input, styles.optionInput, { outline: "none" } as any]}
                    placeholder={`Option ${index + 1}`}
                    value={opt}
                    onChangeText={(t) => updateOption(index, t)}
                  />
                  {options.length > 2 && (
                    <TouchableOpacity onPress={() => removeOption(index)} style={styles.removeBtn}>
                      <Ionicons name="remove-circle-outline" size={24} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity onPress={addOption} style={styles.addBtn}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.addBtnText}>Add Option</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                disabled={loading || !canSubmit}
                onPress={submit}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.surfaceLowest} />
                ) : (
                  <Text style={styles.submitBtnText}>Create Decision</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.surfaceLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: "60%",
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceHigh,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  content: {
    flex: 1,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.onSurface,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.surfaceLowest,
    borderWidth: 1,
    borderColor: Colors.outline,
    borderRadius: 8, // Notion rounded.md
    padding: 14,
    fontSize: 16,
    color: Colors.onSurface,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionInput: {
    flex: 1,
  },
  removeBtn: {
    padding: 4,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  addBtnText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8, // Notion rounded.md
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: Colors.onPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});
