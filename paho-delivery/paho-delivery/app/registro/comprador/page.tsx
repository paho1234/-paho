"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import {
  registrarComprador,
  validarDocumento,
  type TipoDocumento,
} from "@/lib/auth";

export default function RegistroCompradorPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("DNI");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (!validarDocumento(tipoDocumento, numeroDocumento)) {
      setError(
        tipoDocumento === "DNI"
          ? "El DNI debe tener 7 u 8 dígitos."
          : "El CUIT debe tener 11 dígitos."
      );
      return;
    }

    setCargando(true);
    try {
      await registrarComprador({
        nombre,
        email,
        password,
        tipoDocumento,
        numeroDocumento,
      });
      router.push("/");
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />
      <section className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-3xl font-semibold mb-1">
          Cuenta de comprador
        </h1>
        <p className="text-sm text-charcoal/60 mb-8">
          Solo necesitamos lo básico para que puedas comprar.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Campo
            label="Nombre y apellido"
            value={nombre}
            onChange={setNombre}
            type="text"
            required
          />
          <Campo
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            required
          />
          <Campo
            label="Contraseña"
            value={password}
            onChange={setPassword}
            type="password"
            required
            hint="Mínimo 6 caracteres"
          />

          <div className="grid grid-cols-[110px_1fr] gap-3">
            <label className="block">
              <span className="text-sm font-medium block mb-1">
                Documento
              </span>
              <select
                value={tipoDocumento}
                onChange={(e) =>
                  setTipoDocumento(e.target.value as TipoDocumento)
                }
                className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
              >
                <option value="DNI">DNI</option>
                <option value="CUIT">CUIT</option>
              </select>
            </label>
            <Campo
              label="Número"
              value={numeroDocumento}
              onChange={setNumeroDocumento}
              type="text"
              required
            />
          </div>
          <p className="text-xs text-charcoal/50 -mt-2">
            Se lo mostramos al vendedor únicamente para emitir tu factura.
            El resto de tus datos (email, historial de compras) se mantiene
            privado.
          </p>

          {error && <p className="text-clay text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-ink text-paper font-semibold py-3 rounded-stamp hover:bg-ink-light transition-colors disabled:opacity-60"
          >
            {cargando ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <p className="text-center text-sm text-charcoal/60 mt-6">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-ink font-medium underline">
            Iniciá sesión
          </Link>
        </p>
      </section>
    </main>
  );
}

function Campo({
  label,
  value,
  onChange,
  type,
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium block mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
      />
      {hint && (
        <span className="text-xs text-charcoal/50 mt-1 block">{hint}</span>
      )}
    </label>
  );
}

function mensajeError(err: unknown): string {
  const codigo = (err as { code?: string })?.code;
  if (codigo === "auth/email-already-in-use")
    return "Ya existe una cuenta con ese email.";
  if (codigo === "auth/invalid-email") return "El email no es válido.";
  if (codigo === "auth/weak-password")
    return "La contraseña es demasiado débil.";
  return "No pudimos crear la cuenta. Intentá de nuevo.";
}
