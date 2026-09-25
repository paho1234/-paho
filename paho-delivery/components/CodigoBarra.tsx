"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export default function CodigoBarra({
  valor,
  width = 1.6,
  height = 45,
}: {
  valor: string;
  width?: number;
  height?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    JsBarcode(ref.current, valor, {
      format: "CODE128",
      width,
      height,
      fontSize: 11,
      margin: 4,
      background: "transparent",
      lineColor: "#1B2A3D",
    });
  }, [valor, width, height]);

  return <svg ref={ref} />;
}
