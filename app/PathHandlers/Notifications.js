var sql; // This will be populated when module is required.


async function getNotifications(req, res) {
    if(!req.session.user_id){return res.status(401).end()}
    return res.json([]) //This returns nothign
    return res.json([
        { message: "Notification 1" },
        { message: "Notification 2" },
        { message: "Notification 3" },
        { message: "Notification 4" },
        { message: "Notification 5" }
    ])


    try{
        //TODO: Learn how to do paging requests
        //TODO: CREATE NOTIFICATIONS TABLE......
        var notifications = await sql`
            SELECT * FROM notifications 
            WHERE user_id = ${req.session.user_id}
            RETURNING //IMPLEMENT: this
        `
    } catch (err) {
        console.error(err)
        return res.status(500).end()
    }
}


function passInDatabase(SQL) {
    sql = SQL
    return getNotifications
}

module.exports = passInDatabase