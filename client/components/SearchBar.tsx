import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/assets/constants/Colors';

interface SearchBarProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, onClear, placeholder = "Search...", style, ...props }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={Colors.onSurfaceVariant} style={styles.icon} />
      <TextInput
        style={[styles.input, style, Platform.OS === 'web' && { outline: 'none' } as any]}
        placeholder={placeholder}
        placeholderTextColor={Colors.onSurfaceVariant}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close-circle" size={16} color={Colors.outlineVariant} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 4,
    marginLeft: 8,
  }
});
