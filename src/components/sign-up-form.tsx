import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import React from "react";
import {Loader2} from "lucide-react";
import { contactSchema } from "@/utils/validation/register-contact-schema";
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {useRouter} from "next/navigation";
import {authClient} from "@/lib/auth-client";


export default function SignUpForm({
                                     className,
                                     ...props
                                   }: React.ComponentProps<"form">) {

  const [isLoading, setIsLoading] = React.useState(false);

  const router = useRouter();


  // Initialize form with resolver from zod
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",

    }
  })

  async function onSubmit(data: z.infer<typeof contactSchema>) {
    setIsLoading(true);
    const{ data: session, error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
    })
    if (error) {
      console.log(error);
      setIsLoading(false);
      return;
    }
    await router.push("/components");

  }


  return (
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn("flex flex-col gap-6", className)} {...props}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Regista-te</h1>
            <p className="text-sm text-balance text-muted-foreground">
              Preenche os teus dados para te registares
            </p>
          </div>
          <Field>
            <FieldLabel htmlFor="name">Nome do utilizador</FieldLabel>
            <Input id="name" type="name" placeholder="nomedoutilizador" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </Field>
          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="phone">Número de telemóvel</FieldLabel>
            </div>
            <Input id="phone" type="phone" required />
          </Field>
          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Password</FieldLabel>
            </div>
            <Input id="password" type="password" required />
          </Field>
          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Confirma a password</FieldLabel>
            </div>
            <Input id="password" type="password" required />
          </Field>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
            ) : (
                "Criar conta"
            )}
          </Button>
        </FieldGroup>
      </form>
  )
}




