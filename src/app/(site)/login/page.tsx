import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl = "/account" } = await searchParams;
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to track orders and support tickets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm callbackUrl={callbackUrl} />
          <p className="text-center text-sm text-muted-foreground">
            New to LazerLayer?{" "}
            <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-primary underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
