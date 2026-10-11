"use client"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
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


  console.log("Fodasse");
  // Initialize form with resolver from zod
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    }
  })

  async function onSubmit(data: z.infer<typeof contactSchema>) {
    console.log("Estou aqui!")
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
      <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => console.log("Erros do Zod:", errors))}
          className={cn("flex flex-col gap-6", className)}
          {...props}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Regista-te</h1>
            <p className="text-sm text-balance text-muted-foreground">
              Preenche os teus dados para te registares
            </p>
          </div>
          <Field>
            <FieldLabel htmlFor="name">Nome do utilizador</FieldLabel>
            <Input id="name" type="text" placeholder="nomedoutilizador" {...form.register("name")} />
            {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" placeholder="m@example.com" {...form.register("email")}/>
            {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </Field>
          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Password</FieldLabel>
            </div>
            <Input id="password" type="password" {...form.register("password")}/>
            {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
            )}
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




