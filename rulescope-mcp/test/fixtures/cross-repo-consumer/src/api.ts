const BASE_URL = "https://api.example.com";

export async function getShippingRates(): Promise<unknown> {
  const res = await fetch("/api/shipping");
  return res.json();
}

export async function getShippingRatesFromHost(host: string): Promise<unknown> {
  const res = await fetch(`${host}/api/shipping`);
  return res.json();
}

export async function getDynamicPath(): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/shipping`);
  return res.json();
}
