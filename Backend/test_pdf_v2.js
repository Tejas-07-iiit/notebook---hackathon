const fs = require('fs');
const pdfLibrary = require('pdf-parse');
const PDFParse = pdfLibrary.PDFParse || pdfLibrary.default?.PDFParse || pdfLibrary;

console.log('PDFParse type:', typeof PDFParse);

// Mock buffer
const buffer = Buffer.from('%PDF-1.4\n%...');

try {
    const parser = new PDFParse({ data: buffer });
    console.log('Parser instantiated successfully');
    if (typeof parser.getText === 'function') {
        console.log('parser.getText is a function');
    }
} catch (e) {
    console.error('Error instantiating parser:', e);
}
