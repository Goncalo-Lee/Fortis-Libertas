import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
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
import contactSchema from "@/utils/validation/mail-contact-schema";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Loader2} from "lucide-react";
import React from "react";
import {toast} from "sonner";


export function RequestResetPasswordForm({
                                      className,
                                      ...props
                                  }: React.ComponentProps<"div">) {
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<z.infer<typeof contactSchema>>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            email: "",
        }
    })

    const handleSubmit = async (data: z.infer<typeof contactSchema>) => {

        setIsLoading(true);
        const{ error } = await authClient.requestPasswordReset({
            email: data.email,
            redirectTo: "http://localhost:3000/reset-password",
        })
        if (error) {
            toast.error(error.message);
        }
        else {
            toast.success("Password reset email sent. Please check your inbox.");
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
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    {...form.register("email")}
                                />
                                {form.formState.errors.email && (
                                    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
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
            <FieldDescription className="px-6 text-center">
                By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                and <a href="#">Privacy Policy</a>.
            </FieldDescription>
        </div>
    )
}

