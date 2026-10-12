import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { apiFetch } from "@/lib/api";
import { Colors } from "@/lib/theme";

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function Chat() {
  const [text, setText] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      setLog((l) => [...l, `you: ${body}`]);
      const created: any = await apiFetch("/webhooks/whatsapp", {
        method: "POST",
        body: JSON.stringify({
          id: uuid(), timestamp: new Date().toISOString(),
          from: "+213555000001", to: "demo", text: body, status: "delivered",
        }),
      });
      const result: any = await apiFetch(`/api/orders/webhooks/${created.webhookEventId}/process`, { method: "POST" });
      setLog((l) => [...l, `system: ${JSON.stringify(result).slice(0, 280)}`]);
      setText("");
    } catch (e: any) {
      setLog((l) => [...l, `error: ${e.message}`]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={s.wrap}>
      <FlatList data={log} keyExtractor={(_, i) => String(i)} renderItem={({ item }) => <Text style={s.msg}>{item}</Text>} />
      <View style={s.row}>
        <TextInput style={s.input} value={text} onChangeText={setText} placeholder="I want 2x Product A" />
        <TouchableOpacity style={s.btn} onPress={send} disabled={busy}>
          <Text style={s.btnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.bg, padding: 12 },
  msg: { backgroundColor: Colors.surface, borderRadius: 8, padding: 10, marginBottom: 6 },
  row: { flexDirection: "row", gap: 8 },
  input: { flex: 1, backgroundColor: Colors.surface, borderColor: Colors.line, borderWidth: 1, borderRadius: 8, padding: 10 },
  btn: { backgroundColor: Colors.primary, borderRadius: 8, padding: 12 },
  btnText: { color: "#fff", fontWeight: "bold" },
});
