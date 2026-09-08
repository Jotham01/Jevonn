import React from "react";
const CATEGORY_ICONS = {
    Starters: "",
    Mains: "",
    Desserts: "",
    Drinks: ""
}

export default function Menulist({ menu, onAdd }) {
    const order = ["Starters", "Mains", "Desserts", "Drinks"];
    const groups = {};
    for (const item of menu) {
        (groups[item.category] ||= []).push(item);
    }

    const categories = Object.keys(groups).sort(
        (a, b) => (order.indexOf(a) + 100) - (order.indexOf(b) + 100)
    )

    return (
        <div className="menu">
            {categories.map((cat) => (
                <div key={cat} className="menu-group">
                    <h2 className="menu-group-title">
                        <span>{CATEGORY_ICONS[cat]} || ""</span>
                    </h2>
                    <div className="cards">
                        {groups[cat].map((item) => (
                            <article key={item.id} className="card">
                                <div className="card-body">
                                    <div className="card-head">
                                        <h3>{item.name}</h3>
                                        <span className="price">Rs. {item.price.toFixed(2)}</span>
                                    </div>
                                    <span className="desc">{item.description}</span>
                                </div>
                                <button className="add-btn" onClick={() => onAdd(item)}>
                                    Add +
                                </button>
                            </article>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}