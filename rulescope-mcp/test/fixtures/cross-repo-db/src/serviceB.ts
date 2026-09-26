// Service B: reads from the same orders table and listens on the same topic
export function listUserOrders(userId: number): string {
  return `SELECT id, total FROM orders WHERE user_id = ${userId}`;
}

export function joinOrderItems(): string {
  return "SELECT o.id, i.name FROM orders JOIN order_items i ON o.id = i.order_id";
}

export const LISTEN_TOPIC = "topic:order.created";
