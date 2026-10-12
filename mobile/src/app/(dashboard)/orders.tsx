import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { apiFetch } from "@/lib/api";
import { Colors } from "@/lib/theme";

export default function Orders() {
  const [rows, setRows] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  async function load() {
    setRefreshing(true);
    try {
      setRows(await apiFetch("/api/orders"));
    } catch {
      setRows([]);
    } finally {
      setRefreshing(false);
    }
  }
  useEffect(() => { load(); }, []);
  return (
    <View style={s.wrap}>
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.t}>{item.orderNumber} · {item.total}</Text>
            <Text style={s.sub}>{item.customer?.name} · {item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={s.sub}>No orders yet.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.bg, padding: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: 8, padding: 12, marginBottom: 8 },
  t: { fontWeight: "bold", color: Colors.ink },
  sub: { color: Colors.muted, fontSize: 12 },
});
