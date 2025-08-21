"use client";
import { useRouter } from "next/navigation";
import { Button } from "./Field";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <Button
      onClick={handleLogout}
      className="!mt-0 !bg-red-600 hover:!brightness-110 text-sm px-3 py-1"
    >
      Logout
    </Button>
  );
}
