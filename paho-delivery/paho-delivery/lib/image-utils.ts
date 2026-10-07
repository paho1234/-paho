"use client";

/**
 * Comprime una imagen en el navegador (canvas) y la devuelve como data URL
 * base64 (ej: "data:image/jpeg;base64,...."), lista para guardar directo
 * en un documento de Firestore.
 *
 * Por qué esto en vez de subir a Firebase Storage: Storage ahora requiere
 * el plan Blaze (pago por uso, con tarjeta vinculada) para crear un
 * bucket nuevo. Firestore, en cambio, sigue funcionando en el plan
 * gratuito Spark. Comprimiendo la imagen lo suficiente (ancho máximo +
 * compresión JPEG), entra cómoda bajo el límite de 1MB por documento de
 * Firestore — para fotos de catálogo, la pérdida de calidad no se nota.
 *
 * Cuando en algún momento actives Storage (plan Blaze), lo natural es
 * volver al flujo anterior (subir el archivo real, guardar la URL) para
 * no pagar de más en lecturas/escrituras de Firestore con imágenes
 * pesadas adentro.
 */
export function comprimirImagenABase64(
  file: File,
  { anchoMaximo = 900, calidad = 0.72 }: { anchoMaximo?: number; calidad?: number } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const escala = Math.min(1, anchoMaximo / img.width);
      const ancho = Math.round(img.width * escala);
      const alto = Math.round(img.height * escala);

      const canvas = document.createElement("canvas");
      canvas.width = ancho;
      canvas.height = alto;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo procesar la imagen"));
        return;
      }
      ctx.drawImage(img, 0, 0, ancho, alto);

      const dataUrl = canvas.toDataURL("image/jpeg", calidad);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen"));
    };

    img.src = objectUrl;
  });
}
