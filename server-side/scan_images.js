const fs = require('fs');
const path = require('path');

const imgDir = 'public/img';
const images = [];

fs.readdir(imgDir, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }

    files.forEach(file => {
        const ext = path.extname(file);
        if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif') {
            images.push({
                url: `img/${file}`,
                alt: path.basename(file, ext)
            });
        }
    });

    fs.writeFile('images.json', JSON.stringify(images), err => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Images file generated successfully');
    });
});