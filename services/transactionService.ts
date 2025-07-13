import { firestore } from "@/config/firebase";
import { ResponseType, TransactionType, WalletType } from "@/types";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";

export const createOrUpdateTransaction = async (
    transactionData: Partial<TransactionType>
): Promise<ResponseType> => {
    try {
        const { id, type, walletId, image, amount } = transactionData;
        if (!amount || amount == 0 || !walletId || !type) {
            return {
                success: false,
                msg: "Data is invalid!",
            };
        }

        if (id) {
            //todo: update existing transaction
        } else {
            //update wallet for new transaction
            //update wallet
            let res = await updateWalletForNewTransaction(
                walletId,
                Number(amount!),
                type
            );
            if (!res.success) return res;
        }

        if (image) {
            const imageUploadRes = await uploadFileToCloudinary(
                image,
                "transactions"
            );
            if (!imageUploadRes.success) {
                return {
                    success: false,
                    msg: imageUploadRes.msg || "Failed to upload receipt",
                };
            }

            transactionData.image = imageUploadRes.data;
        }

        const transactionRef = id
            ? doc(firestore, "transactions", id)
            : doc(collection(firestore, "transactions"));

        await setDoc(transactionRef, transactionData, { merge: true });
        return {
            success: true,
            data: { ...transactionData, id: transactionRef.id },
        };
    } catch (err: any) {
        console.log("Error creating or updating transaction: ", err.message);
        return {
            success: false,
            msg: err.message,
        };
    }
};

const updateWalletForNewTransaction = async (
    walletId: string,
    amount: number,
    type: string
) => {
    try {
        const walletRef = doc(firestore, "wallets", walletId);
        const walletSnapshot = await getDoc(walletRef);

        if (!walletSnapshot.exists) {
            console.log("Error updating wallet for new transaction: ");
            return {
                success: false,
                msg: "Wallet not found",
            };
        }

        const walletData = walletSnapshot.data() as WalletType;

        if (type == "expense" && walletData.amount! - amount < 0) {
            return {
                success: false,
                msg: "Selected wallet don;t have enough balance",
            };
        }

        const updateType = type == "income" ? "totalIncome" : "totalExpenses";
        const updatedWalletAmount =
            type == "income"
                ? Number(walletData.amount) + amount
                : Number(walletData.amount) - amount;

        const updatedTotals =
            type == "income"
                ? Number(walletData.totalIncome) + amount
                : Number(walletData.totalExpenses) + amount;

        await updateDoc(walletRef, {
            amount: updatedWalletAmount,
            [updateType]: updatedTotals,
        });
        return { success: true };
    } catch (err: any) {
        console.log("Error updating wallet for new transaction: ", err.message);
        return {
            success: false,
            msg: err.message,
        };
    }
};
