declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AI_API_KEY: string;
      PORT: string;
    }
  }
}

export {}; 