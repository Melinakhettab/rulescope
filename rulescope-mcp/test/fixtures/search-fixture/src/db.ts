export const DB_TABLE = "orders";

export function buildQuery(userId: string): string {
  return `SELECT * FROM orders WHERE user_id = '${userId}'`;
}
