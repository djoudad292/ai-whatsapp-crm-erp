import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { apiFetch } from "@/lib/api";
import { Colors } from "@/lib/theme";

export default function Approvals() {
  const [rows, setRows] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  async function load() {
    setRefreshing(true);
    try {
      setRows(await apiFetch("/api/approvals?status=pending"));
    } catch {
      setRows([]);
    } finally {
      setRefreshing(false);
    }
  }
  useEffect(() => { load(); }, []);
  async function decide(id: string, how: string) {
    await apiFetch(`/api/approvals/${id}/${how}`, { method: "POST", body: "{}" });
    load();
  }
  return (
    <View style={s.wrap}>
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.t}>{item.type} · {String(item.orderId).slice(0, 8)}</Text>
            <View style={s.row}>
              <TouchableOpacity style={[s.btn, { backgroundColor: Colors.ok }]} onPress={() => decide(item.id, "approve")}>
                <Text style={s.btnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { backgroundColor: Colors.danger }]} onPress={() => decide(item.id, "reject")}>
                <Text style={s.btnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.sub}>No pending approvals.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.bg, padding: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: 8, padding: 12, marginBottom: 8 },
  t: { fontWeight: "bold", color: Colors.ink, marginBottom: 8 },
  sub: { color: Colors.muted, fontSize: 12 },
  row: { flexDirection: "row", gap: 8 },
  btn: { borderRadius: 8, padding: 10, flex: 1, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold" },
});
