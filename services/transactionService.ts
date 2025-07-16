import { firestore } from "@/config/firebase";
import { ResponseType, TransactionType, WalletType } from "@/types";
import { getLast7Days } from "@/utils/common";
import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	setDoc,
	Timestamp,
	updateDoc,
	where,
} from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";
import { createOrUpdateWallet } from "./walletService";

export const createOrUpdateTransaction = async (
	transactionData: Partial<TransactionType>
): Promise<ResponseType> => {
	try {
		const { id, type, walletId, image, amount } = transactionData;
		if (!amount || amount <= 0 || !walletId || !type) {
			return {
				success: false,
				msg: "Data is invalid!",
			};
		}

		if (id) {
			const oldTransactionSnapshot = await getDoc(
				doc(firestore, "transactions", id)
			);
			const oldTransaction =
				oldTransactionSnapshot.data() as TransactionType;

			const shouldRevertOriginal =
				oldTransaction.type != type ||
				oldTransaction.amount != amount ||
				oldTransaction.walletId != walletId;

			if (shouldRevertOriginal) {
				let res = await revertAndUpdateWallets(
					oldTransaction,
					Number(amount),
					type,
					walletId
				);

				if (!res.success) return res;
			}
		} else {
			//update wallet for new transaction
			//update wallet
			let res = await updateWalletForNewTransaction(
				walletId!,
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
const revertAndUpdateWallets = async (
	oldTransaction: TransactionType,
	newTransactionAmount: number,
	newTransactionType: string,
	newWalletId: string
) => {
	try {
		const originalWalletSnapshot = await getDoc(
			doc(firestore, "wallets", oldTransaction.walletId)
		);

		const originalWallet = originalWalletSnapshot.data() as WalletType;

		let newWalletSnapshot = await getDoc(
			doc(firestore, "wallets", newWalletId)
		);

		let newWallet = newWalletSnapshot.data() as WalletType;

		const revertType =
			oldTransaction.type == "income" ? "totalIncome" : "totalExpenses";

		const revertIncomeExpense: number =
			oldTransaction.type == "income"
				? -Number(oldTransaction.amount)
				: Number(oldTransaction.amount);

		const revertedWalletAmount =
			Number(originalWallet.amount) + revertIncomeExpense;
		//wallet amount, after the transaction is removed

		const revertedIncomeExpenseAmount =
			Number(originalWallet[revertType]) - Number(oldTransaction.amount);

		if (newTransactionType == "expense") {
			//if user tries to convert income to expense on the same wallet
			//or if the user tries to increase the expense amount and don't have enough balance

			if (
				oldTransaction.walletId == newWalletId &&
				revertedWalletAmount < newTransactionAmount
			) {
				return {
					success: false,
					msg: "The selected wallet don't have enough balance",
				};
			}

			//if user tries to add expense from a new wallet but the wallet don't have enough balance
			if (newWallet.amount! < newTransactionAmount) {
				return {
					success: false,
					msg: "The selected wallet don't have enough balance",
				};
			}
		}

		await createOrUpdateWallet({
			id: oldTransaction.walletId,
			amount: revertedWalletAmount,
			[revertType]: revertedIncomeExpenseAmount,
		});

		///////////////////////////////////////
		//refetch the newWallet b/c we may have just updated at
		newWalletSnapshot = await getDoc(
			doc(firestore, "wallets", newWalletId)
		);

		newWallet = newWalletSnapshot.data() as WalletType;

		const updateType =
			newTransactionType == "income" ? "totalIncome" : "totalExpenses";

		const updatedTransactionAmount: number =
			newTransactionType == "income"
				? Number(newTransactionAmount)
				: -Number(newTransactionAmount);

		const newWalletAmount =
			Number(newWallet.amount) + updatedTransactionAmount;

		const newIncomeExpenseAmount = Number(
			newWallet[updateType]! + Number(newTransactionAmount)
		);

		await createOrUpdateWallet({
			id: newWalletId,
			amount: newWalletAmount,
			[updateType]: newIncomeExpenseAmount,
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

export const deleteTransaction = async (
	transactionId: string,
	walletId: string
) => {
	try {
		const transactionRef = doc(firestore, "transactions", transactionId);
		const transactionSnapshot = await getDoc(transactionRef);

		if (!transactionSnapshot.exists()) {
			return {
				success: false,
				msg: "Transaction not found",
			};
		}

		const transactionData = transactionSnapshot.data() as TransactionType;

		const transactionType = transactionData?.type;
		const transactionAmount = transactionData?.amount;

		//fetch wallet
		const walletSnapshot = await getDoc(
			doc(firestore, "wallets", walletId)
		);
		const walletData = walletSnapshot.data() as WalletType;

		const updateType =
			transactionType == "income" ? "totalIncome" : "totalExpenses";

		const newWalletAmount =
			walletData?.amount! -
			(transactionType == "income"
				? transactionAmount
				: -transactionAmount);

		const newIncomeExpenseAmount =
			walletData[updateType]! - transactionAmount;

		if (transactionType == "income" && newWalletAmount < 0) {
			return {
				success: false,
				msg: "You cannot delete this transaction",
			};
		}

		await createOrUpdateWallet({
			id: walletId,
			amount: newWalletAmount,
			[updateType]: newIncomeExpenseAmount,
		});

		await deleteDoc(transactionRef);

		return { success: true };
	} catch (err: any) {
		console.log("Error updating wallet for new transaction: ", err.message);
		return {
			success: false,
			msg: err.message,
		};
	}
};
export const fetchWeeklyStats = async (uid: string): Promise<ResponseType> => {
	try {
		const db = firestore;
		const today = new Date();
		const sevenDaysAgo = new Date(today);
		sevenDaysAgo.setDate(today.getDate() - 7);

		const transactionsQuery = query(
			collection(db, "transactions"),
			where("date", ">=", Timestamp.fromDate(sevenDaysAgo)),
			where("date", "<=", Timestamp.fromDate(today)),
			orderBy("date", "desc"),
			where("uid", "==", uid)
		);

		const querySnapshot = await getDocs(transactionsQuery);
		const weeklyData = getLast7Days();

		return { success: true };
	} catch (err: any) {
		console.log("Error fetching weekly stats: ", err.message);
		return {
			success: false,
			msg: err.message,
		};
	}
};
