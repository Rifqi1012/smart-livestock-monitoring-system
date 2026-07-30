import { DefaultSession } from "next-auth";

type Role = "admin" | "petugas_kandang";

declare module "next-auth" {
  interface User {
    role: Role;
    username: string;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
      username: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    username: string;
  }
}
