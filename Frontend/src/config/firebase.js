// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDVuUTo_UDXwg5irrQAdEq16dNjItKGScU",
  authDomain: "cloudcanvas-architect.firebaseapp.com",
  projectId: "cloudcanvas-architect",
  storageBucket: "cloudcanvas-architect.firebasestorage.app",
  messagingSenderId: "980712603764",
  appId: "1:980712603764:web:9e4c2eb2cd77ee55955121",
  measurementId: "G-Z0DBJ8ZT5X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
