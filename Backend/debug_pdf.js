const pdf = require('pdf-parse');
console.log('--- PDF Parse Debug ---');
console.log('Type:', typeof pdf);
console.log('Value:', pdf);
console.log('Keys:', Object.keys(pdf));
if (typeof pdf === 'object') {
    console.log('Is Default a function?', typeof pdf.default === 'function');
}
console.log('-----------------------');
