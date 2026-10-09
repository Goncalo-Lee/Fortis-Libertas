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

export default function SignUpForm({
                                     className,
                                     ...props
                                   }: React.ComponentProps<"form">) {
  return (
      <form className={cn("flex flex-col gap-6", className)} {...props}>
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
          <Field>
            <Button type="submit">Criar</Button>
          </Field>
        </FieldGroup>
      </form>
  )
}




