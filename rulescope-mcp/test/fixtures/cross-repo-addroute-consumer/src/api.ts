const API_HOST = "http://10.0.3.12:8080";

// fetch with template literal: ${API_HOST}/api/transfers
export async function postTransfer(payload: unknown): Promise<unknown> {
  const res = await fetch(`${API_HOST}/api/transfers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// fetch with concatenation: `${API_HOST}/api/accounts/` + id
export async function getAccount(id: string): Promise<unknown> {
  const res = await fetch(`${API_HOST}/api/accounts/` + id);
  return res.json();
}
