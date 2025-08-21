"use client";
import { useRouter } from "next/navigation";
import { Button } from "./Field";

export function AdminButton() {
  const router = useRouter();

  function handleAdmin() {
    router.push("/admin");
  }

  return (
    <Button
      onClick={handleAdmin}
      className="!mt-0 !bg-blue-600 hover:!brightness-110 text-sm px-3 py-1"
    >
      Admin Panel
    </Button>
  );
}
