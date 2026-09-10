import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("otaku_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export const imgUrl = (image) => {
  if (!image) return null;
  return image.startsWith("http") ? image : `${API}/files/${image}`;
};

export const fcfa = (n) => `${new Intl.NumberFormat("fr-FR").format(Number(n) || 0)} FCFA`;

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Une erreur est survenue. Réessayez.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
