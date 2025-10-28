/**
 * Type definitions for DepositContext state machine
 * 
 * State Machine Pattern for managing deposit/withdraw operations
 * Prevents invalid states (e.g., depositing=true but token=null)
 */

// Transaction type
export type TransactionType = 'deposit' | 'withdraw';

// Transaction phase (state machine states)
export type TransactionPhase = 
  | 'idle'           // No operation in progress
  | 'approving'      // Approval in progress (deposit only)
  | 'depositing'     // Deposit in progress
  | 'withdrawing';   // Withdraw in progress

// Transaction state (combines all related data)
export interface TransactionState {
  phase: TransactionPhase;
  tokenSymbol: string | null;
  amount: string | null;
  type: TransactionType | null;
}

// Action types (events that trigger state transitions)
export type DepositContextAction =
  | { type: 'START_APPROVING'; payload: { tokenSymbol: string; amount: string } }
  | { type: 'START_DEPOSITING'; payload: { tokenSymbol: string; amount: string } }
  | { type: 'START_WITHDRAWING'; payload: { tokenSymbol: string } }
  | { type: 'COMPLETE_TRANSACTION' }
  | { type: 'RESET' };

// Initial state
export const initialTransactionState: TransactionState = {
  phase: 'idle',
  tokenSymbol: null,
  amount: null,
  type: null,
};

// Derived state helpers (computed properties)
export function isDepositing(state: TransactionState): boolean {
  return state.phase === 'depositing' || state.phase === 'approving';
}

export function isWithdrawing(state: TransactionState): boolean {
  return state.phase === 'withdrawing';
}

export function isProcessing(state: TransactionState): boolean {
  return state.phase !== 'idle';
}
