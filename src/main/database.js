// Import the sqlite3 module and enable verbose logging to get detailed stack traces on errors
const sqlite3 = require('sqlite3').verbose();

// Import the path module to handle file paths
const path = require('path');

// Resolve the path to where the SQLite database will be located
const dbPath = path.resolve(__dirname, 'userdata.db');

// Connect to the SQLite database, or create it if it doesn't exist, and handle any errors that occur
let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err.message); // Log errors to the console if the database connection fails
  }
  console.log('Connected to the SQlite database.'); // Confirm connection success in the console
});

// Serialize database operations to ensure they execute in sequence
db.serialize(() => {
  // Create a new table called 'user' if it doesn't already exist
  db.run(`CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  // 'id' column, auto-increments for each new entry
    userId TEXT,                           // 'userId' column, stores the user ID as text
    total INTEGER                          // 'total' column, stores a number (integer)
  )`);
});

// Define a function to add a user to the 'user' table
function addUser(userId, total) {
  return new Promise((resolve, reject) => {
    // Prepare an SQL statement for inserting data into the 'user' table
    const stmt = db.prepare(`INSERT INTO user (userId, total) VALUES (?, ?)`);

    // Run the prepared SQL statement with the provided userId and total values
    stmt.run(userId, total, function (err) {
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

// Define a function to retrieve all users from the 'user' table
function getUsers() {
  return new Promise((resolve, reject) => {
    // Execute an SQL query to select all columns from the 'user' table
    db.all(`SELECT id, userId, total FROM user`, [], (err, rows) => {
      if (err) {
        reject(err.message); // If an error occurs during the query, reject the promise with the error message
      }
      resolve(rows); // If the query is successful, resolve the promise with the rows of users
    });
  });
}

// Export the addUser and getUsers functions so they can be used elsewhere in the project
module.exports = { addUser, getUsers };
