import axios from "axios";

const baseURL =
    import.meta?.env?.VITE_API_URL ?
    `${import.meta.env.VITE_API_URL}/api` :
    "http://localhost:5001/api";

const TOKEN_KEYS = {
    access: "aceprep_at",
    refresh: "aceprep_rt",
};

function getStoredToken(key) {
    try { return localStorage.getItem(key); } catch { return null; }
}

function setStoredToken(key, value) {
    try {
        if (value) localStorage.setItem(key, value);
        else localStorage.removeItem(key);
    } catch {}
}

function clearStoredTokens() {
    try {
        localStorage.removeItem(TOKEN_KEYS.access);
        localStorage.removeItem(TOKEN_KEYS.refresh);
    } catch {}
}

const API = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 60000,
    headers: {
        "X-AcePrep-Client": "1",
    },
});

let isRefreshing = false;
let failedQueue = [];
let isLoggedOut = false;

export const resetLogoutState = () => {
    isLoggedOut = false;
};

function triggerLogout(reason = "Session expired") {
    console.warn("\u{1F512} Logout:", reason);

    isLoggedOut = true;

    clearStoredTokens();
    sessionStorage.clear();
    window.dispatchEvent(new Event("auth-logout"));
}

const processQueue = (error) => {
    failedQueue.forEach((prom) => {
        error ? prom.reject(error) : prom.resolve();
    });
    failedQueue = [];
};

API.interceptors.request.use((config) => {
    const token = getStoredToken(TOKEN_KEYS.access);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

API.interceptors.response.use(
    (response) => {
        const data = response.data;
        const url = response.config?.url || "";

        if (data && typeof data === "object") {
            if (data.accessToken) {
                setStoredToken(TOKEN_KEYS.access, data.accessToken);
            }
            if (data.refreshToken) {
                setStoredToken(TOKEN_KEYS.refresh, data.refreshToken);
            }
        }

        const headerAccessToken = response.headers["x-access-token"];
        if (headerAccessToken) {
            setStoredToken(TOKEN_KEYS.access, headerAccessToken);
        }

        if (url.includes("/auth/login") || url.includes("/auth/verify-otp")) {
            isLoggedOut = false;
        }

        if (url.includes("/auth/logout")) {
            clearStoredTokens();
        }

        return response;
    },

    async(error) => {
        const originalRequest = error.config;

        if (!error.response)
            return Promise.reject(error);

        const url = originalRequest?.url || "";

        if (
            url.includes("/auth/login") ||
            url.includes("/auth/register") ||
            url.includes("/auth/verify-otp") ||
            url.includes("/auth/resend-otp") ||
            url.includes("/auth/refresh") ||
            url.includes("/auth/logout") ||
            url.includes("/auth/forgot-password") ||
            url.includes("/auth/reset")
        ) {
            return Promise.reject(error);
        }

        if (error.response.status === 429) {
            const data = error.response.data || {};
            const retryAfter = data.retryAfter || error.response.headers["retry-after"];
            const friendlyMessage =
                data.message ||
                "You're sending requests too quickly. Please wait a moment and try again.";

            const customErr = new Error(friendlyMessage);
            customErr.status = 429;
            customErr.retryAfter = retryAfter ? Number(retryAfter) : 60;
            customErr.response = error.response;
            return Promise.reject(customErr);
        }

        if (
            error.response.status === 401 &&
            !originalRequest._retry &&
            !isLoggedOut
        ) {
            const storedRefresh = getStoredToken(TOKEN_KEYS.refresh);
            if (!storedRefresh) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => API(originalRequest));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await API.post("/auth/refresh", null, {
                    headers: { "X-Refresh-Token": storedRefresh },
                });

                processQueue(null);
                return API(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError);
                triggerLogout("Session expired");
                return Promise.reject(refreshError);

            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default API;
