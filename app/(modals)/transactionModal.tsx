import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import ImageUpload from "@/components/ImageUpload";
import Input from "@/components/Input";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { expenseCategories, transactionTypes } from "@/constants/data";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import useFetchData from "@/hooks/useFetchData";
import { createOrUpdateTransaction } from "@/services/transactionService";
import { deleteWallet } from "@/services/walletService";
import { TransactionType, WalletType } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { orderBy, where } from "firebase/firestore";
import * as Icons from "phosphor-react-native";
import React, { useState } from "react";
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
const TransactionModal = () => {
    const { user } = useAuth();
    const [transaction, setTransaction] = useState<TransactionType>({
        type: "expense",
        amount: 0,
        description: "",
        category: "",
        date: new Date(),
        walletId: "",
        image: null,
    });

    const {
        data: wallets,
        error: walletError,
        loading: walletLoading,
    } = useFetchData<WalletType>("wallets", [
        where("uid", "==", user?.uid),
        orderBy("created", "desc"),
    ]);

    const router = useRouter();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const oldTransaction: { name: string; image: string; id: string } =
        useLocalSearchParams();

    const onDateChange = (
        event: DateTimePickerEvent,
        selectedDate: Date | undefined
    ) => {
        const currentDate = selectedDate || transaction.date;
        setTransaction({ ...transaction, date: currentDate });
        setShowDatePicker(false);
    };
    const onSubmit = async () => {
        const { type, amount, description, category, date, walletId, image } =
            transaction;

        if (!walletId || !date || !amount || (type == "expense" && !category)) {
            Alert.alert("Transaction", "Please fill all the fields");
            return;
        }
        let transactionData: TransactionType = {
            type,
            amount,
            description,
            category,
            date,
            walletId,
            image,
            uid: user?.uid,
        };

        //todo: include transaction id for updating
        setLoading(true);
        const res = await createOrUpdateTransaction(transactionData);
        setLoading(false);

        if (res.success) {
            router.back();
        } else {
            Alert.alert("Transaction", res.msg);
        }
    };

    const onDelete = async () => {
        if (!oldTransaction.id) return;

        setLoading(true);

        const res = await deleteWallet(oldTransaction?.id);

        setLoading(false);

        if (res.success) {
            router.back();
        } else {
            Alert.alert("Wallet", res.msg);
        }
    };

    const showDeleteAlert = () => {
        Alert.alert(
            "Confirm",
            "Are you sure you want to delete? \n This action will remove all the transactions related to this wallet",
            [
                {
                    text: "Cancel",
                    onPress: () => console.log("cancel delete"),
                    style: "cancel",
                },
                {
                    text: "Delete",
                    onPress: () => onDelete(),
                    style: "destructive",
                },
            ]
        );
    };

    const renderLabel = () => {};
    return (
        <ModalWrapper>
            <View style={styles.container}>
                <Header
                    title={
                        oldTransaction?.id
                            ? "Update Transaction"
                            : "New Transaction"
                    }
                    leftIcon={<BackButton></BackButton>}
                    style={{ marginBottom: spacingY._10 }}
                ></Header>

                <ScrollView
                    contentContainerStyle={styles.form}
                    showsVerticalScrollIndicator={false}
                >
                    {/*Type*/}
                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200} size={16}>
                            Type
                        </Typo>
                        <Dropdown
                            activeColor={colors.neutral700}
                            style={styles.dropdownContainer}
                            placeholderStyle={styles.dropdownPlaceholder}
                            selectedTextStyle={styles.dropdownSelectedText}
                            iconStyle={styles.dropdownIcon}
                            itemTextStyle={styles.dropdownItemText}
                            itemContainerStyle={styles.dropdownItemContainer}
                            containerStyle={styles.dropdownListContainer}
                            placeholder={"Select Type"}
                            data={transactionTypes}
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            value={transaction.type}
                            onChange={(item) => {
                                setTransaction({
                                    ...transaction,
                                    type: item.value,
                                });
                            }}
                        />
                    </View>
                    {/*Wallet*/}
                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200} size={16}>
                            Wallet
                        </Typo>
                        <Dropdown
                            activeColor={colors.neutral700}
                            style={styles.dropdownContainer}
                            placeholderStyle={styles.dropdownPlaceholder}
                            selectedTextStyle={styles.dropdownSelectedText}
                            iconStyle={styles.dropdownIcon}
                            itemTextStyle={styles.dropdownItemText}
                            itemContainerStyle={styles.dropdownItemContainer}
                            containerStyle={styles.dropdownListContainer}
                            placeholder={"Select Wallet"}
                            data={wallets.map((wallet) => ({
                                label: `${wallet?.name} ($${wallet.amount})`,
                                value: wallet?.id,
                            }))}
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            value={transaction.walletId}
                            onChange={(item) => {
                                setTransaction({
                                    ...transaction,
                                    walletId: item.value || "",
                                });
                            }}
                        />
                    </View>
                    {/*Category*/}
                    {transaction.type == "expense" && (
                        <View style={styles.inputContainer}>
                            <Typo color={colors.neutral200} size={16}>
                                Category
                            </Typo>
                            <Dropdown
                                activeColor={colors.neutral700}
                                style={styles.dropdownContainer}
                                placeholderStyle={styles.dropdownPlaceholder}
                                selectedTextStyle={styles.dropdownSelectedText}
                                iconStyle={styles.dropdownIcon}
                                itemTextStyle={styles.dropdownItemText}
                                itemContainerStyle={
                                    styles.dropdownItemContainer
                                }
                                containerStyle={styles.dropdownListContainer}
                                placeholder={"Select Category"}
                                data={Object.values(expenseCategories)}
                                maxHeight={300}
                                labelField="label"
                                valueField="value"
                                value={transaction.category}
                                onChange={(item) => {
                                    setTransaction({
                                        ...transaction,
                                        category: item.value || "",
                                    });
                                }}
                            />
                        </View>
                    )}
                    {/*Date*/}
                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200} size={16}>
                            Date
                        </Typo>
                        {!showDatePicker && (
                            <Pressable
                                style={styles.dateInput}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Typo size={14}>
                                    {(
                                        transaction.date as Date
                                    ).toLocaleDateString()}
                                </Typo>
                            </Pressable>
                        )}

                        {showDatePicker && (
                            <View>
                                <DateTimePicker
                                    themeVariant="dark"
                                    value={transaction.date as Date}
                                    textColor={colors.white}
                                    mode="date"
                                    display="spinner"
                                    onChange={onDateChange}
                                ></DateTimePicker>

                                {Platform.OS == "ios" && (
                                    <TouchableOpacity
                                        style={styles.datePickerButton}
                                        onPress={() => setShowDatePicker(false)}
                                    >
                                        <Typo size={15} fontWeight={"500"}>
                                            OK
                                        </Typo>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                    {/*Amount*/}
                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200} size={16}>
                            Amount
                        </Typo>
                        <Input
                            keyboardType="numeric"
                            value={transaction.amount?.toString()}
                            onChangeText={(value) =>
                                setTransaction({
                                    ...transaction,
                                    amount: Number(value),
                                })
                            }
                        ></Input>
                    </View>
                    {/*Description*/}
                    <View style={styles.inputContainer}>
                        <View style={styles.flexRow}>
                            <Typo color={colors.neutral200} size={16}>
                                Description
                            </Typo>
                            <Typo color={colors.neutral500} size={14}>
                                (optional)
                            </Typo>
                        </View>
                        <Input
                            value={transaction.description}
                            multiline
                            containerStyle={{
                                flexDirection: "row",
                                height: verticalScale(100),
                                alignItems: "flex-start",
                                paddingVertical: 15,
                            }}
                            onChangeText={(value) =>
                                setTransaction({
                                    ...transaction,
                                    description: value,
                                })
                            }
                        ></Input>
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.flexRow}>
                            <Typo color={colors.neutral200} size={16}>
                                Receipt
                            </Typo>
                            <Typo color={colors.neutral500} size={14}>
                                (optional)
                            </Typo>
                        </View>
                        <ImageUpload
                            onSelect={(file) =>
                                setTransaction({ ...transaction, image: file })
                            }
                            onClear={() =>
                                setTransaction({ ...transaction, image: null })
                            }
                            file={transaction.image}
                            placeholder="Upload Image"
                        ></ImageUpload>
                    </View>
                </ScrollView>
            </View>

            <View style={styles.footer}>
                {oldTransaction?.id && !loading && (
                    <Button
                        onPress={showDeleteAlert}
                        style={{
                            backgroundColor: colors.rose,
                            paddingHorizontal: spacingX._15,
                        }}
                    >
                        <Icons.Trash
                            color={colors.white}
                            size={verticalScale(24)}
                            weight="bold"
                        ></Icons.Trash>
                    </Button>
                )}
                <Button
                    onPress={onSubmit}
                    loading={loading}
                    style={{ flex: 1 }}
                >
                    <Typo color={colors.black} fontWeight={"700"}>
                        {oldTransaction?.id ? "Update Transaction" : "Submit"}
                    </Typo>
                </Button>
            </View>
        </ModalWrapper>
    );
};

