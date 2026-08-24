"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import {
  registrarVendedor,
  formatearCUIT,
  validarFormatoCUIT,
  type CondicionIVA,
  type ZonaAMBA,
} from "@/lib/auth";

const opcionesIVA: { value: CondicionIVA; label: string }[] = [
  { value: "responsable_inscripto", label: "Responsable Inscripto" },
  { value: "monotributista", label: "Monotributista" },
  { value: "exento", label: "Exento" },
  { value: "consumidor_final", label: "Consumidor Final" },
];

export default function RegistroVendedorPage() {
  const router = useRouter();
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [cuit, setCuit] = useState("");
  const [condicionIVA, setCondicionIVA] =
    useState<CondicionIVA>("monotributista");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [aceptaDeclaracion, setAceptaDeclaracion] = useState(false);
  const [ofreceRetiro, setOfreceRetiro] = useState(false);
  const [calleRetiro, setCalleRetiro] = useState("");
  const [numeroRetiro, setNumeroRetiro] = useState("");
  const [barrioRetiro, setBarrioRetiro] = useState("");
  const [zonaRetiro, setZonaRetiro] = useState<ZonaAMBA>("CABA");
  const [codigoPostalRetiro, setCodigoPostalRetiro] = useState("");
  const [costoEnvioAMBA, setCostoEnvioAMBA] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (!validarFormatoCUIT(cuit)) {
      setError("El CUIT debe tener 11 dígitos (ej: 30-71549254-3).");
      return;
    }
    if (!aceptaDeclaracion) {
      setError("Tenés que aceptar la declaración de condición de productos.");
      return;
    }
    if (
      ofreceRetiro &&
      (!calleRetiro.trim() ||
        !numeroRetiro.trim() ||
        !barrioRetiro.trim() ||
        !codigoPostalRetiro.trim())
    ) {
      setError("Completá la dirección de retiro.");
      return;
    }
    const costoEnvioNum = Number(costoEnvioAMBA);
    if (costoEnvioAMBA === "" || isNaN(costoEnvioNum) || costoEnvioNum < 0) {
      setError(
        "Ingresá el costo de envío a AMBA (podés poner 0 si es gratis)."
      );
      return;
    }

    setCargando(true);
    try {
      await registrarVendedor({
        nombreEmpresa,
        razonSocial,
        cuit,
        condicionIVA,
        email,
        password,
        documentoFacturacion: archivo,
        aceptaDeclaracionCondicion: aceptaDeclaracion,
        ofreceRetiro,
        direccionRetiro: ofreceRetiro
          ? {
              calle: calleRetiro,
              numero: numeroRetiro,
              barrio: barrioRetiro,
              zona: zonaRetiro,
              codigoPostal: codigoPostalRetiro,
            }
          : null,
        costoEnvioAMBA: costoEnvioNum,
      });
      router.push("/vendedor");
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
          Cuenta de vendedor
        </h1>
        <p className="text-sm text-charcoal/60 mb-8">
          PAHÓ es un outlet de devoluciones y liquidaciones: solo se
          publican productos con descuento real y condición declarada.
          Necesitamos tus datos fiscales para poder facturar tus ventas.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Campo
            label="Nombre de tu empresa o marca"
            value={nombreEmpresa}
            onChange={setNombreEmpresa}
            type="text"
            required
            hint="Es el nombre que van a ver los compradores"
          />
          <Campo
            label="Razón social"
            value={razonSocial}
            onChange={setRazonSocial}
            type="text"
            required
          />
          <Campo
            label="CUIT"
            value={cuit}
            onChange={(v) => setCuit(formatearCUIT(v))}
            type="text"
            required
            hint="Formato: 30-71549254-3"
          />

          <label className="block">
            <span className="text-sm font-medium block mb-1">
              Condición frente al IVA
            </span>
            <select
              value={condicionIVA}
              onChange={(e) =>
                setCondicionIVA(e.target.value as CondicionIVA)
              }
              className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
            >
              {opcionesIVA.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

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

          <label className="block">
            <span className="text-sm font-medium block mb-1">
              Constancia de inscripción AFIP (opcional por ahora)
            </span>
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="w-full text-sm border border-line rounded-stamp px-3 py-2 bg-white file:mr-3 file:py-1 file:px-3 file:rounded-stamp file:border-0 file:bg-ink file:text-paper file:text-xs"
            />
            <span className="text-xs text-charcoal/50 mt-1 block">
              PDF, JPG o PNG. Nuestro equipo lo valida antes de habilitar tus
              publicaciones.
            </span>
          </label>

          <div className="ficha bg-white border border-amber-dark/40 p-4">
            <span className="text-sm font-medium block mb-2">
              Envío a domicilio (AMBA)
            </span>
            <p className="text-xs text-charcoal/60 mb-3">
              Todo lo que publiques en PAHÓ ofrece envío a domicilio dentro
              de CABA y GBA — es obligatorio, no se puede desactivar por
              producto. Definí acá tu tarifa fija: se cobra{" "}
              <strong>una sola vez por pedido</strong>, sin importar
              cuántos productos o unidades compre alguien.
            </p>
            <Campo
              label="Costo de envío"
              value={costoEnvioAMBA}
              onChange={setCostoEnvioAMBA}
              type="number"
              required
              hint="Poné 0 si querés ofrecer envío gratis"
            />
          </div>

          <div className="ficha bg-white border border-line p-4">
            <label className="flex items-center gap-2.5 text-sm font-medium">
              <input
                type="checkbox"
                checked={ofreceRetiro}
                onChange={(e) => setOfreceRetiro(e.target.checked)}
                className="accent-ink"
              />
              Voy a ofrecer retiro en un local
            </label>
            <p className="text-xs text-charcoal/50 mt-1">
              Esto sí es opcional — además del envío obligatorio de arriba.
            </p>

            {ofreceRetiro && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-charcoal/50 bg-amber/10 border border-amber-dark/20 rounded-stamp px-3 py-2">
                  Esta dirección es privada — solo la ve un comprador
                  puntual después de iniciar el pago de un pedido tuyo. En
                  tus publicaciones, los compradores solo van a ver el
                  barrio (ej: &quot;Retiro en Belgrano, CABA&quot;), nunca la
                  calle ni el número.
                </p>
                <div className="grid grid-cols-[1fr_100px] gap-3">
                  <Campo
                    label="Calle"
                    value={calleRetiro}
                    onChange={setCalleRetiro}
                    type="text"
                  />
                  <Campo
                    label="Número"
                    value={numeroRetiro}
                    onChange={setNumeroRetiro}
                    type="text"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Campo
                    label="Barrio"
                    value={barrioRetiro}
                    onChange={setBarrioRetiro}
                    type="text"
                    hint="Esto sí es público"
                  />
                  <label className="block">
                    <span className="text-sm font-medium block mb-1">
                      Zona
                    </span>
                    <select
                      value={zonaRetiro}
                      onChange={(e) =>
                        setZonaRetiro(e.target.value as ZonaAMBA)
                      }
                      className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
                    >
                      <option value="CABA">CABA</option>
                      <option value="GBA">GBA (provincia de Buenos Aires)</option>
                    </select>
                  </label>
                </div>
                <Campo
                  label="Código postal"
                  value={codigoPostalRetiro}
                  onChange={setCodigoPostalRetiro}
                  type="text"
                />
              </div>
            )}
          </div>

          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={aceptaDeclaracion}
              onChange={(e) => setAceptaDeclaracion(e.target.checked)}
              required
              className="mt-0.5 accent-ink"
            />
            <span className="text-charcoal/70">
              Declaro que voy a describir fielmente la condición real de
              cada producto que publique (devolución sin uso,
              reacondicionado, con detalle estético o caja abierta),
              conforme a la Ley de Defensa del Consumidor.
            </span>
          </label>

          {error && <p className="text-clay text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-amber text-ink font-semibold py-3 rounded-stamp hover:bg-amber-dark transition-colors disabled:opacity-60"
          >
            {cargando ? "Creando cuenta…" : "Crear cuenta de vendedor"}
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
  if (err instanceof Error) return err.message;
  return "No pudimos crear la cuenta. Intentá de nuevo.";
}
