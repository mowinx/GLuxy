import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Btn, ErrorNote, Field, Wordmark, inputClass } from "@/components/luxy/bits";
import { landing } from "@/lib/luxy/pricing";
import { useLuxy } from "@/lib/luxy/store";

const DEMOS = [
  ["Adaeze · customer", "ada@luxy.demo"],
  ["Chidi · owner", "chidi@luxy.demo"],
  ["Tunde · driver", "tunde@luxy.demo"],
  ["Victor · admin", "victor@luxy.demo"],
] as const;

export function LoginPage() {
  const raw = useRouterState({ select: (s) => s.location.search as Record<string, unknown> | string });
  const next = raw && typeof raw === "object" && typeof raw.next === "string" ? raw.next : undefined;
  const signIn = useLuxy((s) => s.signIn);
  const reset = useLuxy((s) => s.resetDemo);
  const navigate = useNavigate();
  const [err, setErr] = useState("");

  function go(email: string, password: string) {
    const error = signIn(email, password);
    if (error) {
      setErr(error);
      return;
    }
    const user = useLuxy.getState().users.find((u) => u.email === email);
    if (next && next.startsWith("/")) navigate({ href: next });
    else if (user) navigate({ href: landing(user.role) });
  }

  return (
    <AuthFrame>
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-body">Demo password for every seeded account is luxy2026.</p>
      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          go(String(fd.get("email")), String(fd.get("password")));
        }}
      >
        <Field label="Email"><input name="email" type="email" required className={inputClass} /></Field>
        <Field label="Password"><input name="password" type="password" required className={inputClass} /></Field>
        <ErrorNote>{err}</ErrorNote>
        <Btn type="submit" className="w-full">Sign in</Btn>
      </form>
      <div className="mt-6 space-y-2">
        {DEMOS.map(([label, email]) => (
          <button key={email} className="flex min-h-11 w-full items-center rounded-lg border border-line px-3 text-left text-sm" onClick={() => go(email, "luxy2026")}>
            {label}
          </button>
        ))}
      </div>
      <button className="mt-4 text-xs text-muted" onClick={() => { reset(); setErr("Demo data restored. Sign in again."); }}>
        Reset demo data
      </button>
      <p className="mt-4 text-sm">
        New here? <Link to="/signup" className="text-accent">Create an account</Link>
      </p>
    </AuthFrame>
  );
}

export function SignupPage() {
  const raw = useRouterState({ select: (s) => s.location.search as Record<string, unknown> | string });
  const role = raw && typeof raw === "object" && typeof raw.role === "string" ? raw.role : undefined;
  const signUp = useLuxy((s) => s.signUp);
  const navigate = useNavigate();
  const [want, setWant] = useState(role === "owner" ? "owner" : "customer");
  const [ownerType, setOwnerType] = useState<"individual" | "company">("individual");
  const [err, setErr] = useState("");
  return (
    <AuthFrame>
      <h1 className="text-2xl font-semibold">Create account</h1>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" className={`min-h-11 rounded-lg border text-sm ${want === "customer" ? "border-accent bg-tint" : "border-line"}`} onClick={() => setWant("customer")}>I want to rent</button>
        <button type="button" className={`min-h-11 rounded-lg border text-sm ${want === "owner" ? "border-accent bg-tint" : "border-line"}`} onClick={() => setWant("owner")}>I want to list</button>
      </div>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const error = signUp({
            role: want as "customer" | "owner",
            full_name: String(fd.get("name")),
            phone: String(fd.get("phone")),
            email: String(fd.get("email")),
            password: String(fd.get("password")),
            owner_type: want === "owner" ? ownerType : undefined,
          });
          if (error) setErr(error);
          else navigate({ href: want === "owner" ? "/owner" : "/customer" });
        }}
      >
        <Field label="Full name"><input name="name" required className={inputClass} /></Field>
        <Field label="Phone"><input name="phone" required className={inputClass} placeholder="+234…" /></Field>
        <Field label="Email"><input name="email" type="email" required className={inputClass} /></Field>
        <Field label="Password"><input name="password" type="password" minLength={8} required className={inputClass} /></Field>
        {want === "owner" ? (
          <Field label="Owner type">
            <select className={inputClass} value={ownerType} onChange={(e) => setOwnerType(e.target.value as "individual" | "company")}>
              <option value="individual">Individual · up to 3 cars</option>
              <option value="company">Company · up to 25 cars</option>
            </select>
          </Field>
        ) : null}
        <ErrorNote>{err}</ErrorNote>
        <Btn type="submit" className="w-full">Create account</Btn>
      </form>
      <p className="mt-4 text-sm text-muted">Email confirmation is skipped in this preview so you can use the account immediately.</p>
    </AuthFrame>
  );
}

export function InvitePage({ inviteId }: { inviteId: string }) {
  const invite = useLuxy((s) => s.invites.find((i) => i.id === inviteId));
  const accept = useLuxy((s) => s.acceptInvite);
  const navigate = useNavigate();
  const [err, setErr] = useState("");
  if (!invite) return <AuthFrame><p>This invite link is not valid.</p></AuthFrame>;
  return (
    <AuthFrame>
      <h1 className="text-2xl font-semibold">Driver invite</h1>
      <p className="mt-2 text-sm text-body">{invite.full_name} · {invite.phone}</p>
      <p className="mt-1 text-xs text-muted">Name and phone are locked to the invite. You can be assigned to a car only after the owner and Luxy both approve you.</p>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const error = accept(inviteId, String(fd.get("email")), String(fd.get("password")));
          if (error) setErr(error);
          else navigate({ href: "/driver" });
        }}
      >
        <Field label="Name"><input className={inputClass} value={invite.full_name} readOnly /></Field>
        <Field label="Phone"><input className={inputClass} value={invite.phone} readOnly /></Field>
        <Field label="Email"><input name="email" type="email" required className={inputClass} /></Field>
        <Field label="Password"><input name="password" type="password" minLength={8} required className={inputClass} /></Field>
        <ErrorNote>{err}</ErrorNote>
        <Btn type="submit" className="w-full">Join as driver</Btn>
      </form>
    </AuthFrame>
  );
}

function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto max-w-md px-4 py-12">
        <Wordmark />
        <div className="mt-8 rounded-xl border border-line bg-card p-6">{children}</div>
      </div>
    </div>
  );
}
