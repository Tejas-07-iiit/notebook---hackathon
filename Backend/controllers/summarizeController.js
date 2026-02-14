const OpenAI = require("openai");
const Note = require("../Models/Note.model");
const fs = require("fs");
const path = require("path");
// const pdf = require("pdf-parse"); // access locally to handle version differences

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

            // Check if it's a file path or URL
            // Assuming locally stored files in 'uploads/' based on common patterns
            // If fileUrl is a full URL, we might need axios to download it.
            // Based on typical multer usage, it might be a relative path or filename.
            console.log(note)
            let filePath = note.fileUrl;

            // If content is stored locally in uploads directory
            if (!filePath.startsWith("http") && !path.isAbsolute(filePath)) {
                // Try to resolve relative to root of backend
                // fileUrl usually stored as "/uploads/filename.pdf" or "uploads/filename.pdf"
                let relativePath = filePath;
                if (relativePath.startsWith('/')) {
                    relativePath = relativePath.substring(1); // Remove leading slash
                }

                // Construct absolute path: __dirname is 'controllers', so we go up one level to 'Backend'
                filePath = path.join(__dirname, "..", relativePath);
            } else if (filePath.startsWith('/') && !fs.existsSync(filePath)) {
                // Handle case where path is stored as "/uploads/..." but treated as absolute by path.isAbsolute on Linux
                // This block catches paths that start with / but don't exist at the root level
                let relativePath = filePath.substring(1);
                filePath = path.join(__dirname, "..", relativePath);
            }

            console.log(`Processing file: ${filePath}`);
            console.log(`Original fileUrl: ${note.fileUrl}`);
            console.log(`Resolved absolute path: ${path.resolve(filePath)}`);
            const ext = path.extname(filePath).toLowerCase();

            if (fs.existsSync(filePath)) {
                if (ext === '.pdf') {
                    const dataBuffer = fs.readFileSync(filePath);

                    // pdf-parse v2.4.5 usage
                    // It exports an object with PDFParse class
                    const pdfLibrary = require("pdf-parse");
                    const PDFParse = pdfLibrary.PDFParse || pdfLibrary.default?.PDFParse || pdfLibrary;

                    if (typeof PDFParse !== 'function' && typeof PDFParse !== 'object') {
                        console.error('Invalid pdf-parse library export:', pdfLibrary);
                        throw new Error('Internal Server Error: pdf-parse library failed to load.');
                    }

                    // Check if it's the class (v2) or function (v1 fallback/compatibility)
                    // The class constructor usually requires "new"
                    let notesText = "";

                    try {
                        // Try v2 API: new PDFParse({ data: buffer })
                        // We check if it is a class/constructor by trying to instantiate it
                        // or checking prototype. But safer to just try/catch if uncertain, 
                        // however README says v2 is: const { PDFParse } = require('pdf-parse'); 
                        // MY debug output showed: PDFParse: [class (anonymous)]

                        const parser = new PDFParse({ data: dataBuffer });
                        const result = await parser.getText();
                        notesText = result.text;
                        if (parser.destroy) await parser.destroy();

                    } catch (e) {
                        console.warn("Class-based instantiation failed, trying legacy function call...", e);
                        // Fallback to v1 style if for some reason it's a function
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
                } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
                    // Image Summarization Disabled: Models are decommissioned
                    console.log(`Skipping image file: ${ext}`);
                    return res.status(200).json({ summary: "Image summarization is currently unavailable as the vision models have been decommissioned." });

                }
            } else {
                console.warn(`File not found at path: ${filePath}`);
                return res.status(404).json({ message: "Note file not found on server" });
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

        const response = await client.chat.completions.create({
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

        const summary = response.choices[0]?.message?.content || "No summary generated.";
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