#!/usr/bin/env node

const fs = require("fs");

class UniqueInt {

    processFile(inputFilePath, outputFilePath) {

        const startTime = Date.now();

        const MIN = -1023;
        const MAX = 1023;
        const OFFSET = 1023;
        const SIZE = MAX - MIN + 1;

        let seen = new Array(SIZE);

        for (let i = 0; i < SIZE; i++) {
            seen[i] = false;
        }

        const data = fs.readFileSync(inputFilePath, "utf8");
        const lines = data.split("\n");

        for (let line of lines) {

            let text = line.trim();

            if (text === "") continue;

            let parts = text.split(/\s+/);

            if (parts.length !== 1) continue;

            if (!this.isInteger(parts[0])) continue;

            let number = parseInt(parts[0]);

            if (number < MIN || number > MAX) continue;

            let index = number + OFFSET;

            seen[index] = true;
        }

        let result = "";

        for (let i = 0; i < SIZE; i++) {

            if (seen[i]) {

                let number = i - OFFSET;

                result += number + "\n";
            }
        }

        fs.writeFileSync(outputFilePath, result);

        const endTime = Date.now();

        console.log("Runtime:", (endTime - startTime), "ms");
        console.log("Memory Used:", process.memoryUsage().heapUsed, "bytes");
    }

    isInteger(value) {

        let start = 0;

        if (value[0] === "-") {
            if (value.length === 1) return false;
            start = 1;
        }

        for (let i = start; i < value.length; i++) {

            if (value[i] < "0" || value[i] > "9") {
                return false;
            }

        }

        return true;
    }
}

const args = process.argv;

if (args.length < 4) {

    console.log("Usage: ./UniqueInt.js inputfile outputfile");
    process.exit(1);

}

const inputFile = args[2];
const outputFile = args[3];

const app = new UniqueInt();

app.processFile(inputFile, outputFile);
