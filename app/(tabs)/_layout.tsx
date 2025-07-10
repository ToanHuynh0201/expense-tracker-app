import CustomTabs from "@/components/CustomTabs";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

const _layout = () => {
  return (
    <Tabs
      tabBar={CustomTabs}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index"></Tabs.Screen>
      <Tabs.Screen name="statistics"></Tabs.Screen>
      <Tabs.Screen name="wallet"></Tabs.Screen>
      <Tabs.Screen name="profile"></Tabs.Screen>
    </Tabs>
  );
};

export default _layout;

const styles = StyleSheet.create({});
