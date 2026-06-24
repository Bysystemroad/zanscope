import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
      <section className="flex flex-col justify-center">
        <p className="text-sm font-semibold uppercase text-white">Secure workspace access</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal">Login to ZanScope</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Supabase Auth powers email and password access. Until your Supabase project is connected, this page remains in
          demo mode so the product flow can still be reviewed.
        </p>
      </section>
      <AuthForm />
    </main>
  );
}

