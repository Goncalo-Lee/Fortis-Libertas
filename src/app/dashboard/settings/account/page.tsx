import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Link from "next/link";
import DashboardSwitcher from "@/components/layout/DashboardSwitcher";

export default async function AccountSettingsPage() {
    return (
        // Container principal que centraliza todo o bloco
        <div className="flex-1 w-full p-6 md:p-10 font-poppins flex justify-center">
            {/* Wrapper limitador de largura (max-w-3xl) */}
            <div className="w-full max-w-3xl space-y-8">

                {/* Cabeçalho da Página */}
                <div className="flex flex-col space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Conta do utilizador</h2>
                    <p className="text-muted-foreground text-sm">
                        Gere as definições da tua conta e as preferências de segurança.
                    </p>
                </div>



                <div className="grid gap-8">
                    {/* 1. Cartão de Informações Pessoais */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Perfil</CardTitle>
                            <CardDescription>
                                Altera as tuas informações pessoais
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome completo</Label>
                                    <Input defaultValue="John Doe" id="name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input defaultValue="john@example.com" id="email" type="email" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="birthdate">Data de nascimento</Label>
                                    <Input defaultValue="2002-09-11" id="birthdate" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input defaultValue="66666666" id="phone" />
                                </div>
                            </div>

                            {/* Rodapé do cartão com linha separadora */}
                            <div className="flex justify-end border-t pt-6 mt-6">
                                <Button>Guardar alterações</Button>
                            </div>
                        </CardContent>
                    </Card>


                    {/* 2. Cartão de Segurança */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Segurança</CardTitle>
                            <CardDescription>
                                Gere a tua password e autenticação de dois passos (2FA)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href={"/dashboard/settings/account/reset-password"}>
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        Alterar password
                                    </Button>
                                </Link>
                                <Link href={"/dashboard/settings/account/two-factor"}>
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        Ativar 2FA
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Cartão de Ações Destrutivas */}
                    <Card className="border-destructive/20 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                            <CardDescription>
                                Ações irreversíveis associadas à tua conta. Procede com cuidado.
                            </CardDescription>
                        </CardHeader>
                        {/* Layout flexível para alinhar o texto e o botão lado a lado em desktop */}
                        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-destructive/10 pt-6">
                            <p className="text-sm text-muted-foreground font-medium">
                                A tua conta será apagada permanentemente.
                            </p>
                            <Button variant="destructive" className="w-full sm:w-auto shrink-0">
                                Apagar conta
                            </Button>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}