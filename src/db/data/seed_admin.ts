import { eq } from "drizzle-orm";
import {auth} from "@/lib/auth";
import {user} from "@/db/schema";
import {db} from "@/db";

async function seedAdmin() {
    console.log("🌱 Starting Admin seed...");

    try {
        const response = await auth.api.signUpEmail({
            body: {
                email: "admin@fortislibertas.com",
                password: "SuperSecurePassword123!",
                name: "Administrator",
            },
        });

        if (!response || !response.user) {
            console.log("⚠️ Failed to create. (The email might already exist in the database).");
            process.exit(1);
        }

        const userId = response.user.id;

        // Promote to admin and verify email in a single database call
        await db
            .update(user)
            .set({
                role: "admin",
                emailVerified: new Date() // Bypasses the verification requirement
            })
            .where(eq(user.id, userId));

        console.log("✅ Admin successfully created, promoted, and verified!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error running seed:", error);
        process.exit(1);
    }
}

seedAdmin();