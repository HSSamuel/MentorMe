import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider, useAuth } from "./contexts/AuthContext"; // Import useAuth
import "./index.css";

// This new component will act as a bridge between the AuthContext and the App component.
const AppWithAuth = () => {
  // We will add `appKey` to our AuthContext to trigger remounts.
  const { appKey } = useAuth();
  return <App key={appKey} />;
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        <AppWithAuth />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
