import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const raiz = resolve(import.meta.dirname, "../..");
const leer = (ruta) => readFileSync(resolve(raiz, ruta), "utf8");
const agentes = leer("AGENTS.md");
const reglas = leer("ia/reglas-ia.md");
const gitignore = leer(".gitignore");
const evidencias = leer("ia/evidencias.md");

const verificaciones = [
  ["reglas locales presentes", agentes.includes("fuera de la raíz de este repositorio")],
  [
    "archivos de entorno protegidos",
    agentes.includes("Nunca leas") && gitignore.includes(".env*"),
  ],
  ["secretos del cliente prohibidos", reglas.includes("EXPO_PUBLIC_")],
  ["publicación requiere autorización", agentes.includes("autorización explícita")],
  [
    "evidencia de demostración documentada",
    evidencias.includes("Demostraciones manuales"),
  ],
];

const fallidas = verificaciones.filter(([, correcta]) => !correcta);
for (const [nombre, correcta] of verificaciones) {
  process.stdout.write(`${correcta ? "OK" : "FALLO"}: ${nombre}\n`);
}

if (fallidas.length > 0) {
  process.exitCode = 1;
}
