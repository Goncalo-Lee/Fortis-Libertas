import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {authClient} from "@/lib/auth-client";
import {useForm} from "react-hook-form";
import contactSchema from "@/utils/validation/password-contact-schema";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Loader2} from "lucide-react";
import React from "react";
import {toast} from "sonner";
import {useSearchParams} from "next/navigation";
import {router} from "next/client";


export function ResetPasswordForm({
                                      className,
                                      ...props
                                  }: React.ComponentProps<"div">) {
    const searchParams = useSearchParams();
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
        const{ error } = await authClient.resetPassword({
            newPassword: data.password,
            token,
        })

        if (error) {
            toast.error(error.message);
        }
        else {
            toast.success("Password modified successfully. You can now log in with your new password.");
            await router.push("/sign-in");
        }
        setIsLoading(false);
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Welcome back</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                    onSubmit={form.handleSubmit(handleSubmit, (errors) => console.log("Erros do Zod:", errors))}>
                        <FieldGroup>
                            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                                Or continue with
                            </FieldSeparator>
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
                                )
                                }
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="confirmPassword">Cofrmia a nova password</FieldLabel>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder=""
                                    required
                                    {...form.register("confirmPassword")}
                                />
                                {form.formState.errors.password && (
                                    <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                                )
                                }
                            </Field>
                            <Field>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        "Enviar"
                                    )}
                                </Button>
                                <FieldDescription className="text-center">
                                    Don&apos;t have an account? <a href="#">Sign up</a>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

