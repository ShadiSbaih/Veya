import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '@/assets/styles/AuthScreen.styles';
import { Colors } from '@/assets/constants/Colors';
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons"
import { useClerk, useSignIn, useSignUp } from '@clerk/expo';
import { showAlert } from '@/utils/alerts';

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
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verifyingMode, setVerifyingMode] = useState<"login" | "login_mfa" | "register">("register");

  const router = useRouter();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return showAlert("Validation", "Please fill all fields")
    if (mode === "register" && (!name.trim() || !handle.trim())) return showAlert("Validation", "Please fill all fields")

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
      showAlert("Authentication error ",
        error?.errors?.[0]?.message || error?.errors?.[0]?.longMessage || error.message || "Something went wrong ");
    } finally {
      setLoading(false)
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) return showAlert("Validation", "Please enter the verification code ");
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
          showAlert("Verification Failed", "Please check the code and try again.");
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
          showAlert("Verification failed ", "Please check the code and try again.")
        }
      }

    } catch (error: any) {
      console.log("Something went wrong while Verification  ");
      showAlert("Verification  error ",
        error?.errors?.[0]?.message || error?.errors?.[0]?.longMessage || error.message || "Something went wrong ");
    }
    finally {
      setLoading(false)

    }
  };


  if (verifying) {
    return <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/*logo*/}
          <View style={styles.logoRow}>
            <Image source={require('@/assets/images/veya-icon.png')} style={styles.logoBox} contentFit="cover" />
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
                placeholderTextColor={Colors.onSurfaceVariant}
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
              <View style={styles.btn}>
                {loading ? (<ActivityIndicator color={Colors.onPrimary} size="small" />) : (
                  <>
                    <Text style={styles.btnText}>Verify Code </Text>
                    <Ionicons name='arrow-forward' color={Colors.onPrimary} size={18} />
                  </>
                )}
              </View>
            </TouchableOpacity>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  }


  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/*logo*/}
          <View style={styles.logoRow}>
            <Image source={require('@/assets/images/veya-icon.png')} style={styles.logoBox} contentFit="cover" />
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
                    placeholderTextColor={Colors.onSurfaceVariant}
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
                      placeholderTextColor={Colors.onSurfaceVariant} />
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
                placeholderTextColor={Colors.onSurfaceVariant}
                autoCapitalize='none' />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder='********'
                  placeholderTextColor={Colors.onSurfaceVariant}
                  secureTextEntry={!showPassword}
                  autoCapitalize='none' />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword((visible) => !visible)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  accessibilityHint={showPassword ? "Hides the password text" : "Shows the password text"}
                  activeOpacity={0.7}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
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
              <View style={styles.btn}>
                {loading ? (<ActivityIndicator color={Colors.onPrimary} size="small" />) : (
                  <>
                    <Text style={styles.btnText}>
                      {mode === "login" ? "Sign In " : "Create Account"}
                    </Text>
                    <Ionicons name='arrow-forward' color={Colors.onPrimary} size={18} />
                  </>
                )}
              </View>
            </TouchableOpacity>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}


// TODO: Add input validation using Zod And react formik
