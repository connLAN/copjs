const fs = require('fs');


function copyFile(source, target) {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(source);
        const writeStream = fs.createWriteStream(target);

        readStream.on('error', reject);
        writeStream.on('error', reject);

        readStream.on('close', () => {
            resolve();
        });

        readStream.pipe(writeStream);
    });
}


const source = 'snow.jpg';
const target = 'snow-copy.jpg';

copyFile(source, target)
    .then(() => {
        console.log('File copied successfully');
    })
    .catch((err) => {
        console.error('Error copying file:', err);
    });
