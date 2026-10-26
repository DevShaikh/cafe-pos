import axios from "axios";

const baseURL =
  typeof window === "undefined"
    ? process.env.SERVER_URL // server components / RSC → direct internal call
    : "/api"; // browser → Next.js proxy → internal server

export const apiClient = axios.create({
  baseURL,
  timeout: 10_000,
});
