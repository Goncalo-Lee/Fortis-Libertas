import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function AccountSettingsPage() {
    return (
        <div className="flex-1 w-full space-y-4 p-8 pt-6 font-poppins">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Conta do utilizador</h2>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Perfil</CardTitle>
                    <CardDescription>
                        Altera as tuas informações pessoais
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <Input defaultValue="John Doe" id="name"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input defaultValue="john@example.com" id="email" type="email"/>
                    </div>
                </CardContent>

                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="birthdate">Data de nascimento</Label>
                        <Input defaultValue="2002-09-11" id="birthdate" type="date"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input defaultValue="66666666" id="phone"/>
                    </div>
                    <Button>Editar</Button>
                    <Button>Alterar password</Button>
                    <Button>2FA</Button>
                    <Button variant="destructive">Apagar conta</Button>
                </CardContent>
            </Card>
        </div>
    )
}