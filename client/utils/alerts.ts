import { Alert, Platform } from "react-native";

function formatAlertMessage(title: string, message?: string) {
  return message ? `${title}\n\n${message}` : title;
}

/** Show an alert on every platform, including React Native Web. */
export function showAlert(title: string, message?: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.alert(formatAlertMessage(title, message));
    }
    return;
  }

  Alert.alert(title, message);
}

/** Ask for confirmation on every platform, including React Native Web. */
export function confirmAlert(title: string, message?: string): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(
      typeof window !== "undefined" && window.confirm(formatAlertMessage(title, message)),
    );
  }

  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel", onPress: () => settle(false) },
        { text: "Confirm", style: "destructive", onPress: () => settle(true) },
      ],
      { cancelable: true, onDismiss: () => settle(false) },
    );
  });
}
