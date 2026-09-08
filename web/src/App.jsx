import React from "react";
import { useEffect, useMemo, useState } from "react";
import { fetchMenu, placeOrder } from "./api.js";
import Menulist from "./components/MenuList.jsx";
import Cart from "./components/Cart.jsx";
import Receipt from "./components/Receipt.jsx";
import Invoices from "./components/Invoices.jsx";

export default function App() {

    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // cart: { [menuItemId]: quantity }

    const [cart, setCart] = useState({});
    const [customerName, setCustomerName] = useState("");
    const [placing, setPlacing] = useState(false);
    const [order, setOrder] = useState(null);


    // view: "menu" | "invoices"
    const [view, setView] = useState("menu");
    // the invoice currently open in the modal (when viewing past bills)
    const [openInvoice, setOpenInvoice] = useState(null);
    // bumped whenever a new order is placed, to refresh the invoices list
    const [invoicesRefresh, setInvoicesRefresh] = useState(0);

    useEffect(() => {
        fetchMenu()
            .then((items) => setMenu(items))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));

    }, []);

    const cartLines = useMemo(() => {
        return Object.entries(cart)
            .map(([id, qty]) => {
                const item = menu.find((m) => m.id === Number(id));
                return item ? { item, quantity: qty } : null;
            })
            .filter(Boolean);
    }, [cart, menu]);



    const cartCount = cartLines.reduce((s, l) => s + l.quantity, 0);

    function addToCart(item) {
        setCart((c) => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }));
    }
    function setQty(itemId, qty) {

        setCart((c) => {
            const next = { ...c };
            if (qty <= 0) delete next[itemId];
            else next[itemId] = qty;
            return next;
        });
    }

    async function handleCheckout() {
        setError(null);
        setPlacing(true);
        try {
            const items = cartLines.map((l) => ({ menuItemId: l.item.id, quantity: l.quantity }));
            const result = await placeOrder(customerName.trim() || "Guest", items);
            setOrder(result);
            setCart({});
            setCustomerName("");
            setInvoicesRefresh((n) => n + 1);
        } catch (e) {
            setError(e.message);
        } finally {
            setPlacing(false);
        }

    }

    return (
        <div className="app">
            <header className="topbar">
                <div className="brand">
                    <span className="logo"></span>
                    <div>
                        <h1>FoodKart</h1>
                        <p className="tagline">Order fresh. Pay easy.</p>
                    </div>
                </div>

                <div className="header-right">


                    <nav className="tabs">
                        <button
                            className={view === "menu" ? "tab active" : "tab"}
                            onClick={() => setView("invoices")}

                        >
                            Menu
                        </button>

                        <button
                            className={view === "invoices" ? "tab-active" : "tab"}
                            onClick={() => setView("invoives")}
                        >
                            invoices
                        </button>
                    </nav>
                    {view === "menu" && <div className="cart-pill"> {cartCount}</div>}
                </div>
            </header >

            {error && <div className="banner error">{error}</div>}

            {view === "menu" ? (

                <main className="layout">

                    <section className="menu-col">

                        {loading ? (

                            <p className="muted">Loading the menu...</p>

                        ) : (
                            <Menulist menu={menu} onAdd={addToCart} />

                        )}

                    </section>

                    <aside className="side-col">
                        <Cart
                            lines={cartLines}
                            onSetQty={setQty}
                            customerName={customerName}
                            onNameChange={setCustomerName}
                            onCheckout={handleCheckout}
                            placing={placing}
                        />
                    </aside>
                </main>

            ) : (

                <main>

                    <Invoices refreshKey={invoicesRefresh} onOpen={setOpenInvoice} />

                </main>
            )}

            {order && <Receipt order={order} onClose={() => setOrder(null)} />}

            {
                openInvoice && (

                    <Receipt order={openInvoice} mode="invoice" onClose={() => setOpenInvoice(null)} />
                )}


            <footer className="footer">
                <span>menu-serice . order-service . React</span>
            </footer>
        </div >
    );
}