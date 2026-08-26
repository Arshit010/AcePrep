import axios from "axios";



const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL + "/api",
    withCredentials: true,
    headers: {
        "X-AcePrep-Client": "1",
    },
});



API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});



export const getMyResumes = () => API.get("/resume/my");

export const uploadResume = (file) => {
    const formData = new FormData();
    formData.append("resume", file);

    return API.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

export const deleteResume = (id) => API.delete(`/resume/${id}`);