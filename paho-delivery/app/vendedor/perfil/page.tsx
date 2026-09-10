"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthProvider";
import {
  getPerfilVendedor,
  actualizarPerfilVendedor,
  type ZonaAMBA,
} from "@/lib/auth";
import { Save } from "lucide-react";

export default function PerfilVendedorPage() {
  const { user, rol, cargando } = useAuth();
  const router = useRouter();

  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [cuit, setCuit] = useState("");
  const [email, setEmail] = useState("");
  const [ofreceRetiro, setOfreceRetiro] = useState(true);
  const [calleRetiro, setCalleRetiro] = useState("");
  const [numeroRetiro, setNumeroRetiro] = useState("");
  const [barrioRetiro, setBarrioRetiro] = useState("");
  const [zonaRetiro, setZonaRetiro] = useState<ZonaAMBA>("CABA");
  const [codigoPostalRetiro, setCodigoPostalRetiro] = useState("");
  const [costoEnvioAMBA, setCostoEnvioAMBA] = useState("");

  useEffect(() => {
    if (cargando) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (rol !== "vendedor") {
      router.push("/");
    }
  }, [user, rol, cargando, router]);

  useEffect(() => {
    if (!user || rol !== "vendedor") return;
    getPerfilVendedor(user.uid)
      .then((perfil) => {
        if (!perfil) return;
        setNombreEmpresa(perfil.nombreEmpresa);
        setRazonSocial(perfil.razonSocial);
        setCuit(perfil.cuit);
        setEmail(perfil.email);
        setOfreceRetiro(perfil.ofreceRetiro);
        if (perfil.direccionRetiro) {
          setCalleRetiro(perfil.direccionRetiro.calle);
          setNumeroRetiro(perfil.direccionRetiro.numero);
          setBarrioRetiro(perfil.direccionRetiro.barrio);
          setZonaRetiro(perfil.direccionRetiro.zona);
          setCodigoPostalRetiro(perfil.direccionRetiro.codigoPostal);
        }
        if (perfil.costoEnvioAMBA !== null) {
          setCostoEnvioAMBA(String(perfil.costoEnvioAMBA));
        }
      })
      .catch(() => setError("No pudimos cargar tu perfil."))
      .finally(() => setCargandoPerfil(false));
  }, [user, rol]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setMensaje(null);

    if (ofreceRetiro && (!calleRetiro || !numeroRetiro || !barrioRetiro)) {
      setError("Completá la dirección de retiro, o desactivá esa opción.");
      return;
    }

    setGuardando(true);
    try {
      await actualizarPerfilVendedor(user.uid, {
        nombreEmpresa,
        razonSocial,
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
        costoEnvioAMBA: costoEnvioAMBA ? Number(costoEnvioAMBA) : null,
      });
      setMensaje("Perfil actualizado.");
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando || !user || rol !== "vendedor") {
    return (
      <main className="min-h-screen bg-paper-texture">
        <Header />
        <p className="text-center text-sm text-charcoal/50 py-24">
          Cargando…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper-texture">
      <Header />
      <section className="mx-auto max-w-md px-5 py-16">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-3xl font-semibold">
            Editar mi perfil
          </h1>
          <Link href="/vendedor" className="text-sm text-ink underline">
            ← Volver
          </Link>
        </div>
        <p className="text-charcoal/60 text-sm mb-8">
          Esta dirección es la que ven los compradores que elijan retirar
          en tu local.
        </p>

        {cargandoPerfil ? (
          <p className="text-sm text-charcoal/50">Cargando…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="ficha bg-white border border-line p-4 text-xs text-charcoal/60 space-y-1">
              <p>
                <span className="font-medium text-charcoal/80">CUIT:</span>{" "}
                {cuit} <span className="text-charcoal/40">(no editable)</span>
              </p>
              <p>
                <span className="font-medium text-charcoal/80">Email:</span>{" "}
                {email}
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-medium block mb-1">
                Nombre de fantasía
              </span>
              <input
                type="text"
                value={nombreEmpresa}
                onChange={(e) => setNombreEmpresa(e.target.value)}
                required
                className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium block mb-1">
                Razón social
              </span>
              <input
                type="text"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                required
                className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
              />
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={ofreceRetiro}
                onChange={(e) => setOfreceRetiro(e.target.checked)}
              />
              <span className="text-sm font-medium">
                Ofrezco retiro en mi local
              </span>
            </label>

            {ofreceRetiro && (
              <div className="ficha bg-white border border-line p-4 space-y-3">
                <p className="text-xs text-charcoal/50">
                  Dirección exacta de retiro — el comprador la ve recién
                  cuando inicia el pago, nunca antes.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm font-medium block mb-1">
                      Calle
                    </span>
                    <input
                      type="text"
                      value={calleRetiro}
                      onChange={(e) => setCalleRetiro(e.target.value)}
                      className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium block mb-1">
                      Número
                    </span>
                    <input
                      type="text"
                      value={numeroRetiro}
                      onChange={(e) => setNumeroRetiro(e.target.value)}
                      className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium block mb-1">
                    Barrio (esto es lo único que se ve en público)
                  </span>
                  <input
                    type="text"
                    value={barrioRetiro}
                    onChange={(e) => setBarrioRetiro(e.target.value)}
                    className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
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
                      <option value="GBA">GBA</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium block mb-1">
                      Código postal
                    </span>
                    <input
                      type="text"
                      value={codigoPostalRetiro}
                      onChange={(e) => setCodigoPostalRetiro(e.target.value)}
                      className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
                    />
                  </label>
                </div>
              </div>
            )}

            <label className="block">
              <span className="text-sm font-medium block mb-1">
                Costo de envío a AMBA (opcional, un solo valor por pedido)
              </span>
              <input
                type="number"
                min="0"
                value={costoEnvioAMBA}
                onChange={(e) => setCostoEnvioAMBA(e.target.value)}
                placeholder="Dejalo vacío si no ofrecés envío"
                className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
              />
            </label>

            {error && <p className="text-clay text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-1.5 bg-ink text-white font-semibold px-5 py-2.5 rounded-stamp text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              <Save size={15} />
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
            {mensaje && (
              <span className="text-xs text-charcoal/60 ml-3">{mensaje}</span>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
