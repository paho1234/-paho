# PAHÓ — Outlet de devoluciones

MVP Fase 1: catálogo multi-categoría/multi-vendedor de productos de
**devolución, reacondicionados y liquidación** (no compite de frente con
un marketplace general tipo ML — el ángulo es precio + transparencia de
condición). Incluye registro/login de compradores y vendedores + checkout
con Mercado Pago (modo simple, un solo cobrador). Pensado para migrar a
multi-vendedor real ("Marketplace mode" de MP) en la Fase 2 sin rehacer
el modelo de datos.

## Posicionamiento

- **Qué se vende:** productos con descuento real (`precioOriginal` vs
  `precio`) y una condición declarada de forma explícita — no hay
  "Nuevo" genérico. Ver `CondicionProducto` en `lib/firestore.ts`:
  `devolucion_sin_uso`, `reacondicionado`, `detalle_estetico`,
  `caja_abierta`.
- **Por qué importa la condición declarada:** es un requisito de la Ley
  de Defensa del Consumidor, no solo un diferencial de marca. Por eso el
  vendedor firma una declaración al registrarse (`aceptaDeclaracionCondicion`
  en `vendedores/{uid}`) y cada ficha de producto muestra el detalle en
  texto plano, no escondido en la letra chica.
- **Multi-vendedor desde el diseño:** cualquiera puede sumar sus propios
  lotes de devolución/liquidación (no es exclusivo de las marcas de
  Rafa) — por eso el checkout ya valida que un pedido no mezcle
  vendedores distintos (ver limitación de Fase 1 más abajo).

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Zustand (carrito, persistido en localStorage)
- Firebase Firestore (catálogo real — ver `lib/firestore.ts`)
- Firebase Auth (email/contraseña — ver `lib/auth.ts` y `contexts/AuthProvider.tsx`)
- Firebase Storage (documentos de facturación del vendedor)
- Mercado Pago Checkout Pro (SDK oficial `mercadopago`)

## Identidad visual

- **Paleta:** tinta `#1B2A3D`, ámbar `#E8A33D`, papel `#FAF6EF`, arcilla
  `#D65F4C`, musgo `#3C7A5E`.
- **Tipografía:** Fraunces (display), Inter (cuerpo/UI), JetBrains Mono
  (precios, SKUs, metadata) — self-hosted vía Fontsource, sin depender de
  Google Fonts en build.
- **Elemento distintivo:** cada producto se muestra en una "ficha" con
  bordes recortados y un sello circular rotado con la inicial de la
  categoría — un guiño a la etiqueta de feria/mercado, para diferenciarse
  de las grillas de imagen pura tipo ML.

## Registro y login

- `/registro` — selector de rol (comprador / vendedor)
- `/registro/comprador` — nombre, email, contraseña
- `/registro/vendedor` — nombre de empresa, razón social, CUIT (validado
  en formato, no contra AFIP), condición frente al IVA, email, contraseña,
  y carga opcional de la constancia de inscripción AFIP (PDF/JPG/PNG) a
  Firebase Storage
- `/login` — email + contraseña, redirige a `/vendedor` o `/` según el rol
- `/vendedor` — placeholder del panel, protegido por rol (redirige si no
  hay sesión de vendedor)

El registro de vendedor guarda dos documentos en Firestore:
`usuarios/{uid}` (perfil general, mismo shape que comprador) y
`vendedores/{uid}` (datos fiscales completos: razón social, CUIT,
condición IVA, URL del documento subido, y un flag `verificado: false`
hasta que el equipo de PAHO revise los datos manualmente).

## Setup de Firebase

