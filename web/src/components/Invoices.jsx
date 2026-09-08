import React from "react";
import { useEffect, useState } from "react";
import { fetchOrders } from "../api";

export default function Invoices({ refreshKey, onOpen }) {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        setLoading(true);
        fetchOrders()
            .then(setOrders)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [refreshKey])

    if (loading) return <p className="muted">Loading Invoices...</p>;
    if (error) return <div className="banner-error">{error}</div>
    if (orders.length === 0) return <div className="muted">No Inoives yet</div>

    return (
        <div className="invoices">
            <h2 className="menu-group-title">Invoices</h2>
            <div className="invoice-list">
                {orders.map((o) => (
                    <button key={o.id} className="invoice-row" onClick={() => onOpen(o)}>
                        <div className="invoice-main">
                            <span className="invoice-id">Invoice #{o.id}</span>
                            <span className="invoice-customer">{o.customerName}</span>
                        </div>
                        <div className="invoice-meta">
                            <span className="invoice-date">{formatDate(o.createdAt)}</span>
                            <span className="invoice-items">{o.items.reduce((s, i) => s + i.quantity, 0)} items</span>
                        </div>
                        <div className="invoice-total"> Rs. {o.bill.total.toFixed(2)}</div>
                    </button>
                ))}
            </div>
        </div>
    )
}

function formatDate(s) {
    if (!s) return "";
    const iso = s.replace(" ", "T") + "Z";
    const d = new Date(iso);
    return isNaN(d) ? s : d.toLocaleString();
}