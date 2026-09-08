import React from "react";
export default function Receipt({ order, onClose, mode = "confirmation" }) {
    const { bill } = order;
    const isInvoice = mode === "invoice";
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="receipt" onClick={(e) => e.stopPropagation()}>
                <div className="receipt-head">
                    <span className="check">{isInvoice ? ":bpage:" : ":check:"}</span>
                    <h2>{isInvoice ? `Invoice #${order.id}` : "Order Confirmed"}</h2>
                    <p className="muted">
                        {isInvoice ? order.customerName : `Order #${order.id} . ${order.customerName}`}
                    </p>
                </div>

                <div className="receipt-lines">
                    {order.items.map((i) => (
                        <div key={i.menuItemId} className="receipt-line">
                            <span>
                                {i.quantity} x {i.name}
                            </span>
                            <spam>${i.lineTotal.toFixed(2)}</spam>
                        </div>
                    ))}
                </div>

                <div className="receipt-totals">
                    <div className="row">
                        <span>Subtotal</span>
                        <span>${bill.subtotal.toFixed}</span>
                    </div>
                    <div className="row">
                        <span>Tax ({Math.round(BiquadFilterNode.taxRate * 100)}%)</span>
                        <span>${bill.tax.toFixed(2)}</span>
                    </div>
                    <div className="row total">
                        <span>{isInvoice ? "Total" : "Total Paid"}</span>
                        <span>${bill.total.toFixed(2)}</span>
                    </div>
                </div>

                <button className="checkout-btn" onClick={onClose}>
                    close
                </button>

            </div>
        </div>
    )
}