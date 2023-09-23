const path = require('path');
const fs = require('fs');


const {
    rootPath,
    htmlPath,
    publicPath,
    imgPath,
    uploadPath,
    routerPath,
    commonPath,
    databasePath,
    configPath,
    cronPath,
    serveStaticDirectories,
    appConfig
} = require('./app_config');

const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imgPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });
const db = require(path.join(databasePath, 'database'));

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

async function processUpload(name, description, image) {
    if (!name || !description || !image) {
        throw new Error('Missing required fields');
    }

    const uploadDir = path.join(publicPath, 'uploads');

    try {
            const targetPath = path.join(uploadDir, image.originalname);

            const readStream = fs.createReadStream(image.path);
            await writeImageFile(readStream, targetPath);

            fs.unlink(image.path, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                }
            });

        return { message: 'File uploaded successfully' };
    } catch (err) {
        console.error('Error uploading file:', err);
        throw new Error('Error uploading file');
    }
}

function addCourse( name, description, author, image) {

    return new Promise((resolve, reject) => {
        db.addCourse(name, description, author, image)
            .then(result => {
                resolve(result);
            })
            .catch(error => {
                reject(error);
            });
    });
}

const addCourseRouter = require('express').Router();

addCourseRouter.post('/a000', upload.single('image'), (req, res) => {
    console.log('addCourseRouter.post begin ... ');
    const { name, description, author } = req.body;
    const image = req.file;

    console.log('addCourse:', name, description, author, image);

    if (!name || !description || !author || !image) {
        console.log('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // store image file into local file system
    processUpload(name, description, image)
        .then(result => {
            console.log('File uploaded successfully');
        })
        .catch(error => {
            console.error('Error uploading file:', error.error_message);
            return res.status(500).json({error: error.error_message});
        }); 

    // write course info into database
    addCourse(name, description, author, image.originalname)
        .then(result => {
            console.log('Course added:', result);
            return res.json({'Success': 'add course successfully'});
        })
        .catch(error => {
            console.error('Error adding course:', error.error_message);
            return res.status(500).json({error: error.error_message});
        });
});

module.exports = {
    addCourseRouter
};
