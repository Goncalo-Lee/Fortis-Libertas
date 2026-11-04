/**
 * Seeds the global catalogs: Color, Icon, Language and Currency.
 *
 * Idempotent: rows are matched by their unique keys (name / code), so it can be run
 * several times. Existing ids are kept; only the descriptive fields are refreshed.
 *
 * Run with: bun run db:seed:catalogs
 */
import { sql } from "drizzle-orm";
import { db, poolConnection } from "../index";
import { color, currency, icon, language } from "../schema";
import { generateId } from "../types";

/** Exactly two colors are reserved: they belong to the seeded Income and Expenses record types. */
const COLORS = [
    { name: "Income Green", codeColor: "#2E7D32", isReserved: true },
    { name: "Expenses Red", codeColor: "#C62828", isReserved: true },
    { name: "Blue", codeColor: "#1E88E5", isReserved: false },
    { name: "Light Blue", codeColor: "#29B6F6", isReserved: false },
    { name: "Navy", codeColor: "#1A237E", isReserved: false },
    { name: "Indigo", codeColor: "#3949AB", isReserved: false },
    { name: "Purple", codeColor: "#8E24AA", isReserved: false },
    { name: "Deep Purple", codeColor: "#5E35B1", isReserved: false },
    { name: "Lavender", codeColor: "#9575CD", isReserved: false },
    { name: "Pink", codeColor: "#D81B60", isReserved: false },
    { name: "Rose", codeColor: "#F06292", isReserved: false },
    { name: "Orange", codeColor: "#FB8C00", isReserved: false },
    { name: "Deep Orange", codeColor: "#F4511E", isReserved: false },
    { name: "Amber", codeColor: "#FFB300", isReserved: false },
    { name: "Yellow", codeColor: "#FDD835", isReserved: false },
    { name: "Lime", codeColor: "#C0CA33", isReserved: false },
    { name: "Olive", codeColor: "#827717", isReserved: false },
    { name: "Light Green", codeColor: "#7CB342", isReserved: false },
    { name: "Teal", codeColor: "#00897B", isReserved: false },
    { name: "Cyan", codeColor: "#00ACC1", isReserved: false },
    { name: "Brown", codeColor: "#6D4C41", isReserved: false },
    { name: "Sand", codeColor: "#BCAAA4", isReserved: false },
    { name: "Grey", codeColor: "#757575", isReserved: false },
    { name: "Blue Grey", codeColor: "#546E7A", isReserved: false },
];

/** `codeIcon` is a Material Symbols name (snake_case). */
const ICONS = [
    { name: "Shopping cart", codeIcon: "shopping_cart" },
    { name: "Groceries", codeIcon: "local_grocery_store" },
    { name: "Restaurant", codeIcon: "restaurant" },
    { name: "Coffee", codeIcon: "local_cafe" },
    { name: "Home", codeIcon: "home" },
    { name: "Car", codeIcon: "directions_car" },
    { name: "Fuel", codeIcon: "local_gas_station" },
    { name: "Public transport", codeIcon: "directions_bus" },
    { name: "Flight", codeIcon: "flight" },
    { name: "Hotel", codeIcon: "hotel" },
    { name: "Education", codeIcon: "school" },
    { name: "Health", codeIcon: "medical_services" },
    { name: "Fitness", codeIcon: "fitness_center" },
    { name: "Movies", codeIcon: "movie" },
    { name: "Games", codeIcon: "sports_esports" },
    { name: "Music", codeIcon: "music_note" },
    { name: "Pets", codeIcon: "pets" },
    { name: "Children", codeIcon: "child_care" },
    { name: "Clothing", codeIcon: "checkroom" },
    { name: "Savings", codeIcon: "savings" },
    { name: "Bank", codeIcon: "account_balance" },
    { name: "Payments", codeIcon: "payments" },
    { name: "Credit card", codeIcon: "credit_card" },
    { name: "Receipt", codeIcon: "receipt_long" },
    { name: "Work", codeIcon: "work" },
    { name: "Investment", codeIcon: "trending_up" },
    { name: "Expense", codeIcon: "trending_down" },
    { name: "Loan", codeIcon: "request_quote" },
    { name: "Donation", codeIcon: "volunteer_activism" },
    { name: "Electricity", codeIcon: "bolt" },
    { name: "Water", codeIcon: "water_drop" },
    { name: "Internet", codeIcon: "wifi" },
    { name: "Phone", codeIcon: "phone_iphone" },
    { name: "Repairs", codeIcon: "build" },
    { name: "Laundry", codeIcon: "local_laundry_service" },
    { name: "Gift", codeIcon: "card_giftcard" },
    { name: "Celebration", codeIcon: "celebration" },
    { name: "Other", codeIcon: "category" },
];

const LANGUAGES = [
    { code: "en", name: "English" },
    { code: "pt-PT", name: "Português (Portugal)" },
];

const CURRENCIES = [
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "GBP", name: "Pound Sterling", symbol: "£" },
    { code: "BRL", name: "Brazilian Real", symbol: "R$" },
];

async function main() {
    await db
        .insert(color)
        .values(COLORS.map((c) => ({ id: generateId(), ...c })))
        .onDuplicateKeyUpdate({
            set: { name: sql`values(name)`, codeColor: sql`values(code_color)`, isReserved: sql`values(is_reserved)` },
        });

    await db
        .insert(icon)
        .values(ICONS.map((i) => ({ id: generateId(), ...i })))
        .onDuplicateKeyUpdate({ set: { name: sql`values(name)`, codeIcon: sql`values(code_icon)` } });

    await db
        .insert(language)
        .values(LANGUAGES.map((l) => ({ id: generateId(), ...l })))
        .onDuplicateKeyUpdate({ set: { code: sql`values(code)`, name: sql`values(name)` } });

    await db
        .insert(currency)
        .values(CURRENCIES.map((c) => ({ id: generateId(), ...c })))
        .onDuplicateKeyUpdate({
            set: { code: sql`values(code)`, name: sql`values(name)`, symbol: sql`values(symbol)` },
        });

    const reserved = await db.select({ id: color.id }).from(color).where(sql`${color.isReserved} = true`);
    if (reserved.length !== 2) {
        throw new Error(`Expected exactly 2 reserved colors, found ${reserved.length}.`);
    }

    const count = async (table: typeof color | typeof icon | typeof language | typeof currency) =>
        (await db.select({ n: sql<number>`count(*)` }).from(table))[0]?.n;

    console.log(
        `Catalogs ready: ${await count(color)} colors (2 reserved), ${await count(icon)} icons, ` +
            `${await count(language)} languages, ${await count(currency)} currencies.`,
    );
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => poolConnection.end());
