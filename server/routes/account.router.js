const express = require('express');
const router = express.Router();

const pool = require('../modules/pool');

router.get('/', (req, res) => {
  res.send('Hello?');
})

router.get('/', async (req, res) => {
  const query = `
    SELECT account.name, SUM(register.amount)
    FROM account
    LEFT JOIN register ON account.id = register.acct_id
    GROUP BY account.name
  ;`;
  // pool.query(query)
  //   .then(result => {
  //     res.send(result.rows)
  //   })
  //   .error(error => {
  //     send.sendStatus(500);
  //   });
  // Very similar code to the pool.query:
  try {
    const result = await pool.query(query);
    res.send(result.rows);
  } catch (error) {
    res.sendStatus(500);
  } // End try/catch
})

// TRANSFER
router.post('/', async (req, res) => {
  // Make connection to DB: 
  const connection = await pool.connect(); // Picks up the phone.
  // Make a transaction:
  try {
    // We're connected, let's start a transaction:
    await connection.query(`BEGIN;`);
    // Withdraw:
    const result = await connection.query(`INSERT INTO "register" (acct_id), amount) VALUES (1, -40) RETURNING id`);
    // ID is at result.rows[0]
    // Useful for if you ever need a return from a post. 
    // Deposit:
    await connection.query(`INSERT INTO "register" (acct_id), amount) VALUES (1, 50)`);
    // Commit:
    await connection.query(`COMMIT;`);
    // Send confirmation:
    res.sendStatus(200); // OK
  } catch(error) {
    // If error, rolls back all of the actions:
    await connection.query(`ROLLBACK;`);
    // Send error:
    res.sendStatus(500);
  } finally {
    // If it worked or if it failed, always end with this:
    await connection.release(); // Hangs up the phone. 
  } // End try/catch/finally
})

module.exports = router;
