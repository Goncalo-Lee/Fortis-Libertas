import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { user } from "@/db/schema";
import { db } from "@/db";

async function seedAdmin() {
    console.log("🌱 Starting Admin seed...");

    try {
        const response = await auth.api.signUpEmail({
            body: {
                email: "admin@fortislibertas.com",
                password: "Password!",
                name: "Administrator",
            },
        });

        if (!response || !response.user) {
            console.log("⚠️ Failed to create. (The email might already exist in the database).");
            process.exit(1);
        }

        const currentUserId = response.user.id;

        // Promove a admin e verifica o email (bypassa a necessidade de ir ao email clicar no link)
        await db
            .update(user)
            .set({
                role: "admin",
                emailVerified: new Date()
            })
            .where(eq(user.id, currentUserId));

        console.log("✅ Admin successfully created, promoted, and verified!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error running seed:", error);
        process.exit(1);
    }
}

seedAdmin();