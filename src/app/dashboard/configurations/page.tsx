import DashboardSwitcher from "@/components/layout/DashboardSwitcher";

export default function ConfigurationsPage() {
    return (
        <div className="font-poppins min-h-screen bg-gray-50 dark:bg-gray-900 p-6 sm:p-10">
            <div className="mx-auto max-w-4xl space-y-8">

                {/* Cabeçalho da Página */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Configurações
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Gira as preferências da sua conta e o contexto de trabalho.
                    </p>
                </div>

                {/* Secção de Contexto / Dashboard */}
                <section className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
                    <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-5">
                        <h2 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                            Contexto de Trabalho
                        </h2>
                    </div>
                    <div className="px-6 py-6">
                        {/* Componente inserido aqui */}
                        <DashboardSwitcher />
                    </div>
                </section>



            </div>
        </div>
    );
}