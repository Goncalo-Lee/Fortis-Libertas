"use client";

import { cn } from "@/lib/utils" // Assuming standard shadcn utils path, adjust if needed
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    Field,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import contactSchema from "@/utils/validation/password-contact-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation"; // Added useRouter here

export function ResetPasswordForm({
                                      className,
                                      ...props
                                  }: React.ComponentProps<"div">) {
    const searchParams = useSearchParams();
    const router = useRouter(); // Initialized the router hook here

    const token = searchParams.get("token") as string;
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<z.infer<typeof contactSchema>>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        }
    })

    const handleSubmit = async (data: z.infer<typeof contactSchema>) => {
        setIsLoading(true);
        const { error } = await authClient.resetPassword({
            newPassword: data.password,
            token,
        })

        if (error) {
            toast.error(error.message);
        }
        else {
            toast.success("Password modified successfully. You can now log in with your new password.");
            router.push("/sign-in"); // router is now defined
        }
        setIsLoading(false);
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardContent>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit, (errors) => console.log("Erros do Zod:", errors))}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="password">Nova password</FieldLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="yournewpassword"
                                    required
                                    {...form.register("password")}
                                />
                                {form.formState.errors.password && (
                                    <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                                )}
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="confirmPassword">Confirma a nova password</FieldLabel>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder=""
                                    required
                                    {...form.register("confirmPassword")}
                                />
                                {/* Fixed this to check for confirmPassword errors instead of password */}
                                {form.formState.errors.confirmPassword && (
                                    <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
                                )}
                            </Field>
                            <Field>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        "Enviar"
                                    )}
                                </Button>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}