export default TransactionModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: spacingY._20,
    },
    form: {
        gap: spacingY._20,
        paddingVertical: spacingY._15,
        paddingBottom: spacingY._40,
    },
    footer: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        paddingHorizontal: spacingX._20,
        gap: scale(12),
        paddingTop: spacingY._15,
        borderTopColor: colors.neutral700,
        marginBottom: spacingY._5,
        borderTopWidth: 1,
    },
    inputContainer: {
        gap: spacingY._10,
    },
    iosDropDown: {
        flexDirection: "row",
        height: verticalScale(54),
        alignItems: "center",
        justifyContent: "center",
        fontSize: verticalScale(14),
        borderWidth: 1,
        color: colors.white,
        borderColor: colors.neutral300,
        borderRadius: radius._17,
        borderCurve: "continuous",
        paddingHorizontal: spacingX._15,
    },
    androidDropDown: {
        // flexDirection: "row",
        height: verticalScale(54),
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        fontSize: verticalScale(14),
        color: colors.white,
        borderColor: colors.neutral300,
        borderRadius: radius._17,
        borderCurve: "continuous",
        // paddingHorizontal: spacingX._15,
    },
    flexRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacingX._5,
    },
    dateInput: {
        flexDirection: "row",
        height: verticalScale(54),
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.neutral300,
        borderRadius: radius._17,
        borderCurve: "continuous",
        paddingHorizontal: spacingX._15,
    },
    datePickerButton: {
        backgroundColor: colors.neutral700,
        alignSelf: "flex-end",
        padding: spacingY._7,
        marginRight: spacingX._7,
        paddingHorizontal: spacingY._15,
        borderRadius: radius._10,
    },
    dropdownContainer: {
        height: verticalScale(54),
        borderWidth: 1,
        borderColor: colors.neutral300,
        paddingHorizontal: spacingX._15,
        borderRadius: radius._15,
        borderCurve: "continuous",
    },
    dropdownItemText: { color: colors.white },
    dropdownSelectedText: {
        color: colors.white,
        fontSize: verticalScale(14),
    },
    dropdownListContainer: {
        backgroundColor: colors.neutral900,
        borderRadius: radius._15,
        borderCurve: "continuous",
        paddingVertical: spacingY._7,
        top: 5,
        borderColor: colors.neutral500,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 5,
    },
    dropdownPlaceholder: {
        color: colors.white,
    },
    dropdownItemContainer: {
        borderRadius: radius._15,
        marginHorizontal: spacingX._7,
    },
    dropdownIcon: {
        height: verticalScale(30),
        tintColor: colors.neutral300,
    },
});
