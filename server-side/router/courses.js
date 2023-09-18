// add courses post router
const db = require('../database/database');

async function addCoursesHandler(req, res) {
    const { name, description, price, duration } = req.body;
    const course = new Course({
        name,
        description,
        price,
        duration
    });

    console.log(course.name);
    console.log(course.description);
    console.log(course.price);
    console.log(course.duration);

    try {
        db.addCourse(course);
        res.status(201).json({ message: 'Course added successfully' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }

    

    


}


