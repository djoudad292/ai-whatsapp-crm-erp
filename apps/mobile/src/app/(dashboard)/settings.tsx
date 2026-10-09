import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { API_URL, clearToken } from "@/lib/api";
import { Colors } from "@/lib/theme";

export default function Settings() {
  const router = useRouter();
  return (
    <View style={s.wrap}>
      <Text style={s.t}>Backend</Text>
      <Text style={s.sub}>{API_URL}</Text>
      <Text style={[s.sub, { marginTop: 8 }]}>
        On a physical device, set EXPO_PUBLIC_API_URL to your machine's LAN IP or tunnel URL before `expo start`.
      </Text>
      <TouchableOpacity
        style={[s.btn, { marginTop: 16 }]}
        onPress={async () => { await clearToken(); router.replace("/(auth)/login"); }}
      >
        <Text style={s.btnText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.bg, padding: 16 },
  t: { fontWeight: "bold", color: Colors.ink, fontSize: 16 },
  sub: { color: Colors.muted, fontSize: 12 },
  btn: { backgroundColor: Colors.danger, borderRadius: 8, padding: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold" },
});
