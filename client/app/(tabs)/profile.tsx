
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import * as FileSystem from 'expo-file-system'
// import { dummyUserProfile } from '@/assets/assets'
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '@/assets/styles/ProfileScreen.styles';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/assets/constants/Colors';
import Avatar from '@/components/Avatar';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from "expo-image-picker"
import { api, useApp } from '@/context/AppContext';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@clerk/expo';

export default function ProfileScreen() {

  const { auth, logout, updateUser } = useApp();
  const { getToken } = useAuth();

  const user = auth.user;
  const [editMode, setEditMode] = useState(false)
  const [profileName, setProfileName] = useState(auth.user?.name || "")
  const [profileHandle, setProfileHandle] = useState(auth.user?.handle || "")
  const [profileBio, setProfileBio] = useState(auth.user?.bio || "")
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null)
  const [loading, setLoading] = useState(false);
  const [savedAvatar, setSavedAvatar] = useState<string | null>(user?.avatar || null);


  const displayAvatar = avatarUri || savedAvatar || user?.avatar;

  const pickAvatar = async () => {
    const { status } = await ImagePicker.
      requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert("Permission needed", "Allow access to your photos to change avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri)
      setAvatarBase64(result.assets[0].base64 || null)
    }
  }

  const saveProfile = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      let data;
      
      if (Platform.OS !== 'web' && avatarUri) {
        // Native mobile reliable file upload
        const response = await FileSystem.uploadAsync(`${API_BASE_URL}/api/users/profile`, avatarUri, {
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'avatar',
          parameters: {
            name: profileName,
            handle: profileHandle,
            bio: profileBio
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        data = JSON.parse(response.body);
      } else {
        // Web fallback (or mobile without avatar change)
        const formData = new FormData();
        formData.append('name', profileName);
        formData.append('handle', profileHandle);
        formData.append('bio', profileBio);

        if (avatarUri) {
          const response = await fetch(avatarUri);
          const blob = await response.blob();
          formData.append("avatar", blob, "avatar.jpg");
        }

        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        data = await response.json();
      }
      
      if (data.success) {
        await updateUser(data.user);
        if (data.user.avatar) {
          setSavedAvatar(data.user.avatar);
        }
        Alert.alert("Success!", "Profile updated ")
        setEditMode(false);
        setAvatarUri(null)
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error: any) {
      Alert.alert("Error!", error?.message || error?.response?.data?.message || "Failed to update profile")
    }
    finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    Alert.alert("Sign out ", "Are you sure you want to sign out? ", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logout }
    ])

  }

  const getUser = async () => {
    try {
      const { data } = await api.get("/api/users/profile")
      setProfileName(data.user.name)
      setProfileHandle(data.user.handle)
      setProfileBio(data.user.bio)
      if (data.user.avatar) {
        setSavedAvatar(data.user.avatar)
        setAvatarUri(null)
      }
    } catch (err: any) {
      console.log(err.message);

    }
  }

  useEffect(() => {
    getUser()
  }, []);


  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          {!editMode && (
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(true)}>
              <Ionicons name="pencil" size={16} color={Colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={editMode ? pickAvatar : undefined} activeOpacity={editMode ? 0.7 : 1}>
            <View style={styles.avatarWrapper}>
              <Avatar name={user?.name || "?"} src={displayAvatar} size={100} />
              {editMode && (
                <View style={styles.cameraOverlay}>
                  <Ionicons name="camera" size={22} color='#fff' />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {!editMode && (
            <View style={styles.userInfo}>
              <Text style={styles.userName}> {profileName}</Text>
              <Text style={styles.userHandle}> {profileHandle}</Text>
              <Text style={styles.userEmail}> {user?.email}</Text>
              {user?.bio && <Text style={styles.userBio}> {profileBio}</Text>}
            </View>
          )}
        </View>

        {/* Edit form */}
        {editMode && (
          <View style={styles.form}>
            {/* NAME */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>NAME</Text>
              <TextInput
                style={styles.input}
                value={profileName}
                onChangeText={setProfileName}
                placeholder='Your name'
                placeholderTextColor={Colors.outlineVariant}
                autoCapitalize='words' />
            </View>

            {/* Handle */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>HANDLE</Text>
              <View style={styles.handleRow}>
                <Text style={styles.atSign}>@</Text>
                <TextInput
                  style={[styles.input, styles.handleInput]}
                  value={profileHandle}
                  onChangeText={(v) => setProfileHandle(v.toLowerCase().replace(/\s/g, ""))}
                  placeholder='Your Username'
                  placeholderTextColor={Colors.outlineVariant}
                  autoCapitalize='none' />
              </View>
            </View>

            {/* BIO */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>BIO</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={profileBio}
                onChangeText={setProfileBio}
                placeholder='Your Bio'
                placeholderTextColor={Colors.outlineVariant}
                autoCapitalize='none'
                multiline
                numberOfLines={3} />
            </View>

            {/* Save  button  */}
            <TouchableOpacity onPress={saveProfile} disabled={loading} style={styles.saveWrapper} activeOpacity={0.88}>
              <LinearGradient colors={[Colors.primary, Colors.primaryContainer]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.saveBtn}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.onPrimary} />
                ) : (
                  <Text style={styles.saveBtnText}>
                    Save Changes
                  </Text>
                )}
              </LinearGradient>

            </TouchableOpacity>

            {/* Cancel button  */}
            <TouchableOpacity onPress={() => { setEditMode(false); setAvatarUri(null) }} style={styles.cancelBtn} activeOpacity={0.88}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Options */}
        {!editMode && (
          <View style={styles.optionsSection}>
            {/* Settings option  */}
            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionIcon}>
                <Ionicons name="settings-outline" size={20} color={Colors.onSurfaceVariant} />
              </View>
              <Text style={styles.optionText}>Settings</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.outlineVariant} />
            </TouchableOpacity>
            {/* Notifications option  */}
            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionIcon}>
                <Ionicons name="notifications-outline" size={20} color={Colors.onSurfaceVariant} />
              </View>
              <Text style={styles.optionText}>Notifications </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.outlineVariant} />
            </TouchableOpacity>
            {/* Privacy and security option    */}
            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionIcon}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.onSurfaceVariant} />
              </View>
              <Text style={styles.optionText}>Privacy and Security</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.outlineVariant} />
            </TouchableOpacity>
            {/* Help and support option  */}
            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionIcon}>
                <Ionicons name="help-circle-outline" size={20} color={Colors.onSurfaceVariant} />
              </View>
              <Text style={styles.optionText}>Help and support</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.outlineVariant} />
            </TouchableOpacity>
          </View>
        )}

        {/* Sign out */}
        <View style={styles.signOutSection}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

