// import { dummyStoriesData } from '@/assets/assets';
import { Colors } from '@/assets/constants/Colors';
import { styles } from '@/assets/styles/StoriesBar.styles';
import { UserStory } from '@/assets/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { FlatList } from 'react-native';

import * as ImagePicker from "expo-image-picker"
import Avatar from './Avatar';
import { api, useApp } from '@/context/AppContext';

interface IStoriesBarProps {
    onViewStory: (us: UserStory) => void
}

const StoriesBar = ({ onViewStory }: IStoriesBarProps) => {
    const [uploading, setUploading] = useState(false);
    const { userStories, fetchStories } = useApp()

    useEffect(() => {
        fetchStories();
    }, [fetchStories]);

    const pickAndUpload = async () => {
        // On web the browser handles permissions natively via the file dialog;
        // expo-image-picker's permission API returns "granted" unconditionally on web,
        // but some environments return "denied" — so we only gate on native.
        if (Platform.OS !== "web") {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission needed ⚠", "Allow access to your photos to post a story.");
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images", "videos"],
            quality: 0.8,
        });

        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];
        const formData = new FormData();

        if (Platform.OS === "web") {
            // On web, asset.uri is a blob: or data: URL — convert it to a real Blob
            try {
                const response = await fetch(asset.uri);
                const blob = await response.blob();
                const mimeType = asset.mimeType || blob.type || "image/jpeg";
                const ext = mimeType.split("/")[1] || "jpg";
                formData.append("file", blob, asset.fileName || `story.${ext}`);
            } catch {
                Alert.alert("Error", "Could not read the selected file.");
                return;
            }
        } else {
            // Native: React Native FormData accepts the { uri, type, name } object
            formData.append("file", {
                uri: asset.uri,
                type: asset.mimeType || "image/jpeg",
                name: asset.fileName || "story.jpg",
            } as any);
        }

        setUploading(true);
        try {
            const { data } = await api.post("/api/stories", formData);
            if (data.success) fetchStories();
        } catch (error: any) {
            Alert.alert("Error", "Failed to post story.");
            console.log(error);
        } finally {
            setUploading(false);
        }
    }

    return (
        <FlatList horizontal
            style={{ flexGrow: 0 }}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
            data={[{ _addStory: true }, ...userStories] as any[]
            }
            keyExtractor={(item, index) =>
                item._addStory ? "add" : item.user._id ?? String(index)
            }
            renderItem={({ item }) => {
                if (item._addStory) {
                    return (
                        <TouchableOpacity style={styles.storyItem} onPress={pickAndUpload} disabled={uploading}>
                            <View style={styles.addCircle}>
                                <Ionicons name={uploading ? "hourglass" : "add"} size={24} color={Colors.onSurfaceVariant} />
                            </View>
                            <Text style={styles.label}>
                                Your story
                            </Text>
                        </TouchableOpacity>
                    )
                }
                const us = item as UserStory;
                return (
                    <TouchableOpacity style={styles.storyItem} onPress={() => onViewStory(us)}>
                        <View style={styles.storyRing}>
                            <Avatar name={us.user.name} src={us.user.avatar} size={52} />
                        </View>
                        <Text style={styles.label} numberOfLines={1}>
                            {us.user.name.split(" ")[0]}
                        </Text>
                    </TouchableOpacity>
                )

            }}
        />
    );
};

export default StoriesBar;