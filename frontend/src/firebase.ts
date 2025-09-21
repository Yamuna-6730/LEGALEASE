// Replace envs with your Firebase project's config
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY || "",
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FB_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FB_APP_ID || "",
  measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID || undefined,
};

export async function initFirebase() {
  const { initializeApp } = await import("firebase/app");
  const app = initializeApp(firebaseConfig);
  if (typeof window !== "undefined" && firebaseConfig.measurementId) {
    try {
      const { getAnalytics, isSupported } = await import("firebase/analytics");
      if (await isSupported()) getAnalytics(app);
    } catch (_e) {
      // ignore analytics errors in dev
    }
  }
  return app;
}
