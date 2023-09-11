const fs = require("fs");
const path = require("path");

const largeFolderPath = "./public/1920x1200";
const smallFolderPath = "./public/240x320";
const images = [];

// Scan large folder
fs.readdir(largeFolderPath, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }

    files.forEach((file) => {
        const largeUrl = path.join(largeFolderPath, file);
        const smallUrl = path.join(smallFolderPath, file.replace("_1920x1200.jpg", "_240x320.jpg"));
        const dateRegex = /(\d{4}-\d{2}-\d{2})/;
        const dateMatch = file.match(dateRegex);
        const date = dateMatch ? dateMatch[1] : "";
        const image = { date, smallUrl, largeUrl };
        images.push(image);
    });

    // Write images.json file
    const imagesJson = JSON.stringify(images, null, 2);
    fs.writeFile("images.json", imagesJson, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("images.json file created successfully!");
    });
});