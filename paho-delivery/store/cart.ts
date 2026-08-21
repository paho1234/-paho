import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Producto, Envio } from "@/lib/firestore";

export type ItemCarrito = {
  id: string;
  titulo: string;
  precio: number;
  vendedor: string;
  vendedorId: string;
  cantidad: number;
  envio: Envio;
};

type CartState = {
  items: ItemCarrito[];
  agregar: (producto: Producto, cantidad?: number) => void;
  quitar: (id: string) => void;
  actualizarCantidad: (id: string, cantidad: number) => void;
  vaciar: () => void;
  total: () => number;
  cantidadTotal: () => number;
  /** Métodos de entrega disponibles para TODOS los productos del carrito a la vez. */
  metodosDisponibles: () => { retiro: boolean; envioDomicilio: boolean };
  /** Suma de costoEnvio de cada línea distinta (una vez por producto, no por unidad). */
  costoEnvioTotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      agregar: (producto, cantidad = 1) => {
        const items = get().items;
        const existente = items.find((i) => i.id === producto.id);
        if (existente) {
          set({
            items: items.map((i) =>
              i.id === producto.id
                ? { ...i, cantidad: i.cantidad + cantidad }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                id: producto.id,
                titulo: producto.titulo,
                precio: producto.precio,
                vendedor: producto.vendedor,
                vendedorId: producto.vendedorId,
                cantidad,
                envio: producto.envio,
              },
            ],
          });
        }
      },

      quitar: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

      actualizarCantidad: (id, cantidad) => {
        if (cantidad <= 0) {
          get().quitar(id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, cantidad } : i
          ),
        });
      },

      vaciar: () => set({ items: [] }),

      total: () =>
        get().items.reduce((acc, i) => acc + i.precio * i.cantidad, 0),

      cantidadTotal: () =>
        get().items.reduce((acc, i) => acc + i.cantidad, 0),

      metodosDisponibles: () => {
        const items = get().items;
        if (items.length === 0) return { retiro: true, envioDomicilio: true };
        return {
          retiro: items.every((i) => i.envio.retiro),
          envioDomicilio: items.every((i) => i.envio.envioDomicilio),
        };
      },

      // El carrito ya está restringido a un solo vendedor, así que el
      // costo de envío es UNA tarifa fija (la del vendedor), no una suma
      // por producto. Tomamos el máximo declarado entre los ítems como
      // salvaguarda por si alguna publicación quedó con un valor
      // desactualizado — en el caso normal, todas comparten el mismo.
      costoEnvioTotal: () =>
        Math.max(0, ...get().items.map((i) => i.envio.costoEnvio ?? 0)),
    }),
    { name: "paho-carrito" }
  )
);
