import type { TransactionState, DepositContextAction } from './deposit-context-types';
import { initialTransactionState } from './deposit-context-types';

/**
 * Reducer for DepositContext state machine
 * 
 * Pure function that handles all state transitions
 * Benefits:
 * - No invalid states possible
 * - Easy to test (pure function)
 * - Clear state transitions
 * - Single source of truth
 */
export function depositContextReducer(
  state: TransactionState,
  action: DepositContextAction
): TransactionState {
  switch (action.type) {
    case 'START_APPROVING':
      return {
        phase: 'approving',
        tokenSymbol: action.payload.tokenSymbol,
        amount: action.payload.amount,
        type: 'deposit',
      };

    case 'START_DEPOSITING':
      return {
        phase: 'depositing',
        tokenSymbol: action.payload.tokenSymbol,
        amount: action.payload.amount,
        type: 'deposit',
      };

    case 'START_WITHDRAWING':
      return {
        phase: 'withdrawing',
        tokenSymbol: action.payload.tokenSymbol,
        amount: null, // Withdraw doesn't track amount in context
        type: 'withdraw',
      };

    case 'COMPLETE_TRANSACTION':
    case 'RESET':
      return initialTransactionState;

    default:
      return state;
  }
}
