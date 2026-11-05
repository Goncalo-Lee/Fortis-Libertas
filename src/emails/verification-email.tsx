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

interface VerifyEmailProps {
    username: string;
    url: string;
    userEmail: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const VerifyEmail = ({
                                username,
                                url,
                                userEmail,
                            }: VerifyEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Verifique o seu endereço de email para a Fortis Libertas</Preview>
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
                                className="mx-auto rounded-lg"
                            />
                        </Section>

                        {/* HEADER */}
                        <Heading className="text-slate-900 text-[24px] font-bold text-center p-0 mt-0 mb-6 mx-0">
                            Verifique o seu endereço de email
                        </Heading>

                        {/* BODY TEXT */}
                        <Text className="text-slate-700 text-[15px] leading-[24px] m-0 mb-4">
                            Olá <strong>{username}</strong>,
                        </Text>

                        <Text className="text-slate-700 text-[15px] leading-[24px] m-0 mb-6">
                            Obrigado por se registar na Fortis Libertas! Por favor, verifique o seu endereço de email (
                            <Link href={`mailto:${userEmail}`} className="text-indigo-600 no-underline font-medium">
                                {userEmail}
                            </Link>
                            ) clicando no botão abaixo para ativar a sua conta:
                        </Text>

                        {/* CALL TO ACTION BUTTON */}
                        <Section className="text-center mt-6 mb-8">
                            <Button
                                className="bg-slate-900 rounded-md text-white text-[14px] font-medium no-underline text-center px-8 py-3.5"
                                href={url}
                            >
                                Verificar Endereço de Email
                            </Button>
                        </Section>

                        {/* RAW URL FALLBACK */}
                        <Text className="text-slate-500 text-[14px] leading-[24px] m-0 mb-2">
                            Ou copie e cole este URL no seu navegador:
                        </Text>
                        <Text className="text-slate-500 text-[14px] leading-[24px] m-0 mb-6">
                            <Link href={url} className="text-indigo-600 no-underline break-all">
                                {url}
                            </Link>
                        </Text>

                        {/* FOOTER DIVIDER */}
                        <Hr className="border border-solid border-slate-200 my-[24px] mx-0 w-full" />

                        {/* FOOTER TEXT */}
                        <Text className="text-slate-400 text-[12px] leading-[20px] m-0 text-center">
                            Se não criou uma conta, pode ignorar e eliminar este email em segurança.
                        </Text>

                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default VerifyEmail;
