import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type {
  FacturacionComprador,
  Orden,
  DireccionEnvio,
  Envio,
} from "@/lib/ordenes";

// MVP Fase 1: Checkout Pro simple — el dinero entra directo a la cuenta
// de PAHO (mismo patrón que CHALLENGE). Cuando se sumen vendedores
// terceros, migrar a "Marketplace mode": cada vendedor conecta su cuenta
// vía OAuth y acá se agrega `marketplace_fee` + `collector_id` por ítem.
//
// Privacidad: acá es donde se arma el documento de la orden que el
// vendedor va a poder leer. A propósito solo se copian `nombre`,
// `tipoDocumento`, `numeroDocumento` y `condicionIVA` desde el perfil
// privado del comprador (usuarios/{uid}) — nunca el email. La dirección
// y el teléfono de contacto del envío SÍ se incluyen cuando el método es
// "domicilio", porque el vendedor los necesita de verdad para enviar el
// pedido — no es un dato de la cuenta, es lo que el comprador cargó
// puntualmente para esta compra. Ver lib/ordenes.ts.

type ItemCarritoEnvio = {
  retiro: boolean;
  envioDomicilio: boolean;
  costoEnvio: number | null;
};

type ItemCarrito = {
  id: string;
  titulo: string;
  precio: number;
  vendedorId: string;
  cantidad: number;
  envio: ItemCarritoEnvio;
};

