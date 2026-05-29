// lib/apiClient.ts

// 1. Pastikan BASE_URL selalu diakhiri dengan SATU garis miring "/"
const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "") + "/";

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  if (typeof window === "undefined") return fetch(endpoint, options);

  let accessToken = localStorage.getItem("access_token");

  // Siapkan Header
  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // 2. Pastikan endpoint TIDAK diawali dengan garis miring "/"
  // Apapun yang Anda ketik ("wallet/v1" atau "/wallet/v1") akan aman.
  const cleanEndpoint = endpoint.replace(/^\/+/, "");
  
  // 3. Gabungkan URL
  const url = `${BASE_URL}${cleanEndpoint}`;

  // Jalankan Request Pertama
  let response = await fetch(url, { ...options, headers });

  // Mekanisme Refresh Token
  if (response.status === 401) {
    console.warn("Token expired, mencoba refresh token...");
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      handleForceLogout();
      return response;
    }

    try {
      const refreshPayload = JSON.stringify({ refresh_token: refreshToken });
      
      // Karena BASE_URL pasti diakhiri "/", kita langsung sambung teksnya
      const refreshUrl = `${BASE_URL}auth/v1/refresh`; 
      
      const refreshResponse = await fetch(refreshUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: refreshPayload,
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const newAccessToken = data?.data?.access_token || data?.access_token;
        const newRefreshToken = data?.data?.refresh_token || data?.refresh_token;
        
        if (newAccessToken) {
          localStorage.setItem("access_token", newAccessToken);
          if (newRefreshToken) localStorage.setItem("refresh_token", newRefreshToken);

          // Ulangi Request Asli
          headers.set("Authorization", `Bearer ${newAccessToken}`);
          response = await fetch(url, { ...options, headers });
        } else {
          handleForceLogout();
        }
      } else {
        handleForceLogout();
      }
    } catch (error) {
      handleForceLogout();
    }
  }

  return response;
};

// Fungsi Logout Paksa
const handleForceLogout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};