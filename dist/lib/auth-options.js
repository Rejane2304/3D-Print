import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password)
                    return null;
                try {
                    const user = await prisma.user.findUnique({ where: { email: credentials.email } });
                    if (!user?.password)
                        return null;
                    const valid = await bcrypt.compare(credentials.password, user.password);
                    if (!valid)
                        return null;
                    return { id: user.id, email: user.email, name: user.name, role: user.role };
                }
                catch {
                    return null;
                }
            },
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user?.role ?? "user";
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.id = token?.id;
                session.user.role = token?.role;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
