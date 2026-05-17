export const FREE_DAILY_TASK_LIMIT = 3;

export type TransactionRow = {
  id: string;
  order_id: string;
  payment_id: string | null;
  amount: string;
  status: string;
  plan_selected: string;
  created_at: string | null;
};
