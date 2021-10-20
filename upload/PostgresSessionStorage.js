module.exports = function(session, SQL) {
    const Store = session.Store || session.session.Store;
    const sql = SQL
    if (!sql) { throw new Error('sql argument not defined') }
    const msFromNowExpiry = 1000*60*60*24*365 //TODO: CHANGE?? currently set TO 1yr

    class PostgresSessionStorage extends Store {

        constructor(options = {}) {
            super(options);
            this.ttl = options.ttl;

        }
        

        getExpireTime (maxAge) {
            const ONE_DAY = 86400;
            let ttl = this.ttl;
      
            ttl = ttl || (typeof maxAge === 'number' ? maxAge / 1000 : ONE_DAY);
            ttl = Math.ceil(ttl + Math.ceil(Date.now() / 1000));
      
            return ttl;
          }

        async get(sid, cb) {

            try {
                const [res] = await sql`
                    SELECT * FROM sessions
                    WHERE sid = ${sid}
                `
                // console.log(res)
                if (!res) { return cb() }
                try {
                    return cb(null, (typeof res.sess === 'string') ? JSON.parse(res.sess) : res.sess);
                } catch (parseErr) {
                    console.error(parseErr)
                    return this.destroy(sid, cb)
                }
            } catch (err) {
                console.error(err)
                return cb(err)
            }
        }

        /**
         * Commit the given `sess` object associated with the given `sid`.
         *
         * @param {string} sid – the session id
         * @param {Object} sess – the session object to store
         * @param {SimpleErrorCallback} cb – a standard Node.js callback returning the parsed session object
         * @access public
         */

        async set(sid, sess, cb) {


            try {
                
                const [res] = await sql`
                    INSERT INTO sessions (
                        sid, sess, expire
                    ) values (
                        ${ sid },
                        ${ sql.json(sess) },
                        ${ new Date(Date.now() + msFromNowExpiry) }
                    )
                    ON CONFLICT (sid) DO UPDATE 
                    SET sess=${sql.json(sess)}, expire=${new Date(Date.now() + msFromNowExpiry)}
                    RETURNING sid
                `

                if(cb){return cb()}
                return;
            } catch (err) {
                console.error(err)
                if(cb) {return cb(err)}
                return;
            }
        }

        /**
         * Destroy the session associated with the given `sid`.
         *
         * @param {string} sid – the session id
         * @access public
         */

        async destroy(sid, cb) {
            try{
                const [res] = await sql`
                    DELETE FROM sessions
                    WHERE sid = ${sid}
                `
                if(cb) {return cb() }
                return;
            }catch(err){
                if(cb){return cb(err)}
                return;
            }

        }

        /**
         * Touch the given session object associated with the given session ID.
         *
         * @param {string} sid – the session id
         * @param {Object} sess – the session object to store
         * @param {Function} cb – a standard Node.js callback returning the parsed session object
         * @access public
         */

        async touch(sid, sess, cb) {
            try{
                const [res] = await sql`
                    UPDATE sessions
                    SET expire = ${ new Date(Date.now() + msFromNowExpiry) }
                    WHERE sid = ${sid} 
                    RETURNING sid
                `
                if(cb){return cb()}
                return;
            }catch(err){
                if(cb){return cb(err)}
                return;
            }
        }
    }
    
    return PostgresSessionStorage;
};