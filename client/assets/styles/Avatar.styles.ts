import { StyleSheet } from "react-native";
import { Colors } from "../constants/Colors";

export const styles = StyleSheet.create({
    root: { position: "relative" },
    circle: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
    initials: { color: Colors.surfaceLowest, fontWeight: "600" },
    indicator: {
        position: "absolute",
        borderWidth: 2,
        borderColor: Colors.surfaceLowest,
    },
});
