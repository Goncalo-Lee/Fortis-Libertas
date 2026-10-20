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
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";



export const VerificationEmail = ({
                                      username = "there",
                                      verificationUrl,
                                  }: VerificationEmailProps) => {


    return (
        <Html>
            <Head />
            <Preview>Verify your email for Fortis Libertas</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans px-2">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            {/* Replace with your actual logo URL */}
                            <Img
                                src={`${baseUrl}/logo.png`}
                                width="40"
                                height="40"
                                alt="Fortis Libertas"
                                className="my-0 mx-auto rounded-full"
                            />
                        </Section>

                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Verify your email
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello {username},
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Welcome to Fortis Libertas! Please verify your email address by clicking the button below so you can securely log in and get started.
                        </Text>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-6 py-3"
                                href={verificationUrl}
                            >
                                Verify Email
                            </Button>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Or copy and paste this URL into your browser:{" "}
                            <Link href={verificationUrl} className="text-blue-600 no-underline break-all">
                                {verificationUrl}
                            </Link>
                        </Text>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            If you didnt create an account with Fortis Libertas, you can safely
                            ignore and delete this message.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default VerificationEmail;