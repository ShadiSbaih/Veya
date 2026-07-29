import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/assets/constants/Colors";
import { ConversationContextType } from "@/assets/types";

interface ContextCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (contextType: ConversationContextType, contextData?: any) => Promise<void>;
  isUpdate?: boolean;
}

const CONTEXT_OPTIONS: { type: ConversationContextType; label: string; icon: any }[] = [
  { type: "chat", label: "Just Talk", icon: "chatbubble-outline" },
  { type: "plan", label: "Make a Plan", icon: "map-outline" },
  { type: "event", label: "Organize an Event", icon: "calendar-outline" },
  { type: "decision", label: "Make a Decision", icon: "help-circle-outline" },
  { type: "study", label: "Study Together", icon: "book-outline" },
  { type: "project", label: "Work on a Project", icon: "briefcase-outline" },
];

export default function ContextCreationModal({ visible, onClose, onCreate, isUpdate = false }: ContextCreationModalProps) {
  const [step, setStep] = useState<"type" | "details">("type");
  const [selectedType, setSelectedType] = useState<ConversationContextType>("chat");
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [course, setCourse] = useState("");
  const [deadline, setDeadline] = useState("");

  const reset = () => {
    setStep("type");
    setSelectedType("chat");
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setLocation("");
    setCourse("");
    setDeadline("");
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectType = (type: ConversationContextType) => {
    setSelectedType(type);
    if (type === "chat") {
      submit("chat");
    } else {
      setStep("details");
    }
  };

  const submit = async (type: ConversationContextType) => {
    setLoading(true);
    let contextData: any = undefined;

    if (type !== "chat") {
      contextData = {};
      if (title.trim()) contextData.title = title.trim();
      if (description.trim()) contextData.description = description.trim();
      if (date.trim()) contextData.date = date.trim();
      if (time.trim()) contextData.time = time.trim();
      if (location.trim()) contextData.location = location.trim();
      if (course.trim()) contextData.course = course.trim();
      if (deadline.trim()) contextData.deadline = deadline.trim();
    }

    try {
      await onCreate(type, contextData);
      handleClose();
    } catch (error) {
      console.log("Failed to create conversation", error);
      setLoading(false);
    }
  };

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
            <Text style={styles.headerTitle}>{isUpdate ? "Add Context" : "New Conversation"}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Content */}
          {step === "type" ? (
            <ScrollView style={styles.content}>
              <Text style={styles.prompt}>What are you doing?</Text>
              <View style={styles.optionsList}>
                {CONTEXT_OPTIONS.filter(opt => !(isUpdate && opt.type === "chat")).map((opt) => (
                  <TouchableOpacity
                    key={opt.type}
                    style={styles.optionBtn}
                    onPress={() => handleSelectType(opt.type)}
                  >
                    <View style={styles.optionIcon}>
                      <Ionicons name={opt.icon} size={22} color={Colors.primary} />
                    </View>
                    <Text style={styles.optionLabel}>{opt.label}</Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.outlineVariant} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            <ScrollView style={styles.content}>
              <View style={styles.backRow}>
                <TouchableOpacity onPress={() => setStep("type")} style={styles.backBtn}>
                  <Ionicons name="chevron-back" size={20} color={Colors.primary} />
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.prompt}>
                {CONTEXT_OPTIONS.find((o) => o.type === selectedType)?.label}
              </Text>

              <View style={styles.form}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={[styles.input, { outline: "none" } as any]}
                  placeholder={
                    selectedType === "plan" ? "e.g. Weekend Trip" :
                    selectedType === "event" ? "e.g. Graduation Party" :
                    selectedType === "study" ? "e.g. Database Exam" :
                    selectedType === "project" ? "e.g. Capstone Project" :
                    selectedType === "decision" ? "e.g. Where to eat?" : "Title"
                  }
                  value={title}
                  onChangeText={setTitle}
                />

                {(selectedType === "plan" || selectedType === "event" || selectedType === "study") && (
                  <>
                    <Text style={styles.label}>Date</Text>
                    <TextInput
                      style={[styles.input, { outline: "none" } as any]}
                      placeholder="e.g. August 2"
                      value={date}
                      onChangeText={setDate}
                    />
                  </>
                )}

                {(selectedType === "plan" || selectedType === "event") && (
                  <>
                    <Text style={styles.label}>Time</Text>
                    <TextInput
                      style={[styles.input, { outline: "none" } as any]}
                      placeholder="e.g. 09:00 AM"
                      value={time}
                      onChangeText={setTime}
                    />
                    <Text style={styles.label}>Location</Text>
                    <TextInput
                      style={[styles.input, { outline: "none" } as any]}
                      placeholder="e.g. Ramallah"
                      value={location}
                      onChangeText={setLocation}
                    />
                  </>
                )}

                {selectedType === "study" && (
                  <>
                    <Text style={styles.label}>Course</Text>
                    <TextInput
                      style={[styles.input, { outline: "none" } as any]}
                      placeholder="e.g. Database Systems"
                      value={course}
                      onChangeText={setCourse}
                    />
                  </>
                )}

                {(selectedType === "project" || selectedType === "study") && (
                  <>
                    <Text style={styles.label}>Deadline / Exam Date</Text>
                    <TextInput
                      style={[styles.input, { outline: "none" } as any]}
                      placeholder="e.g. September 1"
                      value={deadline}
                      onChangeText={setDeadline}
                    />
                  </>
                )}

                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, { height: 80, outline: "none" } as any]}
                  placeholder="Additional details..."
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />

                <TouchableOpacity
                  style={[styles.submitBtn, (!title.trim() && selectedType !== "decision") && styles.submitBtnDisabled]}
                  disabled={loading || (!title.trim() && selectedType !== "decision")}
                  onPress={() => submit(selectedType)}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.surfaceLowest} />
                  ) : (
                    <Text style={styles.submitBtnText}>{isUpdate ? "Update Context" : "Create Conversation"}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
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
    minHeight: "70%",
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
  prompt: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.onSurface,
    textAlign: "center",
    marginVertical: 24,
  },
  optionsList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 40,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceHigh,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.onSurface,
  },
  backRow: {
    padding: 16,
    paddingBottom: 0,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: 16,
    color: Colors.primary,
    marginLeft: 4,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.onSurfaceVariant,
    marginTop: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceHigh,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.onSurface,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
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
