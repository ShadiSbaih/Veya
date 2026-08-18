import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '@/assets/styles/AuthScreen.styles';
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from '@/assets/constants/Colors';
import { SvgXml } from "react-native-svg"
import { Ionicons } from "@expo/vector-icons"
import { useClerk, useSignIn, useSignUp } from '@clerk/expo';

type Mode = "login" | "register";

export default function AuthScreen() {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { setActive } = useClerk();
  const [mode, setMode] = useState<Mode>("login")
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verifyingMode, setVerifyingMode] = useState<"login" | "login_mfa" | "register">("register");

  const router = useRouter();

  const svgMarkup = `<svg width="63" height="70" viewBox="0 0 63 70" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M33.817 52.382c0-15.988 12.96-28.948 28.948-28.948v17.585c0 15.987-12.96 28.948-28.948 28.948zm-4.869 0c0-15.988-12.96-28.948-28.948-28.948v17.585c0 15.987 12.96 28.948 28.948 28.948z" fill="${Colors.surfaceLowest}"/>
  <g clip-path="url(#a)">
    <path d="M31.487 0c0 8.764 7.049 15.881 15.786 15.992l.207.001-.207.001c-8.737.11-15.786 7.228-15.786 15.992 0-8.833-7.16-15.993-15.993-15.993 8.833 0 15.993-7.16 15.993-15.993" fill="${Colors.surfaceLowest}"/>
  </g>
  <defs>
    <clipPath id="a">
      <path fill="${Colors.surfaceLowest}" d="M15.494 0H47.48v31.986H15.494z"/>
    </clipPath>
  </defs>
</svg>`;


  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return Alert.alert("Validation", "Please fill all fields")
    if (mode === "register" && (!name.trim() || !handle.trim())) return Alert.alert("Validation", "Please fill all fields")

    setLoading(true)
    try {
      if (mode === "login") {
        if (!signIn) return;
        const result = await signIn.create({
          identifier: email,
          password,
        })

        if (result.error) {
          throw result.error
        }

        if (signIn.status === "complete") {
          await setActive({ session: signIn.createdSessionId });
          router.replace("/(tabs)");
        }
        else if (signIn.status === "needs_first_factor" && signIn.emailCode) {
          await signIn.emailCode.sendCode();
          setVerifyingMode("login");
          setVerifying(true);
        }
        else if (signIn.status === "needs_second_factor" && signIn.mfa) {
          await signIn.mfa.sendEmailCode();
          setVerifyingMode("login_mfa");
          setVerifying(true);
        }
      }
      else {
        if (!signUp) return;
        const nameParts = name.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

        const result = await signUp.create({
          emailAddress: email,
          password,
          firstName,
          lastName,
          username: handle.toLowerCase().replace(/\s/g, "")
        });

        if (result.error) {
          throw result.error;
        }

        const sendResult = await signUp.verifications.sendEmailCode();
        if (sendResult.error) {
          throw sendResult.error;
        }
        setVerifyingMode("register");
        setVerifying(true);
      }
    } catch (error: any) {
      console.log("Something went wrong while authenticating ");
      Alert.alert("Authentication error ",
        error?.errors?.[0]?.message || error?.errors?.[0]?.longMessage || error.message || "Something went wrong ");
    } finally {
      setLoading(false)
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) return Alert.alert("Validation", "Please enter the verification code ");
    setLoading(true);
    try {
      if (verifyingMode === "register") {
        if (!signUp) return;
        const result = await signUp.verifications.verifyEmailCode({
          code: verificationCode
        })

        if (result.error) {
          throw result.error;
        }

        if (signUp.status === "complete") {
          await setActive({ session: signUp.createdSessionId })
          router.replace("/(tabs)")
        } else {
          Alert.alert("Verification Failed", "Please check the code and try again.");
        }
      } else {
        if (!signIn) return
        if (verifyingMode === "login_mfa") {
          await signIn.mfa.verifyEmailCode({
            code: verificationCode
          })
        } else {
          await signIn.emailCode.verifyCode({
            code: verificationCode
          })
        }
        if (signIn.status === "complete") {
          await setActive({ session: signIn.createdSessionId });
          router.replace("/(tabs)");
        }
        else {
          Alert.alert("Verification failed ", "Please check the code and try again.")
        }
      }

    } catch (error: any) {
      console.log("Something went wrong while Verification  ");
      Alert.alert("Verification  error ",
        error?.errors?.[0]?.message || error?.errors?.[0]?.longMessage || error.message || "Something went wrong ");
    }
    finally {
      setLoading(false)

    }
  };


  if (verifying) {
    return <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.kav}
        behavior={Platform.OS == "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/*logo*/}
          <View style={styles.logoRow}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              style={styles.logoBox} >
              <SvgXml xml={svgMarkup} width="50%" height="50%" />
            </LinearGradient>
            <Text style={styles.appName}>Veya</Text>
          </View>
          {/*Hero text*/}
          <Text style={styles.heading}>Verify Email </Text>
          <Text style={styles.subheading}>We have sent a 6-digit verification code to {email} </Text>

          {/*Form */}
          <View style={styles.form}>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Verification code </Text>
              <TextInput
                style={styles.input}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder='Enter 6-digit code '
                keyboardType='number-pad'
                placeholderTextColor={Colors.outlineVariant}
                autoCapitalize='none' />
            </View>


            {/* Back to sign up link  */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleText}>Did not receive a code? </Text>
              <Text>
                <TouchableOpacity onPress={() => setVerifying(false)}>
                  <Text style={styles.toggleLink}>
                    Go Back
                  </Text>
                </TouchableOpacity>

              </Text>
            </View>

            {/* Submit */}
            <TouchableOpacity onPress={handleVerify}
              disabled={loading} activeOpacity={0.88} style={styles.btnWrapper}>
              <LinearGradient colors={[Colors.primary, Colors.primaryContainer]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.btn}>
                {loading ? (<ActivityIndicator color={Colors.onPrimary} size="small" />) : (
                  <>
                    <Text style={styles.btnText}>Verify Code </Text>
                    <Ionicons name='arrow-forward' color={Colors.onPrimary} size={18} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  }


  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.kav}
        behavior={Platform.OS == "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/*logo*/}
          <View style={styles.logoRow}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              style={styles.logoBox} >
              <SvgXml xml={svgMarkup} width="50%" height="50%" />
            </LinearGradient>
            <Text style={styles.appName}>Veya</Text>
          </View>
          {/*Hero text*/}
          <Text style={styles.heading}>{mode === "login" ? "Welcome Back!" : "Create Account"}</Text>
          <Text style={styles.subheading}>{mode === "login" ? "Sign in to continue chatting " : "Fill your details to get started "}</Text>

          {/*Form */}
          <View style={styles.form}>
            {mode === "register" && (
              <>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>
                    Full Name
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder='Your Name'
                    placeholderTextColor={Colors.outlineVariant}
                    autoCapitalize='words' />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Username Handle</Text>
                  <View style={styles.handleRow}>
                    <Text style={styles.atSign}>@</Text>
                    <TextInput
                      style={[styles.input, styles.handleInput]}
                      value={handle}
                      onChangeText={(v) => setHandle(v.toLowerCase().replace(/\s/g, ""))}
                      placeholder='username'
                      placeholderTextColor={Colors.outlineVariant} />
                  </View>
                </View>
              </>
            )}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder='name@example.com'
                keyboardType='email-address'
                placeholderTextColor={Colors.outlineVariant}
                autoCapitalize='none' />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder='********'
                placeholderTextColor={Colors.outlineVariant}
                secureTextEntry />
            </View>

            {/* Toggle mode */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleText}>
                {mode === "login" ? "Don't have an account?" : " Already have an account?"}
              </Text>

              <TouchableOpacity onPress={() => setMode(mode === "login" ? "register" : "login")}>
                <Text style={styles.toggleLink}>
                  {mode === "login" ? "register" : "login"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit */}
            <TouchableOpacity onPress={handleSubmit}
              disabled={loading} activeOpacity={0.88} style={styles.btnWrapper}>
              <LinearGradient colors={[Colors.primary, Colors.primaryContainer]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.btn}>
                {loading ? (<ActivityIndicator color={Colors.onPrimary} size="small" />) : (
                  <>
                    <Text style={styles.btnText}>
                      {mode === "login" ? "Sign In " : "Create Account"}
                    </Text>
                    <Ionicons name='arrow-forward' color={Colors.onPrimary} size={18} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}


// TODO: Add input validation using Zod And react formik
