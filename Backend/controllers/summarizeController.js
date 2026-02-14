const OpenAI = require("openai");
const Note = require("../Models/Note.model");
const axios = require("axios");

const summarizeNotes = async (req, res) => {
    try {
        let { notes, noteId } = req.body;

        // If noteId is provided, fetch the note and extract text from PDF
        if (noteId) {
            console.log(`Fetching note with ID: ${noteId}`);
            const note = await Note.findById(noteId);

            if (!note) {
                return res.status(404).json({ message: "Note not found" });
            }

            console.log(`Processing file URL: ${note.fileUrl}`);
            const fileUrl = note.fileUrl; // This is now a Cloudinary URL

            try {
                // Fetch the file content from Cloudinary
                console.log("Fetching file from Cloudinary...");
                const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
                const dataBuffer = Buffer.from(response.data);

                // Determine extension from URL if possible, or content-type
                // Cloudinary URLs usually have extension. 
                const isPdf = fileUrl.toLowerCase().endsWith('.pdf') || response.headers['content-type'] === 'application/pdf';

                if (isPdf) {
                    // pdf-parse usage
                    const pdfLibrary = require("pdf-parse");
                    const PDFParse = pdfLibrary.PDFParse || pdfLibrary.default?.PDFParse || pdfLibrary;

                    let notesText = "";

                    try {
                        const parser = new PDFParse({ data: dataBuffer });
                        const result = await parser.getText();
                        notesText = result.text;
                        if (parser.destroy) await parser.destroy();
                    } catch (e) {
                        console.warn("Class-based instantiation failed, trying legacy function call...", e);
                        if (typeof PDFParse === 'function') {
                            const data = await PDFParse(dataBuffer);
                            notesText = data.text;
                        } else {
                            throw e;
                        }
                    }

                    notes = notesText;
                    console.log(`Extracted ${notes.length} characters from PDF`);

                    if (!notes || notes.trim().length === 0) {
                        return res.status(400).json({ message: "Could not extract text from this PDF. It might be an image-only PDF." });
                    }
                } else {
                    // Assume image or other format
                    console.log("Skipping non-PDF file for summarization");
                    return res.status(200).json({ summary: "Image summarization is currently unavailable as the vision models have been decommissioned." });
                }

            } catch (err) {
                console.error("Error fetching or processing file from Cloudinary:", err.message);
                return res.status(500).json({ message: "Error processing file for summarization", error: err.message });
            }
        }

        if (!notes) {
            return res.status(400).json({ message: "Notes content is required" });
        }

        console.log("Summarize request received");

        if (!process.env.GROQ_API_KEY) {
            console.error("Error: GROQ_API_KEY is not defined in environment variables");
            return res.status(500).json({
                message: "Server configuration error",
                error: "API Key is missing. Please add GROQ_API_KEY to .env file."
            });
        }

        const client = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1",
        });

        // Truncate notes if too long
        const maxLength = 25000;
        const truncatedNotes = notes.length > maxLength ? notes.substring(0, maxLength) + "...[truncated]" : notes;

        const chatResponse = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that summarizes notes concise and clearly. Structure the summary with bullet points and key headings.",
                },
                {
                    role: "user",
                    content: `Please summarize the following notes:\n\n${truncatedNotes}`,
                },
            ],
        });

        const summary = chatResponse.choices[0]?.message?.content || "No summary generated.";
        console.log("Summary generated successfully");

        res.status(200).json({ summary });
    } catch (error) {
        console.error("Error summarizing notes details:", error);

        // Check for specific OpenAI/Groq errors
        if (error.response) {
            console.error("API Response Data:", error.response.data);
            console.error("API Response Status:", error.response.status);
        }

        res.status(500).json({
            message: "Error generating summary",
            error: error.message
        });
    }
};

module.exports = { summarizeNotes };