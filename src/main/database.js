// Import the sqlite3 module and enable verbose logging to get detailed stack traces on errors
const sqlite3 = require('sqlite3').verbose();

// Import the path module to handle file paths
const path = require('path');

// Resolve the path to where the SQLite database will be located
const dbPath = path.resolve(__dirname, 'accountdata.db');

// Connect to the SQLite database, or create it if it doesn't exist, and handle any errors that occur
let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err.message); // Log errors to the console if the database connection fails
  }
  console.log('Connected to the SQlite database.'); // Confirm connection success in the console
});

// Serialize database operations to ensure they execute in sequence
db.serialize(() => {
  // Create a new table called 'account' if it doesn't already exist
  db.run(`CREATE TABLE IF NOT EXISTS account (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  // 'id' column, auto-increments for each new entry
    publicKey TEXT,                           // 'publicKey' column, stores the public key as text
    totalProfit INTEGER                          // 'totalProfit' column, stores a number (integer)
  )`);
});

// Define a function to add an account to the 'account' table
function addAccount(publicKey, totalProfit) {
  return new Promise((resolve, reject) => {
    // Prepare an SQL statement for inserting data into the 'account' table
    const stmt = db.prepare(`INSERT INTO account (publicKey, totalProfit) VALUES (?, ?)`);

    // Run the prepared SQL statement with the provided public key and total values
    stmt.run(publicKey, totalProfit, function (err) {
      if (err) {
        reject(err.message); // If an error occurs, reject the promise with the error message
      } else {
        resolve(`A row has been inserted with rowid ${this.lastID}`); // Otherwise, resolve the promise with the rowid of the inserted row
      }
    });

    // Finalize the statement to release resources associated with it
    stmt.finalize();
  });
}

// Define a function to retrieve all accounts from the 'account' table
function getAccounts() {
  return new Promise((resolve, reject) => {
    // Execute an SQL query to select all columns from the 'account' table
    db.all(`SELECT id, publicKey, totalProfit FROM account`, [], (err, rows) => {
      if (err) {
        reject(err.message); // If an error occurs during the query, reject the promise with the error message
      }
      resolve(rows); // If the query is successful, resolve the promise with the rows of accounts
    });
  });
}

// Export the addAccount and getAccounts functions so they can be used elsewhere in the project
module.exports = { addAccount, getAccounts };
