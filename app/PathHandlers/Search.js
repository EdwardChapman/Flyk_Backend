const { query, body, validationResult } = require('express-validator');


var sql; // This will be populated when module is required.



const getSearchResultsValidation = [
    body('query').trim()
]


async function getSearchResults(req, res) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).json({errors: errors.array().map(({ msg }) => msg) }) }

    const QUERY = req.body.query

    if(QUERY == '') { return res.status(200).json([]) }

    try {

        const searchResults = await sql`
            SELECT 
                user_id, 
                username, 
                profile_bio,
                profile_img_filename, 
                EXISTS(SELECT * FROM follows WHERE follows.from_user_id = ${req.session.user_id?req.session.user_id:null} AND follows.to_user_id = user_id) AS is_followed_by_viewer
            FROM users
            WHERE username ILIKE ${QUERY + '%'}
            ORDER BY username <-> ${QUERY}
            LIMIT 30
        `
        searchResults.count = null
        searchResults.command = null
        console.log(searchResults)
        return res.status(200).json(searchResults)
    } catch (err) {
        return res.status(500).end()
    }
}




function passInDatabase(SQL) {
    sql = SQL
    return {
        getSearchResults, getSearchResultsValidation
    }
}

module.exports = passInDatabase