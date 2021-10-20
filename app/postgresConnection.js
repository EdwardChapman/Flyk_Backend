const { v4: uuidv4 } = require('uuid');
const postgres = require('postgres')
const fs = require('fs')


var pgOptions = {
    host: '35.188.104.101',         // Postgres ip address or domain name
    port: 5432,       // Postgres server port
    path: '',         // unix socket path (usually '/tmp')
    database: 'postgres',         // Name of database to connect to
    ssl: {
        rejectUnauthorized: false,
        ca: fs.readFileSync("./sqlCerts/server-ca.pem").toString(),
        key: fs.readFileSync("./sqlCerts/client-key.pem").toString(),
        cert: fs.readFileSync("./sqlCerts/client-cert.pem").toString(),
    },
    max: 5,         // Max number of connections
    timeout: 5,          // Idle connection timeout in seconds
    types: [],         // Array of custom types, see more below
    //   onnotice    : fn          // Defaults to console.log
    //   onparameter : fn          // (key, value) when server param change
    //   debug       : fn          // Is called with (connection, query, parameters)
    //   transform   : {
    //     column            : fn, // Transforms incoming column names
    //     value             : fn, // Transforms incoming row values
    //     row               : fn  // Transforms entire rows
    //   },
    connection: {
        application_name: 'postgres.js', // Default application_name
        // ...                                // Other connection parameters
  }
}

if (process.env.NODE_ENV == 'production') {
    var instanceConnectionName = "swiftytest:us-central1:swifty-postgres-test"
    var unixSocketPath = process.env.DB_SOCKET_PATH || "/cloudsql"
    pgOptions = {
        // path: unixSocketPath,         // unix socket path (usually '/tmp')
        // host: instanceConnectionName,         // Postgres ip address or domain name
        host: unixSocketPath+"/"+instanceConnectionName,
        port: 5432,       // Postgres server port
        database: 'postgres',         // Name of database to connect to
        // ssl: true,
        max: 5,         // Max number of connections
        timeout: 10,          // Idle connection timeout in seconds
        types: [],         // Array of custom types, see more below
        connection: {
            application_name: 'postgres.js', // Default application_name
            // ...                                // Other connection parameters
      }
    }
}



const connectWithUnixSockets = (config) => {
    const dbSocketPath = process.env.DB_SOCKET_PATH || "/cloudsql"

    // Establish a connection to the database
    return Knex({
        client: 'pg',
        connection: {
            user: process.env.DB_USER, // e.g. 'my-user'
            password: process.env.DB_PASS, // e.g. 'my-user-password'
            database: process.env.DB_NAME, // e.g. 'my-database'
            host: `${dbSocketPath}/${process.env.INSTANCE_CONNECTION_NAME}`,
        },
        // ... Specify additional properties here.
        ...config
    });
}
 
const sql = postgres('postgres://username:password@host:port/database', pgOptions)

module.exports = sql