export async function POST(req: NextRequest) {
  try {
    const {
      items,
      compradorId,
      metodoEnvio,
      direccionEnvio,
      telefonoEnvio,
    }: {
      items: ItemCarrito[];
      compradorId: string;
      metodoEnvio: "retiro" | "domicilio";
      direccionEnvio: DireccionEnvio | null;
      telefonoEnvio: string | null;
    } = await req.json();

    if (!items?.length) {
      return NextResponse.json(
        { error: "El carrito está vacío" },
        { status: 400 }
      );
    }
    if (!compradorId) {
      return NextResponse.json(
        { error: "Necesitás iniciar sesión para pagar." },
        { status: 401 }
      );
    }
    if (metodoEnvio !== "retiro" && metodoEnvio !== "domicilio") {
      return NextResponse.json(
        { error: "Elegí un método de entrega." },
        { status: 400 }
      );
    }

    // Fase 1: un pedido = un solo vendedor (el Checkout Pro simple no
    // soporta split de pagos). Si el carrito mezcla vendedores, hay que
    // separarlo en pedidos distintos.
    const vendedorIds = new Set(items.map((i) => i.vendedorId));
    if (vendedorIds.size > 1) {
      return NextResponse.json(
        {
          error:
            "Por ahora un pedido no puede combinar productos de distintos vendedores. Separalos en compras distintas.",
        },
        { status: 400 }
      );
    }
    const vendedorId = items[0].vendedorId;

    // Validar que TODOS los productos soporten el método elegido.
    const metodoValido =
      metodoEnvio === "retiro"
        ? items.every((i) => i.envio?.retiro)
        : items.every((i) => i.envio?.envioDomicilio);
    if (!metodoValido) {
      return NextResponse.json(
        {
          error:
            "Alguno de los productos no admite el método de entrega elegido.",
        },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    let envio: Envio;
    if (metodoEnvio === "domicilio") {
      if (
        !direccionEnvio?.calle ||
        !direccionEnvio?.numero ||
        !direccionEnvio?.ciudad ||
        !direccionEnvio?.codigoPostal ||
        !telefonoEnvio
      ) {
        return NextResponse.json(
          { error: "Faltan datos de la dirección de envío." },
          { status: 400 }
        );
      }
      if (direccionEnvio.zona !== "CABA" && direccionEnvio.zona !== "GBA") {
        return NextResponse.json(
          {
            error:
              "Por ahora solo hacemos envíos dentro de CABA y GBA (AMBA).",
          },
          { status: 400 }
        );
      }
      // Tarifa fija del vendedor, se cobra una vez por pedido (no se
      // suma por producto). Tomamos el máximo declarado como salvaguarda
      // ante publicaciones con un valor desactualizado.
      const costoEnvio = Math.max(
        0,
        ...items.map((i) => i.envio?.costoEnvio ?? 0)
      );
      envio = {
        metodo: "domicilio",
        costo: costoEnvio,
        direccion: direccionEnvio,
        telefonoContacto: telefonoEnvio,
        direccionRetiro: null,
      };
    } else {
      // Retiro: recién ACÁ, al confirmar que el comprador está iniciando
      // el pago, buscamos la dirección EXACTA del local en el perfil
      // privado del vendedor y la copiamos a esta orden puntual. Nadie
      // navegando el catálogo la vio antes de este momento — solo el
      // barrio general (ver Producto.envio.barrioRetiro).
      const vendedorSnap = await db.collection("vendedores").doc(vendedorId).get();
      const vendedorData = vendedorSnap.data();
      const direccionRetiro =
        vendedorData?.ofreceRetiro && vendedorData?.direccionRetiro
          ? vendedorData.direccionRetiro
          : null;

      envio = {
        metodo: "retiro",
        costo: 0,
        direccion: null,
        telefonoContacto: null,
        direccionRetiro,
      };
    }

    const perfilSnap = await db.collection("usuarios").doc(compradorId).get();
    if (!perfilSnap.exists) {
      return NextResponse.json(
        { error: "No encontramos tu perfil. Volvé a iniciar sesión." },
        { status: 404 }
      );
    }
    const perfil = perfilSnap.data()!;

    if (!perfil.tipoDocumento || !perfil.numeroDocumento) {
      return NextResponse.json(
        {
          error:
            "Tu cuenta no tiene un documento cargado para facturar. Completalo en tu perfil.",
        },
        { status: 400 }
      );
    }

    const facturacion: FacturacionComprador = {
      nombre: perfil.nombre,
      tipoDocumento: perfil.tipoDocumento,
      numeroDocumento: perfil.numeroDocumento,
      condicionIVA: perfil.condicionIVA ?? "consumidor_final",
    };

    const totalProductos = items.reduce(
      (acc, i) => acc + i.precio * i.cantidad,
      0
    );
    const total = totalProductos + envio.costo;

    const orden: Omit<Orden, "creadoEn"> & {
      creadoEn: FirebaseFirestore.FieldValue;
    } = {
      compradorId,
      vendedorId,
      items: items.map((i) => ({
        id: i.id,
        titulo: i.titulo,
        precio: i.precio,
        cantidad: i.cantidad,
      })),
      total,
      facturacion,
      envio,
      estado: "pendiente_pago",
      entrega: "pendiente",
      entregaConfirmadaEn: null,
      mpPreferenceId: null,
      creadoEn: FieldValue.serverTimestamp(),
    };

    const ordenRef = await db.collection("ordenes").add(orden);

    // Diagnóstico temporal: confirma qué está leyendo realmente esta
    // función en producción, sin exponer el token completo en los logs.
    const tokenActual = process.env.MP_ACCESS_TOKEN;
    console.log(
      "MP_ACCESS_TOKEN detectado:",
      tokenActual
        ? `${tokenActual.slice(0, 15)}... (${tokenActual.length} caracteres)`
        : "NO DEFINIDO (undefined/vacío)"
    );

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN as string,
    });
    const preference = new Preference(client);

    const itemsMP = items.map((item) => ({
      id: item.id,
      title: item.titulo,
      quantity: item.cantidad,
      unit_price: item.precio,
      currency_id: "ARS",
    }));

    if (envio.costo > 0) {
      itemsMP.push({
        id: "envio",
        title: "Envío a domicilio (AMBA)",
        quantity: 1,
        unit_price: envio.costo,
        currency_id: "ARS",
      });
    }

    const respuesta = await preference.create({
      body: {
        items: itemsMP,
        external_reference: ordenRef.id,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/exito`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/error`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/pendiente`,
        },
        auto_return: "approved",
        // Sin tilde a propósito: el resumen bancario del comprador suele
        // restringir el descriptor a caracteres ASCII simples.
        statement_descriptor: "PAHO",
      },
    });

    await ordenRef.update({ mpPreferenceId: respuesta.id });

    return NextResponse.json({
      init_point: respuesta.init_point,
      preference_id: respuesta.id,
      orden_id: ordenRef.id,
    });
  } catch (err) {
    console.error("Error creando preferencia de MP:", err);
    return NextResponse.json(
      { error: "No se pudo crear la preferencia de pago" },
      { status: 500 }
    );
  }
}
