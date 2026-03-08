#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// ------------------------
// Node & Linked List
// ------------------------
class Node {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

class UniqueInt {

    constructor() {
        this.head = null;
    }

    insertSorted(value) {
        if (this.head === null) {
            this.head = new Node(value);
            return;
        }

        if (value === this.head.value) return;

        if (value < this.head.value) {
            const newNode = new Node(value);
            newNode.next = this.head;
            this.head = newNode;
            return;
        }

        let current = this.head;
        while (current.next !== null && current.next.value < value) {
            current = current.next;
        }

        if (current.next !== null && current.next.value === value) return;

        const newNode = new Node(value);
        newNode.next = current.next;
        current.next = newNode;
    }

    processFile(inputFile, outputFile) {
        const startTime = Date.now();

        this.head = null; // Reset linked list for each file

        const data = fs.readFileSync(inputFile, "utf8");
        const lines = data.split("\n");

        for (let line of lines) {
            const text = line.trim();
            if (text === "") continue;
            if (!/^[-]?\d+$/.test(text)) continue;
            const num = parseInt(text);
            this.insertSorted(num);
        }

        let result = "";
        let current = this.head;
        while (current !== null) {
            result += current.value + "\n";
            current = current.next;
        }

        fs.writeFileSync(outputFile, result);

        const endTime = Date.now();
        console.log(`Processed: ${inputFile} -> ${outputFile}`);
        console.log("Runtime:", endTime - startTime, "ms");
        console.log("Memory Used:", process.memoryUsage().heapUsed, "bytes");
    }
}

// ------------------------
// Helper: avoid overwriting files
// ------------------------
function getUniqueOutputPath(baseFolder, baseName) {
    let outputPath = path.join(baseFolder, baseName);
    let counter = 1;
    const ext = path.extname(baseName);
    const name = path.basename(baseName, ext);

    while (fs.existsSync(outputPath)) {
        outputPath = path.join(baseFolder, `${name}_${counter}${ext}`);
        counter++;
    }

    return outputPath;
}

// ------------------------
// Main: Single or Batch Mode
// ------------------------
const args = process.argv.slice(2);
if (args.length < 1) {
    console.log("Usage: node UniqueInt.js <inputFileOrFolder> [outputFile]");
    process.exit(1);
}

// Results folder directly under hw01
const resultsFolder = path.join(__dirname, ".."); // points to hw01
const resultsPath = path.join(resultsFolder, "results"); // hw01/results
if (!fs.existsSync(resultsPath)) fs.mkdirSync(resultsPath);

const app = new UniqueInt();
const inputPath = args[0];

if (fs.existsSync(inputPath) && fs.lstatSync(inputPath).isDirectory()) {
    // Batch mode
    const files = fs.readdirSync(inputPath).filter(f => f.endsWith(".txt"));
    files.forEach(file => {
        const fullInput = path.join(inputPath, file);
        const outputFile = getUniqueOutputPath(resultsPath, "out_" + file);
        app.processFile(fullInput, outputFile);
    });
} else if (fs.existsSync(inputPath) && fs.lstatSync(inputPath).isFile()) {
    // Single file mode
    const outputFile = getUniqueOutputPath(resultsPath, args[1] || "out.txt");
    app.processFile(inputPath, outputFile);
} else {
    console.log("Input path does not exist!");
}
