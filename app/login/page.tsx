import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(82,157,202,0.18),transparent_32%),radial-gradient(circle_at_78%_15%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(135deg,#080f14_0%,#101820_48%,#05080c_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25" />

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8">
        <section className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit items-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#dce8f2] shadow-[0_0_30px_rgba(116,180,220,0.12)]">
            Secure workspace access
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-normal text-white sm:text-5xl">
            Welcome back to ZanScope
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#a7b0bb]">
            Sign in to access your lead database, saved searches, lead lists, exports, and credits.
          </p>
          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
            {["Lead database", "Saved searches", "Clean exports"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur"
              >
                <p className="text-sm font-medium text-white">{item}</p>
              </div>
            ))}
          </div>
        </section>
        <AuthForm />
      </div>
    </main>
  );
}
