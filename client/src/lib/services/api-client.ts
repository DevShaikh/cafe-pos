import axios from "axios";

const baseURL =
  typeof window === "undefined"
    ? `${process.env.SERVER_URL}/api` // server components → internal server
    : "/api"; // browser → Next.js proxy

export const apiClient = axios.create({
  baseURL,
  timeout: 10_000,
  headers: {
    Accept: "application/json",
  },
});
