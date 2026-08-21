"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthProvider";
import {
  getCategorias,
  condicionLabel,
  type Categoria,
  type CondicionProducto,
} from "@/lib/firestore";
import {
  crearProducto,
  fileABase64,
} from "@/lib/productos-vendedor";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Upload, Sparkles } from "lucide-react";

// Flag simple para reactivar la generación con IA más adelante (cuando
// haya crédito cargado en console.anthropic.com). Al ponerlo en true,
// vuelve a aparecer el botón "Generar con IA" sin tocar nada más.
const IA_HABILITADA = false;

const condiciones = Object.entries(condicionLabel) as [
  CondicionProducto,
  string
][];

type PerfilRetiro = {
  ofreceRetiro: boolean;
  barrio: string;
  zona: string;
};

export default function NuevoProductoPage() {
  const { user, rol, cargando: cargandoAuth } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [imagen, setImagen] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confianza, setConfianza] = useState<string | null>(null);

  // Campos del formulario (se autocompletan con la IA, siempre editables)
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [condicion, setCondicion] = useState<CondicionProducto>(
    "devolucion_sin_uso"
  );
  const [detalleCondicion, setDetalleCondicion] = useState("");
  const [precio, setPrecio] = useState("");
  const [precioOriginal, setPrecioOriginal] = useState("");
  const [stock, setStock] = useState("1");
  const [retiro, setRetiro] = useState(true);
  const [envioDomicilio, setEnvioDomicilio] = useState(false);
  const [costoEnvio, setCostoEnvio] = useState("");
  const [perfilRetiro, setPerfilRetiro] = useState<PerfilRetiro | null>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);

  useEffect(() => {
    getCategorias().then((cats) => {
      setCategorias(cats);
      if (cats[0]) setCategoria(cats[0].slug);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "vendedores", user.uid))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.ofreceRetiro && data.direccionRetiro) {
            setPerfilRetiro({
              ofreceRetiro: true,
              barrio: data.direccionRetiro.barrio,
              zona: data.direccionRetiro.zona,
            });
          } else {
            setPerfilRetiro({ ofreceRetiro: false, barrio: "", zona: "" });
            setRetiro(false);
          }
        }
      })
      .finally(() => setCargandoPerfil(false));
  }, [user]);

  useEffect(() => {
    if (!cargandoAuth && (!user || rol !== "vendedor")) {
      router.push("/login");
    }
  }, [user, rol, cargandoAuth, router]);

  function onArchivoSeleccionado(file: File | null) {
    setImagen(file);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function generarConIA() {
    if (!imagen) return;
    setGenerando(true);
    setError(null);
    setConfianza(null);
    try {
      const base64 = await fileABase64(imagen);
      const res = await fetch("/api/productos/generar-desde-foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagenBase64: base64,
          mediaType: imagen.type || "image/jpeg",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo generar");

      setTitulo(data.titulo ?? "");
      if (data.categoria) setCategoria(data.categoria);
      if (data.condicionSugerida) setCondicion(data.condicionSugerida);
      setDetalleCondicion(data.detalleCondicionSugerido ?? "");
      setConfianza(data.confianza ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos generar la sugerencia. Cargá los datos a mano."
      );
    } finally {
      setGenerando(false);
    }
  }

  async function publicar() {
    if (!user) return;
    setError(null);

    const precioNum = Number(precio);
    const precioOriginalNum = precioOriginal ? Number(precioOriginal) : null;
    const stockNum = Number(stock);

    if (!titulo.trim()) return setError("Falta el título.");
    if (!precioNum || precioNum <= 0) return setError("Precio inválido.");
    if (
      precioOriginalNum !== null &&
      precioOriginalNum <= precioNum
    )
      return setError(
        "El precio original tiene que ser mayor al precio de venta."
      );
    if (!stockNum || stockNum <= 0) return setError("Stock inválido.");
    if (!retiro && !envioDomicilio)
      return setError("Elegí al menos un método de entrega.");
    const costoEnvioNum = envioDomicilio ? Number(costoEnvio) : null;
    if (envioDomicilio && (costoEnvioNum === null || costoEnvioNum < 0 || isNaN(costoEnvioNum)))
      return setError(
        "Ingresá el costo de envío (podés poner 0 si es gratis)."
      );

    setPublicando(true);
    try {
      const perfilSnap = await getDoc(doc(db, "vendedores", user.uid));
      const nombreVendedor = perfilSnap.exists()
        ? perfilSnap.data().nombreEmpresa
        : user.displayName ?? "Vendedor";

      const cat = categorias.find((c) => c.slug === categoria);

      const nuevoId = await crearProducto({
        titulo: titulo.trim(),
        categoria,
        categoriaLabel: cat?.label ?? categoria,
        condicion,
        detalleCondicion: detalleCondicion.trim(),
        precio: precioNum,
        precioOriginal: precioOriginalNum,
        stock: stockNum,
        vendedorId: user.uid,
        vendedor: nombreVendedor,
        imagen,
        envio: {
          retiro,
          envioDomicilio,
          costoEnvio: costoEnvioNum,
          barrioRetiro:
            retiro && perfilRetiro?.ofreceRetiro
              ? `${perfilRetiro.barrio}, ${perfilRetiro.zona}`
              : null,
        },
      });

      // Con stock 1 (el caso más común), lo natural es imprimir la
      // etiqueta enseguida — por eso redirige ahí en vez de al panel.
      router.push(`/vendedor/productos/${nuevoId}/etiqueta`);
    } catch (err) {
      console.error(err);
      setError("No pudimos publicar el producto. Intentá de nuevo.");
    } finally {
      setPublicando(false);
    }
  }

  if (cargandoAuth || !user || rol !== "vendedor") {
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
      <section className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-display text-3xl font-semibold mb-1">
          Publicar producto
        </h1>
        <p className="text-sm text-charcoal/60 mb-8">
          Subí una foto y completá los datos del producto.
        </p>

        {/* Paso 1: foto */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              onArchivoSeleccionado(e.target.files?.[0] ?? null)
            }
          />

          {previewUrl ? (
            <div className="ficha border border-line bg-white p-4">
              <div className="flex gap-4 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="w-28 h-28 object-cover rounded-stamp border border-line"
                />
                <div className="flex-1 space-y-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm underline text-ink"
                  >
                    Cambiar foto
                  </button>
                  {IA_HABILITADA && (
                    <>
                      <button
                        onClick={generarConIA}
                        disabled={generando}
                        className="flex items-center gap-2 bg-amber text-ink font-semibold px-4 py-2 rounded-stamp text-sm hover:bg-amber-dark transition-colors disabled:opacity-60"
                      >
                        <Sparkles size={16} />
                        {generando ? "Generando…" : "Generar con IA"}
                      </button>
                      {confianza && (
                        <p className="text-xs text-charcoal/50">
                          Confianza de la sugerencia:{" "}
                          <span className="font-medium">{confianza}</span> —
                          revisá los datos antes de publicar.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="ficha w-full border-2 border-dashed border-line bg-white py-12 flex flex-col items-center gap-2 text-charcoal/50 hover:border-ink/40 hover:text-ink transition-colors"
            >
              <Upload size={28} />
              <span className="text-sm font-medium">
                Tocá para subir una foto del producto
              </span>
            </button>
          )}
        </div>

        {/* Paso 2: formulario editable */}
        <div className="space-y-4">
          <Campo label="Título" value={titulo} onChange={setTitulo} />

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium block mb-1">
                Categoría
              </span>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink bg-white"
              >
                {categorias.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium block mb-1">
                Condición
              </span>
              <select
                value={condicion}
                onChange={(e) =>
                  setCondicion(e.target.value as CondicionProducto)
                }
                className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink bg-white"
              >
                {condiciones.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium block mb-1">
              Detalle de la condición
            </span>
            <textarea
              value={detalleCondicion}
              onChange={(e) => setDetalleCondicion(e.target.value)}
              rows={3}
              placeholder="Ej: el comprador se arrepintió, nunca se usó. Etiquetas puestas."
              className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink bg-white resize-none"
            />
            <span className="text-xs text-charcoal/50 mt-1 block">
              Esto lo ve el comprador tal cual lo escribas — sé específico,
              genera confianza.
            </span>
          </label>

          <div className="grid grid-cols-3 gap-3">
            <Campo
              label="Precio"
              value={precio}
              onChange={setPrecio}
              type="number"
            />
            <Campo
              label="Precio original"
              value={precioOriginal}
              onChange={setPrecioOriginal}
              type="number"
              hint="Opcional"
            />
            <Campo
              label="Stock"
              value={stock}
              onChange={setStock}
              type="number"
            />
          </div>

          <div className="ficha bg-white border border-line p-4">
            <span className="text-sm font-medium block mb-3">
              Entrega
            </span>
            <div className="space-y-3">
              <label
                className={`flex items-center gap-2.5 text-sm ${
                  !cargandoPerfil && perfilRetiro && !perfilRetiro.ofreceRetiro
                    ? "opacity-50"
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={retiro}
                  disabled={
                    !cargandoPerfil &&
                    !!perfilRetiro &&
                    !perfilRetiro.ofreceRetiro
                  }
                  onChange={(e) => setRetiro(e.target.checked)}
                  className="accent-ink"
                />
                Retiro en el local del vendedor
                {perfilRetiro?.ofreceRetiro && (
                  <span className="text-xs text-charcoal/50">
                    ({perfilRetiro.barrio}, {perfilRetiro.zona})
                  </span>
                )}
              </label>
              {!cargandoPerfil && perfilRetiro && !perfilRetiro.ofreceRetiro && (
                <p className="text-xs text-charcoal/50 pl-6 -mt-2">
                  Todavía no cargaste una dirección de retiro en tu
                  registro. Contactanos para agregarla.
                </p>
              )}
              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={envioDomicilio}
                  onChange={(e) => setEnvioDomicilio(e.target.checked)}
                  className="accent-ink"
                />
                Envío a domicilio (por ahora, solo AMBA: CABA y GBA)
              </label>
              {envioDomicilio && (
                <div className="pl-6">
                  <Campo
                    label="Costo de envío (tarifa fija)"
                    value={costoEnvio}
                    onChange={setCostoEnvio}
                    type="number"
                    hint="Poné 0 si el envío es gratis. Se cobra UNA VEZ por pedido, no por producto — usá el mismo valor en todas tus publicaciones con envío."
                  />
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-clay text-sm font-medium">{error}</p>}

          <button
            onClick={publicar}
            disabled={publicando}
            className="w-full bg-ink text-paper font-semibold py-3 rounded-stamp hover:bg-ink-light transition-colors disabled:opacity-60"
          >
            {publicando ? "Publicando…" : "Publicar producto"}
          </button>
        </div>
      </section>
    </main>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium block mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-line rounded-stamp px-3 py-2 text-sm outline-none focus:border-ink bg-white"
      />
      {hint && (
        <span className="text-xs text-charcoal/50 mt-1 block">{hint}</span>
      )}
    </label>
  );
}
