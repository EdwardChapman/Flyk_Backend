const { query, body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt'); const saltRounds = 12; //Password Hashing
const crypto = require('crypto')

var sql;

const createAccountValidation = [
    body('email')
        .trim()
        .isEmail().withMessage('Invalid Email')
        .normalizeEmail()
        .escape(),
    body('password')
        .isLength({ min: 8}).withMessage("Password must be at least 8 characters long and include one or more special characters"),
        // .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{7,}$/)
        // .withMessage('Password must be 8+ characters and include -- ?? --'), //TODO: FINISH THIS
        // .escape(), //Removed escape on this b/c password will be hashed

    body('birthdate').isDate().withMessage('Invalid Birthdate')
]

async function createAccount(req, res) {
    //TODO: eventually this needs to handle many login options. Such as Login with apple / phonenumber / username .....
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).json({errors: errors.array().map(({ msg }) => msg) }) }
    const EMAIL = req.body.email;
    const PASSWORD = req.body.password;
    const BIRTHDATE = req.body.birthdate;

    try { var hash = await bcrypt.hash(PASSWORD, saltRounds); } catch (err) { console.error(err); return res.status(500).end() }


    /* Check if email is already in use */
    try {
        const [existing_user] = await sql`
            SELECT * FROM USERS 
            WHERE email = ${EMAIL}
            LIMIT 1
        `
        if (existing_user) { return res.status(400).json({ errors: ["Email already in use"] }) }
    } catch (err) {
        console.error(err)
        return res.status(500).end()
    }


    /* Insert new account with provided info */
    try {
        const [inserted_user] = await sql`
            INSERT INTO users (
                user_id, username, email, password, birthdate
            ) values (
                ${ uuidv4()},
                ${ (EMAIL.split('@')[0].slice(0, 15) + crypto.randomBytes(2).readUInt16BE()).replace(/[^a-z0-9._]/g, '')},
                ${ EMAIL},
                ${ hash},
                ${ BIRTHDATE}
            )
            RETURNING user_id
        `
        req.session.user_id = inserted_user.user_id //TODO: Might need to save here to avoid race between next request and this saving
        res.status(200).json({user_id: inserted_user.user_id})
    } catch (err) {
        console.error(err)
        return res.status(500).end()
    }
}





function passInDatabase(SQL) {
    sql = SQL
    return { createAccount, createAccountValidation}
}

module.exports = passInDatabase