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

app.post('/upload', upload.array('image'), (req, res) => {
    const { name, description } = req.body;
    const images = req.files;

    console.log('upload:', name, description, images);

    if (!name || !description || !images) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const uploadDir = path.join(__dirname, 'uploads');

    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const targetPath = path.join(uploadDir, image.originalname);

        const readStream = fs.createReadStream(image.path);
        const writeStream = fs.createWriteStream(targetPath);

        readStream.on('error', (err) => {
            console.error('Error reading file:', err);
            res.status(500).json({ error: 'Error reading file' });
        });

        writeStream.on('error', (err) => {
            console.error('Error writing file:', err);
            res.status(500).json({ error: 'Error writing file' });
        });

        writeStream.on('finish', () => {
            console.log('File uploaded successfully');

            fs.unlink(image.path, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                }
            });
        });

        readStream.pipe(writeStream);
    }

    res.status(200).json({ message: 'Files uploaded successfully' });
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});