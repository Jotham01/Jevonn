import { pathToFileURL } from "url";
import db from "./db.js";

export const seedItems = [
    // Starters
    {
        name: "Garlic Bread",
        description: "Toasted sourdough, roasted garlic butter, parsley",
        price: 5.5,
        category: "Starters"
    },
    {
        name: "Loaded Nachos",
        description: "Corn chips, melted cheese, jalapeños, salsa, sour cream",
        price: 8.8,
        category: "Starters"
    },
    {
        name: "Soup of the Day",
        description: "Ask your server - always fresh, always warm",
        price: 6.0,
        category: "Starters"
    },

    // Mains
    {
        name: "Classic Cheeseburger",
        description: "Beef patty, cheddar, lettuce, tomato, house sauce, fries",
        price: 12.5,
        category: "Mains"
    },
    {
        name: "Margherita Pizza",
        description: "San Marzano tomato, fresh mozzarella, basil",
        price: 11.0,
        category: "Mains"
    },
    {
        name: "Grilled Chicken Bowl",
        description: "Chicken, quinoa, roasted veg, tahini dressing",
        price: 13.0,
        category: "Mains"
    },
    {
        name: "Veggie Pad Thai",
        description: "Rice noodles, tofu, peanuts, tamarind, lime",
        price: 12.0,
        category: "Mains"
    },

    // Desserts
    {
        name: "Chocolate Lava Cake",
        description: "Warm molten center, vanilla ice cream",
        price: 7.8,
        category: "Desserts"
    },
    {
        name: "New York Cheesecake",
        description: "Classic baked cheesecake, berry compote",
        price: 6.5,
        category: "Desserts"
    },

    // Drinks
    {
        name: "Fresh Lemonade",
        description: "Hand-squeezed, lightly sweetened",
        price: 3.5,
        category: "Drinks"
    },
    {
        name: "Iced Latte",
        description: "Double shot espresso over ice",
        price: 4.0,
        category: "Drinks"
    },
    {
        name: "Sparkling Water",
        description: "Small bottle",
        price: 2.5,
        category: "Drinks"
    }
];


// Replace the whole catalog with the sample data.
export function seed() {

    db.exec("DELETE FROM menu_items;");

    const insert = db.prepare(
        `INSERT INTO menu_items
        (name, description, price, category)
        VALUES (@name, @description, @price, @category)`
    );

    const run = db.transaction((rows) => {
        rows.forEach((r) => insert.run(r));
    });

    run(seedItems);

    return db
        .prepare("SELECT COUNT(*) AS count FROM menu_items")
        .get().count;
}


// Insert sample data only if the catalog is currently empty.
export function seedIfEmpty() {

    const count = db
        .prepare("SELECT COUNT(*) AS count FROM menu_items")
        .get().count;

    if (count) {
        return count;
    }

    return seed();
}


// Allow running directly:
// node src/seed.js

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const count = seed();

    console.log(
        `Seeded ${count} menu items into menu.sqlite`
    );
}