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


interface VerificationEmailProps {
    username: string;
    verificationUrl: string;
    userEmail: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";



export const VerificationEmail = ({
                                      username = "utilizador",
                                      verificationUrl,
                                  }: VerificationEmailProps) => {


    return (
        <Html>
            <Head />
            <Preview>Verifique o seu email para a Fortis Libertas</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans px-2">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <Img
                                src={`${baseUrl}/logo.png`}
                                width="40"
                                height="40"
                                alt="Fortis Libertas"
                                className="my-0 mx-auto rounded-full"
                            />
                        </Section>

                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Verifique o seu email
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Olá {username},
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Bem-vindo à Fortis Libertas! Por favor, verifique o seu endereço de email clicando no botão abaixo para poder iniciar sessão em segurança e começar.
                        </Text>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-6 py-3"
                                href={verificationUrl}
                                style={{ backgroundColor: '#000000', color: '#ffffff', padding: '12px 24px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }}
                            >
                                Verificar Email
                            </Button>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Ou copie e cole este URL no seu navegador:{" "}
                            <Link href={verificationUrl} className="text-blue-600 no-underline break-all">
                                {verificationUrl}
                            </Link>
                        </Text>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            Se não criou uma conta na Fortis Libertas, pode ignorar
                            e eliminar esta mensagem com segurança.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default VerificationEmail;