import mammoth from "mammoth";
import { createRequire } from "module";

const require = createRequire(
    import.meta.url);
const pdfParse = require("pdf-parse");

export const parseResume = async(file) => {
    try {
        if (!file) {
            throw new Error("No file provided");
        }

        const isPdf = file.mimetype === "application/pdf" ||
            file.mimetype?.includes("pdf") ||
            file.originalname?.toLowerCase().endsWith(".pdf");

        const isDocx = file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.mimetype?.includes("word") ||
            file.mimetype?.includes("document") ||
            file.originalname?.toLowerCase().endsWith(".docx") ||
            file.originalname?.toLowerCase().endsWith(".doc");

        if (isPdf) {
            try {
                const data = await pdfParse(file.buffer);
                const text = data?.text?.trim();
                if (text && text.length >= 10) {
                    console.log("PDF text extraction successful");
                    return text;
                }
            } catch (pdfErr) {
                console.warn("PDF parse failed, trying DOCX fallback:", pdfErr.message);
            }
        }

        if (isDocx) {
            try {
                const result = await mammoth.extractRawText({
                    buffer: file.buffer,
                });
                const text = result?.value?.trim();
                if (text && text.length >= 10) {
                    console.log("DOCX text extraction successful");
                    return text;
                }
            } catch (docxErr) {
                console.warn("DOCX parse failed, trying PDF fallback:", docxErr.message);
            }
        }

        try {
            const data = await pdfParse(file.buffer);
            const text = data?.text?.trim();
            if (text && text.length >= 10) return text;
        } catch (_) {}

        try {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            const text = result?.value?.trim();
            if (text && text.length >= 10) return text;
        } catch (_) {}

        throw new Error("Unable to extract text from resume file");

    } catch (err) {
        console.error("PARSE ERROR:", err.message);
        throw new Error("Unable to read resume");
    }
};