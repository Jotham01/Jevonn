import React from "react";
const TAX_RATE = 0.1;

export default function Cart({
    lines,
    onSetQty,
    customerName,
    onNameChange,
    onCheckout,
    placing
}) {
    const subtotal = lines.reduce((s, l) => s + l.item.price * l.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    const empty = lines.length === 0;

    return (
        <div className="cart">
            <h2>Your Order</h2>
            {
                empty ? (
                    <p className="muted">Your cart is empty. Add something tasty.</p>
                ) : (
                    <ul className="cart-lines">
                        {lines.map(({ item, quantity }) => (
                            <li key={item.id} className="cart-line">
                                <div className="cart-line-info">
                                    <span className="cart-line-name">{item.name}</span>
                                    <span className="cart-line-price">Rs.{(item.price * quantity)}</span>
                                </div>
                                <div className="qty">
                                    <button onClick={() => onSetQty(item.id, quantity - 1)}>-</button>
                                    <span>{quantity}</span>
                                    <button onClick={() => onSetQty(item.id, quantity + 1)}>+</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )
            }
            {
                !empty && (
                    <div className="totals">
                        <div className="row">
                            <span>Subtotal</span>
                            <span>Rs. {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="row">
                            <span>Tax (10%)</span>
                            <span>Rs. {tax.toFixed(2)}</span>
                        </div>
                        <div className="row">
                            <span>Total (10%)</span>
                            <span>Rs. {total.toFixed(2)}</span>
                        </div>
                    </div>
                )
            }

            <input className="name-input" type='text' placeholder="Your name" value={customerName}
                onChange={(e) => onNameChange(e.target.value)} />

            <button className="checkout-btn" disabled={empty || placing} onClick={onCheckout}>
                {placing ? "Placing order..." : "Place order and get bill"}
            </button>
        </div>
    )
}