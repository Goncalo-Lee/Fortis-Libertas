"use client"
import {authClient} from "@/lib/auth-client";
import {useState} from "react";


export default function Enable2FA({ session }: any) {
    if (!session || !session.user) {
        return <p>Loading user data...</p>; // Or return null to show nothing
    }

    const [step, setStep] = useState<"idle" | "qr" | "verify">("idle");
    const [totpURI, setTotpURI] = useState("");
    const [code, setCode] = useState("");

    const startEnable2FA = async () => {
        const pass = prompt("Enter your password to enable 2FA");
        if (!pass) return;

        console.log("Checking 1");


        const { data } = await authClient.twoFactor.enable({
            password: pass,
            method: "totp",
            issuer: "Fortis Libertas",
        });


        if (data?.totpURI) {
            console.log("Checking");
            setStep("qr");
            setTotpURI(data.totpURI);
            console.log("Checking 3");
        }
    };



    const verifyInitialCode = async () => {
        const {data, error } = await authClient.twoFactor.verifyTotp({
            code,
        });
        if (error) {
            console.error("Status:", error.status);
            console.error("Message:", error.message);
            console.error("Full error:", error);
            alert(`Erro ao ativar 2FA: ${error.message || "Código inválido"}`);
            return; // Para aqui para não recarregar a página com erro
        }
        // Once verified it refreshes the page to update 2FA status
        window.location.reload();
    };
    return (
        <div className="flex flex-col gap-4">
            {!session.user.twoFactorEnabled ? (
                <>
                    <button className="-bg-conic-0" onClick={startEnable2FA}>Activate 2FA</button>
                </>
            ) : (
                <p>2FA is enabled!</p>
            )}

            {step === "qr" && (
                <div>
                    <h3>Scan this QR with Authenticator</h3>
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
                            totpURI,
                        )}`}
                    />


                    <input
                        placeholder="Enter first code from app"
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <button onClick={verifyInitialCode}>Verify</button>
                </div>
            )}
        </div>
    );
}