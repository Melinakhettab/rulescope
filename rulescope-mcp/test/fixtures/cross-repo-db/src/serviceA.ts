// Service A: defines the orders table
export function createOrdersTable(): string {
  return "CREATE TABLE orders (id INT PRIMARY KEY, user_id INT, total DECIMAL)";
}

export function getOrders(userId: number): string {
  return `SELECT * FROM orders WHERE user_id = ${userId}`;
}

// Service A: publishes to an event topic
export const EVENT_TOPIC = "topic:order.created";
