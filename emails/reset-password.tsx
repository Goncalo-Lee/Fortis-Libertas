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
            <Preview>Reset your password for Fortis Libertas</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans px-2">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            {/* Replace with your actual logo URL */}
                            <Img
                                src={`${baseUrl}/logo.png`}
                                width="40"
                                height="40"
                                alt="Acme Corp"
                                className="my-0 mx-auto rounded-full"
                            />
                        </Section>

                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Reset your password
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello {username}
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Someone recently requested a password change for your Fortis Libertas account
                            associated with this {userEmail} address.
                            If this was you, you can set a new password here:
                        </Text>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-6 py-3"
                                href={resetUrl}
                            >
                                Reset Password
                            </Button>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Or copy and paste this URL into your browser:{" "}
                            <Link href={resetUrl} className="text-blue-600 no-underline break-all">
                                {resetUrl}
                            </Link>
                        </Text>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            If you dont want to change your password or didnt request this, just
                            ignore and delete this message. Your account remains secure.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default ResetPasswordEmail;