import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (credentials) => {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // Fields returned here are what NextAuth puts on the user object
        return { id: user.id, name: user.name, username: user.username, role: user.role };
      },
    }),
  ],
  callbacks: {
    // Carry id + role from the user into the JWT, then into the session,
    // so the proxy/middleware and pages can do role-based access control.
    jwt: ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.sub as string;
      session.user.role = token.role as "admin" | "petugas_kandang";
      session.user.username = token.username as string;
      return session;
    },
  },
});
