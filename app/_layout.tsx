import { AuthProvider } from "@/contexts/authContext";
import { Stack } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

const StackLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="(modals)/profileModal"
                options={{
                    presentation: "modal",
                    headerShown: false,
                    animation: "slide_from_bottom",
                    gestureEnabled: true,
                }}
            ></Stack.Screen>
            <Stack.Screen
                name="(modals)/walletModal"
                options={{
                    presentation: "modal",
                    headerShown: false,
                    animation: "slide_from_bottom",
                    gestureEnabled: true,
                }}
            ></Stack.Screen>
            <Stack.Screen
                name="(modals)/transactionModal"
                options={{
                    presentation: "modal",
                    headerShown: false,
                    animation: "slide_from_bottom",
                    gestureEnabled: true,
                }}
            ></Stack.Screen>
        </Stack>
    );
};

export default function RootLayout() {
    return (
        <AuthProvider>
            <StackLayout />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({});
