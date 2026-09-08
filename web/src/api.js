const runtime = (typeof window !== "undefined" && window.__CONFIG__) || {};
const MENU_URL = runtime.MENU_URL || import.meta.env.VITE_MENU_URL || "http://localhost:4001";
const ORDER_URL = runtime.ORDER_URL || import.meta.env.VITE_ORDER_URL || "http://localhost:4002";

export async function fetchMenu() {
    const res = await fetch(`${MENU_URL}/api/menu`);
    if (!res.ok) throw new Error("Failed to load menu");
    return res.json();
}

export async function placeOrder(customerName, items) {
    const res = await fetch(`${ORDER_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, items })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Failed to place order");
    return data;
}

export async function fetchOrders() {
    const res = await fetch(`${ORDER_URL}/api/orders`);
    if (!res.ok) throw new Error("Failed to load orders");
    return res.json();
}