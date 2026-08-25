"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import Header from "@/components/Header";
import { iniciarSesion } from "@/lib/auth";
import { db } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const user = await iniciarSesion(email, password);
      const snap = await getDoc(doc(db, "usuarios", user.uid));
      const rol = snap.exists() ? snap.data().rol : null;
      router.push(rol === "vendedor" ? "/vendedor" : "/");
    } catch {
      setError("Email o contraseña incorrectos.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />
      <section className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-3xl font-semibold mb-8">
          Iniciar sesión
        </h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium block mb-1">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium block mb-1">
              Contraseña
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
            />
          </label>

          {error && <p className="text-clay text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-ink text-paper font-semibold py-3 rounded-stamp hover:bg-ink-light transition-colors disabled:opacity-60"
          >
            {cargando ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p className="text-center text-sm text-charcoal/60 mt-6">
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="text-ink font-medium underline">
            Registrate
          </Link>
        </p>
      </section>
    </main>
  );
}
