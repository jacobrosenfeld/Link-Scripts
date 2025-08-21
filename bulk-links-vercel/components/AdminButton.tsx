"use client";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "./Field";

export function AdminButton() {
  const router = useRouter();
  const pathname = usePathname();
  
  const isAdminPage = pathname === "/admin";

  function handleClick() {
    if (isAdminPage) {
      router.push("/");
    } else {
      router.push("/admin");
    }
  }

  return (
    <Button
      onClick={handleClick}
      className="!mt-0 !bg-blue-600 hover:!brightness-110 text-sm px-3 py-1"
    >
      {isAdminPage ? "Home" : "Admin Panel"}
    </Button>
  );
}
