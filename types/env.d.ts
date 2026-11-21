declare namespace NodeJS {
  interface ProcessEnv {
    /** URL pública de la API. Nunca contiene secretos. */
    EXPO_PUBLIC_API_URL?: string;
  }
}
