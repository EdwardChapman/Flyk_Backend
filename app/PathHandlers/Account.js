const { query, body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt'); 
const saltRounds = 12; // SaltRounds for bcrypt ~12 is good for now... can increase later

var sql; // This will be populated when module is required.

const loginValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Invalid Email')
        .normalizeEmail()
        .escape(),
    body('password')
        .isLength({ min: 7, max: 128 })
    // body('password').isLength({ min: 8 }).matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/).escape(), //dont need b/c hash?
]

async function login(req, res) {
    //TODO: eventually this needs to handle many login options. Such as Login with apple / phonenumber / username .....
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).json({errors: errors.array().map(({ msg }) => msg) }) }
    const EMAIL = req.body.email;
    const PASSWORD = req.body.password;

    /* Fetch Account Provided Email (or none if DNE) */
    try{
        var [existing_user] = await sql`
            SELECT 
                user_id, 
                password 
            FROM USERS 
            WHERE email = ${EMAIL}
            LIMIT 1
        `

        if (!existing_user 
            || !existing_user.password) // We check if password exists b/c it can be null in database and null == null could allow access to account
            { return res.status(400).json({ errors: ["Incorrect email or password"] }) }
    } catch (err) {
        console.error(err)
        return res.status(500).end()
    }

    /* Compare fetched password with provided password */
    try{
        const correct = await bcrypt.compare(PASSWORD, existing_user.password)
        if (!correct) { return res.status(400).json({ errors: ["Incorrect email or password"] }) }
        req.session.user_id = existing_user.user_id
        res.status(200).json({user_id: existing_user.user_id})
    }catch(err){
        console.error(err)
        return res.status(500).end()
    }
}


function logout(req, res) {
    //TODO: Should check if user is tmp here b/c destroying tmp user makes it unreachable 
    req.session.destroy((err) => {
        if (err) { console.error(err); return res.status(500).end() }
        return res.status(200).end();
    });
}



function passInDatabase(SQL) {
    sql = SQL
    return { login, loginValidation, logout}
}

module.exports = passInDatabase