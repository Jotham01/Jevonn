import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;

// On a VM this would be the menu-vm's internal IP,
// e.g. http://10.128.0.5:4001
const MENU_SERVICE_URL =
    process.env.MENU_SERVICE_URL || "http://localhost:4001";

const TAX_RATE = 0.1; // 10% tax applied at billing


// Health check
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "order-service"
    });
});


// Place an order
//
// Body:
// {
//   "customerName": "John",
//   "items": [
//     {
//       "menuItemId": 1,
//       "quantity": 2
//     }
//   ]
// }
//
// The authoritative price of each item is fetched from
// the menu-service so the client cannot dictate prices.

app.post("/api/orders", async (req, res) => {

    const { customerName, items } = req.body || {};

    // Validate request
    if (
        !customerName ||
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return res.status(400).json({
            error:
                "customerName and a non-empty items array are required"
        });
    }

    try {

        const lineItems = [];

        // Get authoritative prices from menu-service
        for (const line of items) {

            const qty = Number(line.quantity) || 0;

            if (!line.menuItemId || qty <= 0) {
                return res.status(400).json({
                    error:
                        "each item needs a valid menuItemId and quantity > 0"
                });
            }

            // Service-to-service call to menu-service
            const resp = await fetch(
                `${MENU_SERVICE_URL}/api/menu/${line.menuItemId}`
            );

            if (resp.status === 404) {
                return res.status(400).json({
                    error:
                        `Menu item ${line.menuItemId} does not exist`
                });
            }

            if (!resp.ok) {
                return res.status(502).json({
                    error:
                        "menu-service is unavailable"
                });
            }

            const menuItem = await resp.json();

            const lineTotal = round(
                menuItem.price * qty
            );

            lineItems.push({
                name: menuItem.name,
                unitPrice: menuItem.price,
                menuItemId: menuItem.id,
                quantity: qty,
                lineTotal: lineTotal
            });
        }


        // Calculate bill
        const subtotal = round(
            lineItems.reduce(
                (sum, item) => sum + item.lineTotal,
                0
            )
        );

        const tax = round(
            subtotal * TAX_RATE
        );

        const total = round(
            subtotal + tax
        );


        // Save order and order items
        // inside a single transaction
        const orderId = db.transaction(() => {

            const info = db
                .prepare(
                    `INSERT INTO orders
                    (
                        customer_name,
                        subtotal,
                        tax,
                        total
                    )
                    VALUES (?, ?, ?, ?)`
                )
                .run(
                    customerName,
                    subtotal,
                    tax,
                    total
                );

            const oid = info.lastInsertRowid;


            const insItem = db.prepare(
                `INSERT INTO order_items
                (
                    order_id,
                    menu_item_id,
                    name,
                    unit_price,
                    quantity,
                    line_total
                )
                VALUES (?, ?, ?, ?, ?, ?)`
            );


            for (const item of lineItems) {

                insItem.run(
                    oid,
                    item.menuItemId,
                    item.name,
                    item.unitPrice,
                    item.quantity,
                    item.lineTotal
                );
            }

            return oid;
        })();


        // Return complete order
        res.status(201).json(
            getOrder(Number(orderId))
        );

    } catch (err) {

        console.error(err);

        res.status(502).json({
            error:
                "Could not reach menu-service",
            detail:
                String(err)
        });
    }
});


// List all orders
// Most recent first

app.get("/api/orders", (_req, res) => {

    const rows = db
        .prepare(
            "SELECT id FROM orders ORDER BY id DESC"
        )
        .all();

    res.json(
        rows.map((row) =>
            getOrder(row.id)
        )
    );
});


// Fetch one order and its itemized bill

app.get("/api/orders/:id", (req, res) => {

    const order = getOrder(
        Number(req.params.id)
    );

    if (!order) {
        return res.status(404).json({
            error: "Order not found"
        });
    }

    res.json(order);
});


// Build complete order response

function getOrder(id) {

    const order = db
        .prepare(
            "SELECT * FROM orders WHERE id = ?"
        )
        .get(id);

    if (!order) {
        return null;
    }


    const items = db
        .prepare(
            "SELECT * FROM order_items WHERE order_id = ?"
        )
        .all(id);


    return {
        id: order.id,

        customerName:
            order.customer_name,

        status:
            order.status,

        createdAt:
            order.created_at,

        items: items.map((item) => ({
            menuItemId:
                item.menu_item_id,

            name:
                item.name,

            unitPrice:
                item.unit_price,

            quantity:
                item.quantity,

            lineTotal:
                item.line_total
        })),

        bill: {
            subtotal:
                order.subtotal,

            tax:
                order.tax,

            total:
                order.total,

            taxRate:
                TAX_RATE
        }
    };
}


// Round to two decimal places

function round(n) {
    return Math.round(n * 100) / 100;
}


// Start server

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `order-service listening on http://0.0.0.0:${PORT} ` +
            `(menu at ${MENU_SERVICE_URL})`
        );
    }
);