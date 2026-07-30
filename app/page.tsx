import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Root: send fresh visitors to login, logged-in users to their dashboard.
export default async function Home() {
  const session = await auth();
  redirect(session?.user ? "/dashboard" : "/login");
}
