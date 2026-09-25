"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { enviarResetPassword } from "@/lib/auth";

export default function OlvidePasswordPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await enviarResetPassword(email);
    } catch {
      // Por seguridad no distinguimos "el email no existe" de un error
      // real — igual mostramos el mensaje de éxito abajo, así nadie
      // puede usar este formulario para averiguar qué emails están
      // registrados en el sitio.
    } finally {
      setEnviando(false);
      setEnviado(true);
    }
  }

  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />
      <section className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-3xl font-semibold mb-2">
          Recuperar contraseña
        </h1>
        <p className="text-sm text-charcoal/60 mb-8">
          Te mandamos un mail con un link para elegir una contraseña nueva.
        </p>

        {enviado ? (
          <div className="ficha bg-white border border-line p-5 text-sm">
            <p>
              Si <strong>{email}</strong> está registrado en Todo Regalado, te va a
              llegar un mail en los próximos minutos. Revisá también la
              carpeta de spam.
            </p>
            <Link
              href="/login"
              className="inline-block mt-4 text-ink font-medium underline"
            >
              ← Volver a iniciar sesión
            </Link>
          </div>
        ) : (
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

            {error && (
              <p className="text-clay text-sm font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-ink text-paper font-semibold py-3 rounded-stamp hover:bg-ink-light transition-colors disabled:opacity-60"
            >
              {enviando ? "Enviando…" : "Enviar mail de recuperación"}
            </button>

            <Link
              href="/login"
              className="block text-center text-sm text-ink underline"
            >
              ← Volver a iniciar sesión
            </Link>
          </form>
        )}
      </section>
    </main>
  );
}
