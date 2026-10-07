"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseAuth, db } from "@/lib/firebase";
import type { Rol } from "@/lib/auth";

type AuthState = {
  user: User | null;
  rol: Rol | null;
  esAdmin: boolean;
  cargando: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  rol: null,
  esAdmin: false,
  cargando: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    rol: null,
    esAdmin: false,
    cargando: true,
  });

  useEffect(() => {
    const auth = getFirebaseAuth();
    let unsubPerfil: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Si había una escucha del perfil anterior activa, la cortamos.
      if (unsubPerfil) {
        unsubPerfil();
        unsubPerfil = null;
      }

      if (!user) {
        setState({ user: null, rol: null, esAdmin: false, cargando: false });
        return;
      }

      // Escucha en vivo (no lectura única): justo después de registrarse,
      // el documento usuarios/{uid} todavía puede no existir en el
      // instante en que Firebase Auth ya nos dio la sesión — con
      // onSnapshot, en cuanto ese documento se crea (un instante
      // después), el rol se actualiza solo, sin condición de carrera.
      //
      // `esAdmin` es un permiso APARTE de `rol` (comprador/vendedor):
      // así una cuenta puede seguir operando como vendedor y tener,
      // además, acceso al panel admin — no son excluyentes.
      unsubPerfil = onSnapshot(
        doc(db, "usuarios", user.uid),
        (snap) => {
          const rol = snap.exists() ? (snap.data().rol as Rol) : null;
          const esAdmin = snap.exists() ? snap.data().esAdmin === true : false;
          setState({ user, rol, esAdmin, cargando: false });
        },
        () => setState({ user, rol: null, esAdmin: false, cargando: false })
      );
    });

    return () => {
      unsubAuth();
      if (unsubPerfil) unsubPerfil();
    };
  }, []);

  return (
    <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
