import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { apiFetch, setToken } from "@/lib/api";
import { Colors } from "@/lib/theme";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const data = await apiFetch<{ token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      await setToken(data.token);
      router.replace("/(dashboard)/chat");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={s.wrap}>
      <Text style={s.title}>AI WhatsApp CRM</Text>
      <TextInput style={s.input} placeholder="Username" autoCapitalize="none" value={username} onChangeText={setUsername} />
      <TextInput style={s.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {error ? <Text style={s.err}>{error}</Text> : null}
      <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}>
        <Text style={s.btnText}>{busy ? "…" : "Log in"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: Colors.bg },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, color: Colors.ink },
  input: { backgroundColor: Colors.surface, borderColor: Colors.line, borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  err: { color: Colors.danger, marginBottom: 12 },
  btn: { backgroundColor: Colors.primary, borderRadius: 8, padding: 14, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold" },
});
