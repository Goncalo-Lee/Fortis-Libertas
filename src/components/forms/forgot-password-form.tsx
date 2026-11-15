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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import contactSchema from "@/utils/validation/mail-contact-schema";
import {authClient} from "@/lib/auth-client";
import {toast} from "sonner";
import {Loader2} from "lucide-react";
import React, {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";

export function ForgotPasswordForm({
                                     className,
                                     ...props
                                   }: React.ComponentProps<"div">) {

  const [isLoading, setIsLoading] = useState(false);



  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: "",
    }
  })


  async function onSubmit(values: z.infer<typeof contactSchema>) {
    setIsLoading(true);
    try {
      const {error} = await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        throw new Error(error.message)
      }
      toast.success("Email de reposição enviado! Verifica a tua caixa de correio.")
    } catch (err: any) {
      toast.error(err.message || "Erro ao solicitar a reposição de palavra-passe.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-xl">Recuperar palavra-passe</CardTitle>
            <CardDescription>
              Insira o seu email associado à conta e enviaremos um link seguro para redefinir o seu acesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
                onSubmit={form.handleSubmit(onSubmit, (errors) => console.log("Erros do Zod:", errors))}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="m@exemplo.com"
                      required
                  />
                  {form.formState.errors.email && (
                      <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                  )}
                </Field>
                <Field className="pt-2">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        "Enviar link de recuperação"
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