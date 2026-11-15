import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ResetPasswordEmailProps {
    username: string;
    resetUrl: string;
    userEmail: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const ResetPasswordEmail = ({
                                       username,
                                       resetUrl,
                                       userEmail,
                                   }: ResetPasswordEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Redefina a sua palavra-passe da Fortis Libertas</Preview>
            <Tailwind>
                <Body className="bg-slate-50 my-auto mx-auto font-sans px-4">
                    <Container className="bg-white border border-slate-200 rounded-xl shadow-sm my-[40px] mx-auto p-8 max-w-[480px]">

                        {/* LOGO SECTION */}
                        <Section className="mt-2 mb-6 text-center">
                            <Img
                                src={`${baseUrl}/logo-removebg.png`}
                                width="96"
                                height="96"
                                alt="Fortis Libertas"
                                className="mx-auto"
                            />
                        </Section>

                        {/* HEADER */}
                        <Heading className="text-slate-900 text-[24px] font-bold text-center p-0 mt-0 mb-6 mx-0">
                            Redefina a sua palavra-passe
                        </Heading>

                        {/* BODY TEXT */}
                        <Text className="text-slate-700 text-[15px] leading-[24px] m-0 mb-4">
                            Olá <strong>{username}</strong>,
                        </Text>

                        <Text className="text-slate-700 text-[15px] leading-[24px] m-0 mb-6">
                            Alguém solicitou recentemente a alteração da palavra-passe da sua conta Fortis Libertas associada ao endereço <Link href={`mailto:${userEmail}`} className="text-indigo-600 no-underline font-medium">{userEmail}</Link>.
                            Se foi você, pode definir uma nova palavra-passe aqui:
                        </Text>

                        {/* CALL TO ACTION BUTTON */}
                        <Section className="text-center mt-6 mb-8">
                            <Button
                                className="bg-slate-900 rounded-md text-white text-[14px] font-medium no-underline text-center px-8 py-3.5"
                                href={resetUrl}
                            >
                                Redefinir Palavra-passe
                            </Button>
                        </Section>

                        {/* RAW URL FALLBACK */}
                        <Text className="text-slate-500 text-[14px] leading-[24px] m-0 mb-2">
                            Ou copie e cole este URL no seu navegador:
                        </Text>
                        <Text className="text-slate-500 text-[14px] leading-[24px] m-0 mb-6">
                            <Link href={resetUrl} className="text-indigo-600 no-underline break-all">
                                {resetUrl}
                            </Link>
                        </Text>

                        {/* FOOTER DIVIDER */}
                        <Hr className="border border-solid border-slate-200 my-[24px] mx-0 w-full" />

                        {/* FOOTER TEXT */}
                        <Text className="text-slate-400 text-[12px] leading-[20px] m-0 text-center">
                            Se não solicitou a alteração da palavra-passe, pode ignorar e eliminar esta mensagem. A sua conta permanece segura.
                        </Text>

                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default ResetPasswordEmail;
