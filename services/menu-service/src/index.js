import express from "express";
import cors from "cors";
import db from "./db.js";
import { seedIfEmpty } from "./seed.js";

if (process.env.SEED_ON_START === "true") {
    const count = seedIfEmpty();
    console.log(`menu catalog ready (${count} items)`);
}

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4001;


// Health check
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "menu-service"
    });
});


// Get all menu items
app.get("/api/menu", (_req, res) => {

    const items = db
        .prepare(
            "SELECT * FROM menu_items ORDER BY category, name"
        )
        .all();

    res.json(items.map(toItem));
});


// Get a single menu item
app.get("/api/menu/:id", (req, res) => {

    const item = db
        .prepare(
            "SELECT * FROM menu_items WHERE id = ?"
        )
        .get(req.params.id);

    if (!item) {
        return res.status(404).json({
            error: "Menu item not found"
        });
    }

    res.json(toItem(item));
});


// Create a menu item
app.post("/api/menu", (req, res) => {
    debugger
    const {
        name,
        description = "",
        price,
        category = "Mains"
    } = req.body || {};

    if (
        !name ||
        typeof price !== "number" ||
        price < 0
    ) {
        return res.status(400).json({
            error:
                "name and a non-negative numeric price are required"
        });
    }

    const info = db
        .prepare(
            `INSERT INTO menu_items
            (name, description, price, category)
            VALUES (?, ?, ?, ?)`
        )
        .run(
            name,
            description,
            price,
            category
        );

    const item = db
        .prepare(
            "SELECT * FROM menu_items WHERE id = ?"
        )
        .get(info.lastInsertRowid);

    res.status(201).json(toItem(item));
});


// Convert database row to API object
function toItem(row) {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        price: row.price,
        category: row.category,
        available: !!row.available
    };
}


// Start server
app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `menu-service listening on http://0.0.0.0:${PORT}`
        );
    }
);