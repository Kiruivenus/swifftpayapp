
import fs from 'fs';
import path from 'path';

function findFiles(dir, filter, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const fileStat = fs.lstatSync(filePath);
        if (fileStat.isDirectory()) {
            findFiles(filePath, filter, fileList);
        } else if (filter.test(filePath)) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const apiDir = 'd:/Users/patri/AndroidStudioProjects/jijenge2/swiftpay-ke/src/app/api';
const routeFiles = findFiles(apiDir, /route\.ts$/);

const problematicFiles = [];

routeFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Regex to find: (params: { something: string }) but not (params: Promise<{ something: string }>)
    // This is a bit rough but should catch most cases.
    if (content.includes('params: {') && !content.includes('params: Promise<{')) {
        problematicFiles.push(file);
    }
});

console.log('Problematic files found:');
problematicFiles.forEach(f => console.log(f));
