/**
 * Centralized Transaction Manager
 *
 * Solves the Wagmi singleton problem by providing a single source of truth
 * for all transaction state across tokens and transaction types.
 *
 * Key features:
 * - Automatic cleanup of stale transactions when new ones start
 * - Token isolation (each token has independent transaction state)
 * - Type isolation (deposit/withdraw/approve tracked separately)
 * - Subscribe pattern for reactive UI updates
 * - Built-in toast notification management
 */

export type TransactionType = 'deposit' | 'withdraw' | 'approve';
export type TransactionStatus = 'pending' | 'success' | 'error' | 'idle';

export interface Transaction {
	hash: string | null;
	tokenSymbol: string;
	type: TransactionType;
	status: TransactionStatus;
	error?: Error;
	timestamp: number;
	/** Track if we've seen wagmi's isPending=true for this hash */
	hasSeenPending: boolean;
	/** Track if we've seen wagmi's isSuccess=true for this hash */
	hasSeenSuccess: boolean;
	/** Track if we've shown toast for this transaction */
	hasShownToast: boolean;
}

class TransactionManager {
	/** Map of hash -> Transaction */
	private transactions = new Map<string, Transaction>();

	/** Map of tokenSymbol:type -> Transaction for quick lookup */
	private byTokenType = new Map<string, Transaction>();

	/** Set of listeners for subscribe pattern */
	private listeners = new Set<() => void>();

	/** Version counter for useSyncExternalStore */
	private version = 0;

	/**
	 * Start a new transaction for a token
	 * Automatically clears any existing transaction for this token+type
	 * Auto-marks as pending if hash is provided (transaction already submitted)
	 */
	startTransaction(
		tokenSymbol: string,
		type: TransactionType,
		hash: string | null = null
	): void {
		const key = this.makeKey(tokenSymbol, type);

		// Clear old transaction for this token+type
		const oldTx = this.byTokenType.get(key);
		if (oldTx?.hash) {
			this.transactions.delete(oldTx.hash);
		}

		// Auto-mark pending if we have a hash (transaction already submitted)
		// This handles cases where transaction is so fast that isPending never becomes true
		const hasSeenPending = !!hash;

		// Create new transaction
		const transaction: Transaction = {
			hash,
			tokenSymbol,
			type,
			status: 'pending',
			timestamp: Date.now(),
			hasSeenPending,
			hasSeenSuccess: false,
			hasShownToast: false,
		};

		// Store by both hash and token:type
		if (hash) {
			this.transactions.set(hash, transaction);
		}
		this.byTokenType.set(key, transaction);

		this.notify();
	}

	/**
	 * Update transaction hash (for when hash appears after pending state)
	 * Always marks as pending since having a hash means transaction was submitted
	 */
	updateHash(tokenSymbol: string, type: TransactionType, hash: string): void {
		const key = this.makeKey(tokenSymbol, type);
		const tx = this.byTokenType.get(key);

		if (!tx) {
			console.warn(`[TxManager] Cannot update hash - no transaction found for ${key}`);
			return;
		}

		// Remove old hash reference if it exists
		if (tx.hash) {
			this.transactions.delete(tx.hash);
		}

		// Update hash and mark pending (hash means transaction was submitted)
		tx.hash = hash;
		tx.hasSeenPending = true;
		this.transactions.set(hash, tx);

		this.notify();
	}

	/**
	 * Mark that we've seen wagmi's isPending=true
	 */
	markPendingSeen(hash: string): void {
		const tx = this.transactions.get(hash);
		if (tx && !tx.hasSeenPending) {
			tx.hasSeenPending = true;
			this.notify();
		}
	}

	/**
	 * Mark that we've seen wagmi's isSuccess=true
	 */
	markSuccessSeen(hash: string): void {
		const tx = this.transactions.get(hash);
		if (tx && !tx.hasSeenSuccess) {
			tx.hasSeenSuccess = true;
			this.notify();
		}
	}

	/**
	 * Update transaction status
	 */
	updateStatus(
		tokenSymbol: string,
		type: TransactionType,
		status: TransactionStatus,
		error?: Error
	): void {
		const key = this.makeKey(tokenSymbol, type);
		const tx = this.byTokenType.get(key);

		if (!tx) {
			console.warn(`[TxManager] Cannot update status - no transaction found for ${key}`);
			return;
		}

		tx.status = status;
		if (error) {
			tx.error = error;
		}

		this.notify();
	}

	/**
	 * Mark that toast has been shown for this transaction
	 */
	markToastShown(hash: string): void {
		const tx = this.transactions.get(hash);
		if (tx) {
			tx.hasShownToast = true;
			this.notify();
		}
	}

	/**
	 * Clear transaction for a specific token+type
	 */
	clearTransaction(tokenSymbol: string, type: TransactionType): void {
		const key = this.makeKey(tokenSymbol, type);
		const tx = this.byTokenType.get(key);

		if (tx?.hash) {
			this.transactions.delete(tx.hash);
		}
		this.byTokenType.delete(key);

		this.notify();
	}

	/**
	 * Get transaction by token and type
	 */
	getTransaction(tokenSymbol: string, type: TransactionType): Transaction | null {
		const key = this.makeKey(tokenSymbol, type);
		return this.byTokenType.get(key) || null;
	}

	/**
	 * Get transaction by hash
	 */
	getByHash(hash: string): Transaction | null {
		return this.transactions.get(hash) || null;
	}

	/**
	 * Get all active transactions
	 */
	getAllTransactions(): Transaction[] {
		return Array.from(this.byTokenType.values());
	}

	/**
	 * Check if token has active transaction of any type
	 */
	hasActiveTransaction(tokenSymbol: string): boolean {
		return this.getAllTransactions().some(
			tx => tx.tokenSymbol === tokenSymbol && tx.status === 'pending'
		);
	}

	/**
	 * Get the currently pending deposit transaction (for optimistic UI in positions table)
	 */
	getPendingDeposit(): Transaction | null {
		return (
			Array.from(this.byTokenType.values()).find(
				tx => tx.type === 'deposit' && tx.status === 'pending'
			) || null
		);
	}

	/**
	 * Subscribe to transaction changes
	 * Using arrow function to preserve 'this' context
	 */
	subscribe = (callback: () => void): (() => void) => {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	};

	/**
	 * Get snapshot for useSyncExternalStore
	 * Return version counter to trigger re-renders
	 */
	getSnapshot = (): number => {
		return this.version;
	};

	/**
	 * Notify all listeners of changes
	 */
	private notify(): void {
		this.version++;
		this.listeners.forEach(callback => callback());
	}

	/**
	 * Create key for token:type lookup
	 */
	private makeKey(tokenSymbol: string, type: TransactionType): string {
		return `${tokenSymbol}:${type}`;
	}

	/**
	 * Clear all transactions (for testing/debug)
	 */
	clearAll(): void {
		this.transactions.clear();
		this.byTokenType.clear();
		this.notify();
	}
}

// Export singleton instance
export const transactionManager = new TransactionManager();
