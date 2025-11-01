const fs = require('fs');
const path = require('path');

// Create a sample 100MB file for testing
const dataDir = path.join(__dirname, '../data');
const filePath = path.join(dataDir, 'sample.bin');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Creating 100MB sample file...');

const fileSize = 100 * 1024 * 1024; // 100MB
const chunkSize = 1024 * 1024; // 1MB chunks
const stream = fs.createWriteStream(filePath);

let written = 0;

const writeChunk = () => {
    const remaining = fileSize - written;
    const size = Math.min(chunkSize, remaining);

    if (size > 0) {
        const buffer = Buffer.alloc(size);
        // Fill with random data
        for (let i = 0; i < size; i += 1) {
            buffer[i] = Math.floor(Math.random() * 256);
        }

        stream.write(buffer);
        written += size;

        const progress = ((written / fileSize) * 100).toFixed(2);
        process.stdout.write(`\rProgress: ${progress}%`);

        setImmediate(writeChunk);
    } else {
        stream.end();
        console.log('\nFile created successfully!');
        console.log(`Location: ${filePath}`);
        console.log(`Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    }
};

writeChunk();
