const path = require('path');


const {
    rootPath,
    htmlPath,
    publicPath,
    imgPath,
    routerPath,
    commonPath,
    databasePath,
    configPath,
    cronPath,
    serveStaticDirectories,
    appConfig
  } = require('./app_config');
const config = appConfig;

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



const courseRouter = require(path.join(routerPath, 'courses'));

function handleAddCourse(req, res) {
    const { name, description, author } = req.body;
    const image = req.file;

    console.log('addCourse:', name, description, author, image);

    if (!name || !description || !author || !image) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const course = {
        name,
        description,
        author,
        image: {
            data: fs.readFileSync(image.path),
            contentType: image.mimetype
        }
    };

    courseRouter.addCourseHandler(course, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.status(200).json({ message: 'Course added successfully' });
    });
}

module.exports = {
    handleAddCourse
};
