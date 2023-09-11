// script to show dashboard, and to handle dashboard requests


async function getUserPageContent(user) {
    const role = user.role;
    const validRoles = ['publisher', 'viewer', 'buyer'];
    if (!validRoles.includes(role)) {
        // Invalid role
        res.status(400).send('Invalid role');
    }
    const pageContent = await this.getPageContentFromDatabase(role);
    return pageContent;
}

async function getRolePageContentFromDatabase(role) {
    const pageContent = await this.database.getPageContent(role);
    return pageContent;
}


module.exports = {
    getUserPageContent,
    getRolePageContentFromDatabase
};




