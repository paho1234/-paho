// Botón flotante "Contactanos por WhatsApp", visible en todas las páginas
// (se monta una sola vez en app/layout.tsx). Para cambiar el número,
// editar solo esta constante: código de país + código de área + número,
// sin espacios, guiones ni "+" (ej: 5491155648630 = +54 9 11 5564-8630).
const NUMERO_WHATSAPP = "5491155648630";
const MENSAJE_INICIAL = "Hola! Quiero hacerles una consulta sobre Todo Regalado.";

export default function BotonWhatsApp() {
  const href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(
    MENSAJE_INICIAL
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactanos por WhatsApp"
      // bottom-16: deja libre la esquina de abajo, donde Netlify muestra su
      // cartelito. print:hidden: no sale en las etiquetas que se imprimen.
      className="print:hidden fixed bottom-16 right-4 z-50 inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold text-sm rounded-full pl-3 pr-4 py-3 shadow-lg hover:brightness-95 transition"
    >
      <svg
        viewBox="0 0 32 32"
        width="22"
        height="22"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.003 3C8.83 3 3 8.83 3 16c0 2.29.6 4.52 1.74 6.49L3 29l6.7-1.72A12.94 12.94 0 0 0 16 29c7.17 0 13-5.83 13-13S23.17 3 16.003 3zm0 23.7c-1.94 0-3.84-.52-5.5-1.5l-.4-.24-3.98 1.02 1.06-3.88-.26-.4A10.66 10.66 0 0 1 5.3 16c0-5.9 4.8-10.7 10.7-10.7S26.7 10.1 26.7 16 21.9 26.7 16.003 26.7zm5.87-8c-.32-.16-1.9-.94-2.2-1.04-.3-.1-.5-.16-.72.16-.22.32-.84 1.04-1.02 1.26-.2.2-.38.24-.7.08-.32-.16-1.36-.5-2.58-1.6-.95-.85-1.6-1.9-1.78-2.22-.2-.32-.02-.5.14-.66.14-.14.32-.38.48-.56.16-.2.2-.32.32-.54.1-.2.06-.4-.02-.56-.08-.16-.72-1.74-1-2.38-.26-.62-.52-.54-.72-.54h-.6c-.2 0-.56.08-.84.4-.3.32-1.12 1.1-1.12 2.68s1.14 3.1 1.3 3.32c.16.2 2.24 3.42 5.44 4.8.76.32 1.36.52 1.82.68.76.24 1.46.2 2 .12.62-.1 1.9-.78 2.16-1.52.26-.74.26-1.38.18-1.52-.08-.14-.3-.22-.62-.38z" />
      </svg>
      <span className="hidden sm:inline">Contactanos</span>
    </a>
  );
}
