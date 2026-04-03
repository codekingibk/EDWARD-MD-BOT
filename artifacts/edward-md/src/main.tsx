import { createRoot } from "react-dom/client";
import App from "./App";
import AdminApp from "./AdminApp";
import "./index.css";

const isAdmin = window.location.pathname.startsWith('/admin');

createRoot(document.getElementById("root")!).render(isAdmin ? <AdminApp /> : <App />);