1. Crear un proyecto nuevo en [Firebase Console](https://console.firebase.google.com),
   dedicado a PAHO (no reutilizar `facturapp-cf75f`).
2. Habilitar **Firestore Database** (modo producción).
3. Habilitar **Authentication > Sign-in method > Email/contraseña**. Sin
   esto el registro y el login no funcionan.
4. Habilitar **Storage**.
5. En Configuración del proyecto > Apps, agregar una app Web y copiar las
   credenciales a `.env.local` (`NEXT_PUBLIC_FIREBASE_*`).
6. Publicar las reglas de seguridad:
   `firebase deploy --only firestore:rules,storage:rules`
   (o pegar el contenido de `firestore.rules` / `storage.rules` directo
   en la consola).
7. Generar una clave de cuenta de servicio (Configuración del proyecto >
   Cuentas de servicio > Generar nueva clave privada) y guardarla como
   `service-account.json` en la raíz — está en `.gitignore`, nunca se sube.
8. Cargar los datos de ejemplo: `node scripts/seed.mjs`

## Facturación: qué ve el vendedor y qué no

El vendedor factura directo al comprador, pero **nunca ve su perfil
completo** — ni email, ni teléfono, ni historial de compras en otros
vendedores. Esto no se resuelve ocultando campos con las reglas de
seguridad (Firestore no permite lectura parcial de un documento: si el
vendedor puede leer el documento, lo lee entero). Se resuelve con
**minimización de datos**: el documento que el vendedor puede leer nunca
contiene esa información en primer lugar.

- `usuarios/{uid}` — perfil completo del comprador (nombre, email, tipo y
  número de documento). **Privado**: solo el propio usuario lo lee.
- `ordenes/{id}` — se crea en el servidor (`/api/mercadopago/crear-preferencia`,
  con Admin SDK) al iniciar el pago. Contiene un objeto `facturacion` con
  **solo** `nombre`, `tipoDocumento`, `numeroDocumento` y `condicionIVA`
  — copiados desde `usuarios/{uid}` en ese momento, sin el email ni nada
  más. El vendedor puede leer la orden completa (`vendedorId ==
  request.auth.uid`) porque no hay nada sensible en ella.

Por eso el registro de comprador ahora pide DNI o CUIT: se guarda una
sola vez en el perfil privado, y se copia automáticamente a cada orden
que genere. El comprador tiene que haber iniciado sesión para pagar —
por eso el carrito pide login antes de mostrar el botón de Mercado Pago.

## Envíos

**Fase 1: solo AMBA (CABA + GBA), tarifa fija por vendedor.**

Cada producto declara su propio método de entrega (`envio` en
`lib/firestore.ts`): `retiro` (en el local del vendedor), `envioDomicilio`
con un `costoEnvio`, o ambos. El costo **no es por producto ni por
unidad** — es la tarifa fija del vendedor, se cobra **una sola vez por
pedido**. Como todas las publicaciones de un mismo vendedor deberían
compartir la misma tarifa, `/vendedor/productos/nuevo` se lo aclara en
el propio formulario; no hay (todavía) un lugar centralizado donde
configurarla una sola vez para todas las publicaciones — es una mejora
pendiente (ver más abajo).

En el carrito (`app/carrito/page.tsx`):

- Solo se ofrecen los métodos que **todos** los productos del carrito
  soportan a la vez (`metodosDisponibles()` en `store/cart.ts`, hace la
  intersección). Si no hay ningún método en común, se le pide al
  comprador separar la compra — misma limitación que ya existía para
  "un pedido, un solo vendedor".
- Si elige "envío a domicilio", se piden calle/número/depto/barrio-
  partido/código postal, un selector de **zona** limitado a `CABA` o
  `GBA` (no hay campo de provincia libre — está restringido a propósito,
  ver `ZonaEnvio` en `lib/ordenes.ts`), y un teléfono de contacto puntual
  para esa entrega (**no** es el de la cuenta del comprador).
- El costo de envío se suma como un ítem aparte ("Envío a domicilio
  (AMBA)") en la preferencia de Mercado Pago, así el comprador ve el
  desglose en el checkout.
- `costoEnvioTotal()` en `store/cart.ts` toma el **máximo** declarado
  entre los ítems del carrito (no la suma) — es una salvaguarda por si
  alguna publicación quedó con un valor viejo; en el caso normal, todas
  las publicaciones de un mismo vendedor declaran el mismo número.

### Retiro: el comprador nunca ve la dirección exacta hasta pagar

Mismo principio de minimización que en Facturación, aplicado a la
dirección del local del vendedor:

- El vendedor carga su dirección de retiro **una sola vez**, al
  registrarse (`/registro/vendedor`) — vive en
  `vendedores/{uid}.direccionRetiro` (privado, solo el dueño la lee, ver
  `firestore.rules`).
- En cada publicación, lo único que se muestra en público es el
  **barrio** (`Producto.envio.barrioRetiro`, ej: "Retiro en Belgrano,
  CABA") — nunca la calle ni el número. Se toma automáticamente del
  perfil al publicar (`/vendedor/productos/nuevo`), no se le vuelve a
  preguntar al vendedor por producto (evita inconsistencias).
- La dirección **exacta** recién se copia a una orden puntual
  (`ordenes/{id}.envio.direccionRetiro`) en el momento en que el
  comprador inicia el pago (`crear-preferencia/route.ts`, usando Admin
  SDK). Como esa orden solo la puede leer el comprador de esa compra y
  el vendedor, nadie que esté simplemente navegando el catálogo llega a
  verla.
- Nota honesta: la dirección se revela en el momento de **iniciar** el
  pago (redirect a Mercado Pago), no cuando el pago se **confirma** —
  todavía no hay webhook que actualice `estado` a `pagado` (ver
  pendientes). Para el MVP es una aproximación razonable, pero si querés
  la garantía estricta de "solo después de pagado", hay que esperar a
  implementar el webhook y mostrar la dirección recién ahí (por ejemplo
  en una futura pantalla de "mis compras").

A diferencia de los datos de facturación (que se minimizan a propósito),
la dirección y el teléfono de contacto **sí** se guardan completos en
`ordenes/{id}.envio` cuando el método es "domicilio" — acá no hay forma
de minimizar sin romper la función: el vendedor necesita esos datos para
poder despachar el pedido. Ver `lib/ordenes.ts` para el detalle del tipo
`Envio`.

**Validación server-side:** el endpoint de checkout revalida que todos
los ítems soporten el método elegido, rechaza cualquier `zona` que no
sea `CABA` o `GBA`, y recalcula el costo de envío tomando el máximo entre
los ítems (mismo criterio que el cliente, pero sin confiar en lo que
mande el navegador). Sí sigue confiando en el precio de cada ítem
(mismo nivel de confianza que tenía el checkout antes de esto; validar
precios contra Firestore en el servidor queda como mejora futura, ver
más abajo).

## Correr en local

```bash
npm install
cp .env.local.example .env.local   # completar credenciales
npm run dev
```

## Dominio: paho.com.ar

Al deployar, hay tres lugares donde hay que pegarlo:

1. `NEXT_PUBLIC_SITE_URL=https://paho.com.ar` en las variables de entorno
   del hosting (Netlify) — de ahí salen las `back_urls` del checkout de
   Mercado Pago.
2. Firebase Console > Authentication > Settings > Authorized domains —
   agregar `paho.com.ar`, si no el login falla en producción.
3. DNS del dominio apuntando a Netlify.

## Deploy: Netlify + Firebase

Mismo patrón que FacturApp y Caja Diaria: Firebase como backend
(Firestore/Auth/Storage), Netlify como hosting. `netlify.toml` ya está
en la raíz con el plugin oficial de Next.js
(`@netlify/plugin-nextjs`), que sirve el App Router y las API routes
(`/api/mercadopago/...`, `/api/productos/...`) como Netlify Functions sin
que haya que reescribir nada — Netlify las detecta solas.

1. Conectar el repo en Netlify (o `netlify deploy` desde la CLI). Netlify
   lee `netlify.toml` y corre `npm run build` automáticamente.
2. Cargar TODAS las variables de `.env.local.example` en Site
   configuration > Environment variables — sin esto el build compila
   pero el sitio no puede hablar con Firebase/MP/Anthropic en runtime.
   Ojo con `FIREBASE_ADMIN_PRIVATE_KEY`: pegarla con los `\n` literales
   tal como sale del JSON, Netlify no interpreta saltos de línea reales
   en el campo de texto.
3. En Site configuration > Domain management, agregar `paho.com.ar` como
   dominio custom y seguir la verificación DNS que te va a mostrar
   Netlify (o apuntar el DNS existente al `.netlify.app` que te asigna).
4. Repetir el paso 2 del dominio: agregarlo también en Firebase
   Authentication > Authorized domains.

Las rutas `/` y `/producto/[id]` están marcadas `force-dynamic`: leen
Firestore en cada request, no se pre-generan en build.

`lib/firebase.ts` inicializa Auth y Storage de forma perezosa
(`getFirebaseAuth()` / `getFirebaseStorage()`, llamadas solo desde
componentes cliente). Es intencional: si se inicializaran a nivel de
módulo, Next.js los ejecuta durante "collecting page data" en el build, y
con credenciales inválidas o ausentes en ese momento el build entero se
rompe.

## Modelo de datos actual

- **`categorias/{slug}`** — `{ label, orden }`
- **`productos/{id}`** — `{ titulo, precio, categoria, categoriaLabel,
  vendedor, vendedorId, stock, condicion, imagenColor, imagenes[], activo,
  creadoEn }`
- **`usuarios/{uid}`** — `{ rol, nombre, email, tipoDocumento,
  numeroDocumento, creadoEn }` — privado, solo el dueño lo lee
- **`vendedores/{uid}`** — `{ nombreEmpresa, razonSocial, cuit,
  condicionIVA, email, documentoFacturacionUrl, verificado, mpSellerId,
  creadoEn }` — privado, solo el dueño lo lee
- **`ordenes/{id}`** — `{ compradorId, vendedorId, items[], total,
  facturacion: { nombre, tipoDocumento, numeroDocumento, condicionIVA },
  estado, mpPreferenceId, creadoEn }` — leen comprador y vendedor
  involucrados, nunca terceros; se crea solo vía Admin SDK

## Publicar productos (vendedor)

`/vendedor/productos/nuevo` — carga rápida pensada para lotes de
devolución: el vendedor sube una foto y toca "Generar con IA"
(`/api/productos/generar-desde-foto`, usa Claude con visión vía
`ANTHROPIC_API_KEY`) para obtener un borrador de título, categoría,
condición y su justificación a partir de lo que se ve en la imagen. Todo
queda editable — la IA solo ahorra el primer tipeo, el vendedor confirma
o corrige antes de publicar.

**Sobre las fotos:** se comprimen en el navegador (`lib/image-utils.ts`,
canvas + JPEG calidad 0.72, ancho máx. 900px) y se guardan como base64
directo en el documento de Firestore — **no** se usa Firebase Storage.
Esto es intencional: Storage ahora exige el plan Blaze (pago por uso,
con tarjeta vinculada) para crear un bucket nuevo, y así se evita esa
barrera para el MVP. El costo es que cada producto pesa más en Firestore
(~100-200KB en vez de unos bytes) y solo entra una foto por producto
cómodamente bajo el límite de 1MB por documento.

Si en algún momento activás Storage (plan Blaze), lo natural es volver a
subir el archivo real y guardar la URL en `imagenes[]`, en vez de
base64 — mejor para performance y costo de Firestore con catálogos
grandes. El código viejo (`ref`, `uploadBytes`, `getDownloadURL` de
`firebase/storage`) queda documentado acá por si hay que revertir.

**Nota:** "Generar con IA" está apagado por ahora
(`IA_HABILITADA = false` en `app/vendedor/productos/nuevo/page.tsx`)
porque la `ANTHROPIC_API_KEY` no tenía crédito cargado. Poner ese flag
en `true` para reactivarlo — no hace falta tocar nada más.

### Etiqueta con código de barras

Como la mayoría de las publicaciones tienen stock 1, cada producto
recién creado redirige directo a `/vendedor/productos/{id}/etiqueta` —
una etiqueta imprimible con título, categoría, condición, precio y un
código de barras (Code128, vía `jsbarcode`) que codifica el **ID de
Firestore del producto**. No se generó ningún sistema de SKU paralelo:
el ID que ya existe es único de por sí, así que sirve directo como
código de barras sin inventar nada nuevo.

- `components/CodigoBarra.tsx` — renderiza el barcode en un `<svg>`.
- La página de etiqueta está protegida: solo el vendedor dueño de ese
  producto puede verla/imprimirla (compara `producto.vendedorId` contra
  el usuario logueado).
- El botón "Imprimir etiqueta" llama a `window.print()`; hay dos modos
  seleccionables antes de imprimir:
  - **Impresora térmica**: una sola etiqueta, `@page { size: 62mm 40mm; }`
    — el tamaño típico de rollos autoadhesivos.
  - **Hoja A4**: una grilla de 12 etiquetas del mismo tamaño físico
    (62×40mm cada una, con línea punteada de corte), para probar el
    diseño en cualquier impresora común antes de comprar una térmica, o
    para usar con hojas A4 de etiquetas autoadhesivas pre-cortadas.
  Ajustar el tamaño en ambos bloques `@media print` del mismo archivo si
  tu rollo/hoja es de otra medida.
- Desde `/vendedor`, cada fila de "Mis productos" también tiene un
  botón "Etiqueta" para volver a imprimirla cuando haga falta (no solo
  la primera vez).

### Mis pedidos y etiqueta del pedido vendido

`/vendedor/pedidos` — lista las órdenes donde el vendedor participa
(`getPedidosDeVendedor` en `lib/pedidos-vendedor.ts`, query por
`vendedorId` en la colección `ordenes`; **requiere el mismo tipo de
índice compuesto** que ya vimos con `productos` — `vendedorId` +
`creadoEn` — Firestore va a tirar el link para crearlo la primera vez
que corra esta consulta si todavía no existe). Cada fila muestra
comprador, productos, método de entrega, estado y total, con un link a
la etiqueta de ese pedido puntual.

`/vendedor/pedidos/{id}/etiqueta` — a diferencia de la etiqueta de
producto (que es para identificar el objeto físico en el stock), esta
es para el momento de la entrega. Incluye:

- Nombre del comprador + tipo/número de documento — para confirmar
  identidad antes de entregar, sobre todo en retiro.
- Dirección completa y teléfono de contacto, **solo si el método es
  envío a domicilio** (en retiro no hace falta, ya la tiene el vendedor).
- El detalle de productos, cantidades y el total.
- Un código de barras (mismo componente `CodigoBarra`) que codifica el
  **ID de la orden** — para que el vendedor lo use como referencia
  interna si maneja un sistema propio de seguimiento de pedidos.

Todos estos datos ya eran legítimamente visibles para el vendedor desde
que armamos el checkout (ver "Facturación" y "Envíos" más arriba) — acá
simplemente se le da una superficie usable para verlos e imprimirlos,
no se relaja ningún control de acceso nuevo.

Dos modos de impresión, igual que la etiqueta de producto:
- **Etiqueta de envío** — 100mm × 150mm, el tamaño estándar que usan
  Correo Argentino/OCA/Andreani para sus propias etiquetas térmicas.
- **Comprobante A4** — una hoja completa, para imprimir en cualquier
  impresora común a modo de remito.

### Confirmación de entrega (estilo Mercado Libre)

La entrega no se asume sola — el vendedor la confirma tocando "Marcar
como entregado" (o "despachado" si el método es envío), tanto desde
`/vendedor/pedidos` como desde la etiqueta de cada pedido. Esto agrega
un campo nuevo, separado del estado de pago:

- `Orden.entrega`: `"pendiente" | "entregado"` (más
  `entregaConfirmadaEn`, un timestamp) — ver `lib/ordenes.ts`.
- `confirmarEntrega(ordenId)` en `lib/pedidos-vendedor.ts` hace el
  `updateDoc` desde el cliente.

Esto obligó a abrir la primera excepción a `allow write: if false` en
`ordenes` — pero de forma bien quirúrgica: la regla usa
`request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])`
para permitir *únicamente* que cambien `entrega` y
`entregaConfirmadaEn`. Si alguien intentara, por ejemplo, mandar un
`total` distinto junto con el cambio de entrega, Firestore rechaza todo
el update — no hay forma de que el vendedor toque el total, la
facturación o la dirección del comprador por esta vía.

El panel `/vendedor` lista los productos propios (`getProductosDeVendedor`
en `lib/productos-vendedor.ts`) y tiene el botón para publicar uno nuevo.
Al publicar, también se elige el método de entrega — ver sección
"Envíos" más arriba.

## Pendiente para producción

1. **Múltiples fotos por producto:** hoy la carga rápida sube una sola
   imagen. `imagenes[]` en el modelo ya soporta un array — se puede
   extender el formulario para varias fotos sin tocar el resto (ojo con
   el límite de 1MB por documento si se suman varias en base64).
2. **Edición/baja de productos ya publicados:** el panel de vendedor solo
   lista y crea. Falta editar precio/stock o dar de baja (`activo: false`)
   sin pasar por Firestore Console.
3. **"Mis pedidos" del vendedor:** falta una vista que lea `ordenes`
   filtrado por `vendedorId` — ahí es donde el vendedor ve los datos de
   facturación de cada compra para emitir el comprobante.
4. **Verificación de vendedores:** hoy `verificado` queda en `false` al
   registrarse. Falta una vista de administración (o proceso manual) para
   revisar el documento subido y pasar el flag a `true` antes de habilitar
   publicaciones (hoy un vendedor no verificado ya puede publicar; si
   querés bloquearlo hasta la revisión, hay que sumar esa condición a
   `firestore.rules` en `productos`).
5. **Webhook de MP:** endpoint `/api/mercadopago/webhook` para actualizar
   `ordenes/{id}.estado` a `pagado` cuando se acredita el pago (usa
   `external_reference` que ya viaja en la preferencia con el id de la
   orden). No incluido en este scaffold.
6. **Emisión real del comprobante:** este MVP arma los datos, pero no
   emite el comprobante fiscal en sí. Si cada vendedor va a facturar con
   su propia CUIT (Factura A/B/C), lo natural es que integren su propia
   solución de facturación electrónica (por ejemplo, reusando el enfoque
   de FacturApp) y consuman `ordenes/{id}.facturacion` como input.
7. **Fase 2 — multi-vendedor en el pago:** migrar `crear-preferencia` a
   Marketplace mode: OAuth por vendedor + `marketplace_fee` +
   `collector_id` por ítem, según el vendedor real de cada producto.
8. **Validar precios server-side:** hoy el checkout confía en el precio
   que manda el cliente (viene del carrito en localStorage). Antes de
   producción real, conviene que `crear-preferencia` vuelva a leer cada
   `productos/{id}` desde Firestore (Admin SDK) y use ese precio, no el
   que llega en el body — mismo tipo de validación que ya se hace con el
   método de envío.
9. **Tarifa de envío centralizada por vendedor:** hoy cada vendedor tiene
   que acordarse de poner el mismo `costoEnvio` en cada publicación con
   envío — es manual y propenso a error. Lo más prolijo sería mover ese
   campo a `vendedores/{uid}.costoEnvioAMBA` (un solo lugar) y que los
   productos solo declaren si ofrecen envío o no, sin repetir el número.
   No se hizo así en esta primera pasada para no tener que abrir la
   colección `vendedores` a lectura pública (hoy es privada a propósito,
   ver la sección de Facturación) — hay que decidir cómo exponer ese
   único campo sin exponer el resto del perfil fiscal.
10. **Ampliar zonas de envío más allá de AMBA:** cuando llegue el
    momento, sumar más valores a `ZonaEnvio` (`lib/ordenes.ts`) y al
    `<select>` del carrito — posiblemente con una tarifa distinta por
    zona en vez de una tarifa única por vendedor.
