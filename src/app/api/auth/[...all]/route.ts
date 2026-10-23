/*
import { auth } from "@/lib/auth"; // Your better-auth instance
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    // 1. Clone the request so we can read the body without consuming it
    const reqClone = req.clone();

    try {
        const body = await reqClone.json();
        console.log("🛠️ INCOMING AUTH POST:", req.nextUrl.pathname);
        console.log("📦 PAYLOAD:", body);
    } catch (e) {
        console.log("Could not parse body");
    }

    // 2. Pass the original request to Better Auth
    return auth.handler(req);
}

export const GET = auth.handler;
 */


import { auth } from "@/lib/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
