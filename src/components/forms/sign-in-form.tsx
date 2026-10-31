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
import {useRouter} from "next/navigation";
import {useForm} from "react-hook-form";
import contactSchema from "@/utils/validation/login-contact-schema";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {authClient} from "@/lib/auth-client";
import {Loader2} from "lucide-react";
import React from "react";
import {toast} from "sonner";


export default function SignInForm({
                                     className,
                                     ...props
                                   }: React.ComponentProps<"form">) {
  const [isLoading, setIsLoading] = React.useState(false);

  const router = useRouter();

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  })

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const res = await authClient.signIn.social({
        provider: "google",
        mode: "popup",
        redirectTo: "/dashboard",
      });

      if (res?.error) {
        toast.error(res.error.message || "Sign-in failed");
      } else {
        toast.success("Entrada bem-sucedida! Bem-vindo(a) de volta(o)");
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error("Ocorreu algum erro inesperado. Por favor, tenta novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  async function onSubmit(data: z.infer<typeof contactSchema>) {
    setIsLoading(true);
    const{data: session, error} = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.error(error.message);
    }
    else {
      toast.success("Bem-vindo ao Fortis Libertas!");
      await router.push("/dashboard");
    }
    setIsLoading(false);
  }

  return (
      <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => console.log("Erros do Zod:", errors))}
          className={cn("flex flex-col gap-6", className)}
          {...props}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Entra com a tua conta</h1>
            <p className="text-sm text-balance text-muted-foreground">
              Coloca o email e a password
            </p>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email do utilizador</FieldLabel>
            <Input id="email" type="email" placeholder="Ricardo@..." {...form.register("email")} />
            {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </Field>
          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <a
                  href="#"
                  className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                Esqueceste a password?
              </a>
            </div>
            <Input id="password" type="password" {...form.register("password")} />
            {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
            )}
          </Field>
          <Field>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
              ) : (
                  "Entrar"
              )}
            </Button>
          </Field>
          <FieldSeparator>Ou continua com</FieldSeparator>
          <Field>
            <Button
                variant="outline"
                type="button"
                onClick={signInWithGoogle}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                />
              </svg>
              Entra com a tua conta Google
            </Button>
            <FieldDescription className="text-center">
              Ainda não tens conta?{" "}
              <a href="/sign-up" className="underline underline-offset-4">
                Clica aqui
              </a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
  )
}