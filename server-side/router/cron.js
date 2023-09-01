const cron = require('node-cron');

async function deleteRecords() {
    try {
        // Delete email verification records
        await db.timeout_delete_email_verification();
        console.log('Delete email verification records');

        // Delete remember me records
        await db.timeout_delete_remember_me();
        console.log('Delete remember me records');
    } catch (error) {
        console.error(error);
        // Handle error
    }
}

// Schedule a cron job to delete unverified users and email verification records, '0 0 * * *' means every day at 00:00
cron.schedule('0 0 * * *', deleteRecords);