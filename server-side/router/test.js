const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');

const app = express();

const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client.html'));
});
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'client.html'));
});


function writeImageFile(readStream, targetPath) {
    return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(targetPath);

        readStream.on('error', (err) => {
            console.error('Error reading file:', err);
            reject(err);
        });

        writeStream.on('error', (err) => {
            console.error('Error writing file:', err);
            reject(err);
        });

        writeStream.on('finish', () => {
            console.log('File uploaded successfully');
            resolve();
        });

        readStream.pipe(writeStream);
    });
}

async function processUpload(name, description, images) {
    if (!name || !description || !images) {
        throw new Error('Missing required fields');
    }

    const uploadDir = path.join(__dirname, 'uploads');

    try {
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const targetPath = path.join(uploadDir, image.originalname);

            const readStream = fs.createReadStream(image.path);
            await writeImageFile(readStream, targetPath);

            fs.unlink(image.path, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                }
            });
        }

        return { message: 'Files uploaded successfully' };
    } catch (err) {
        console.error('Error uploading files:', err);
        throw new Error('Error uploading files');
    }
}

app.post('/upload', upload.array('image'), async (req, res) => {
    const { name, description } = req.body;
    const images = req.files;

    console.log('upload:', name, description, images);

    try {
        const result = await processUpload(name, description, images);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


app.listen(3000, () => {
    console.log('Server started on port 3000');
});