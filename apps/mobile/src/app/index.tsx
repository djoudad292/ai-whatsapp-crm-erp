import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { getToken } from "@/lib/api";

export default function Index() {
  const [state, setState] = useState<"loading" | "in" | "out">("loading");
  useEffect(() => {
    getToken().then((t) => setState(t ? "in" : "out"));
  }, []);
  if (state === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={state === "in" ? "/(dashboard)/chat" : "/(auth)/login"} />;
}
