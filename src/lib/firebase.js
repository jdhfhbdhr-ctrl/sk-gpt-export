import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAPQ8PVEqWUNOu3Ls6qEBu5CttDwW-Sll4",
  authDomain: "sk-gpt-chat.firebaseapp.com",
  projectId: "sk-gpt-chat",
  storageBucket: "sk-gpt-chat.firebasestorage.app",
  messagingSenderId: "1080565702725",
  appId: "1:1080565702725:web:585ec18089b2b283d3c32c",
  measurementId: "G-YWE7JCGR5F"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
