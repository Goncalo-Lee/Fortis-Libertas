"use client"

import { z } from "zod"
import React, {useState} from "react";
import {authClient} from "@/lib/auth-client";
import {useRouter} from "next/navigation";
import { auth } from "@/lib/auth";

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
})

export default function TwoFactor() {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const verify = async () => {
        setError("");
        const { data, error: verifyError } = await authClient.twoFactor.verifyTotp({
            code,
            trustDevice: false,
        });

        if (verifyError) {
            setError(verifyError.message || "Failed to verify code");
            return; // stay on page
        }

        router.push("/dashboard");
    };



    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-full max-w-md p-8 space-y-6">
                <h2 className="text-2xl font-bold text-center">
                    Two-Factor Authentication
                </h2>

                <input
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    type="text"
                    maxLength={6}
                />

                {error && <p className="text-red-500 text-sm">{error}</p>}


                <button
                    onClick={verify}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Verify
                </button>
            </div>
        </div>
    )
}