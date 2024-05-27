// Import the sqlite3 module and enable verbose logging to get detailed stack traces on errors
const sqlite3 = require('sqlite3').verbose();

// Import the path module to handle file paths
const path = require('path');

// Use path.join to clearly define the path from known segments
const dbPath = path.join(__dirname, '../../resources/database.sqlite');

// Connect to the SQLite database, or create it if it doesn't exist, and handle any errors that occur
let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err.message); // Log errors to the console if the database connection fails
  }
  console.log('Connected to the SQlite database.'); // Confirm connection success in the console
});

// Serialize database operations to ensure they execute in sequence
db.serialize(() => {
  db.exec('PRAGMA foreign_keys = ON'); // Ensure foreign key constraints are enforced

  // Create a new table called 'account' if it doesn't already exist
  db.run(`CREATE TABLE IF NOT EXISTS account (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  // 'id' column, auto-increments for each new entry
    publicKey TEXT,                           // 'publicKey' column, stores the public key as text
    totalProfit DOUBLE                          // 'totalProfit' column, stores a number (integer)
  )`);

  // Create the 'account_transactions' table if it doesn't already exist
  db.run(`CREATE TABLE IF NOT EXISTS account_transactions (
    transactionId INTEGER PRIMARY KEY AUTOINCREMENT, 
    publicKey TEXT, 
    tokenId TEXT UNIQUE,
    ticker TEXT,
    cost DOUBLE,
    profit DOUBLE,
    FOREIGN KEY (publicKey) REFERENCES account (publicKey)
  )`);

  // Create the 'transaction_detail' table if it doesn't already exist
  db.run(`CREATE TABLE IF NOT EXISTS transaction_detail (
    transactionDetailId INTEGER PRIMARY KEY AUTOINCREMENT,
    tokenId TEXT, 
    transactionHash TEXT,
    fromToken TEXT,
    fromAmount DOUBLE,
    toToken TEXT,
    toAmount DOUBLE,
    time DATETIME,
    FOREIGN KEY (tokenId) REFERENCES account_transactions (tokenId)
  )`);
});

// Define a function to check if the user exists
function checkAccountExists(publicKey) {
  return new Promise((resolve, reject) => {
    db.get('SELECT publicKey FROM account WHERE publicKey = ?', [publicKey], function (err, row) {
      if (err) {
        reject('Error checking account existence: ' + err.message);
      } else {
        resolve(row ? true : false); // true if account exists, false otherwise
      }
    });
  });
}

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

// Define a function to retrieve a certain account's totalProfit from the 'account' table
function getAccountTotalProfit(publicKey) {
  return new Promise((resolve, reject) => {
    db.get('SELECT totalProfit FROM account WHERE publicKey = ?', [publicKey], (err, row) => {
      if (err) {
        reject(new Error('Failed to retrieve account from the database: ' + err.message));
      } else {
        resolve(row);
      }
    });
  });
}

// Define a function to retrieve a certain transactions's id from the 'account' table
function getTransactionId(tokenId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT transactionId FROM account_transactions WHERE tokenId = ?',
      [tokenId],
      (err, row) => {
        if (err) {
          reject(new Error('Failed to retrieve transactions id from the database: ' + err.message));
        } else {
          resolve(row);
        }
      }
    );
  });
}

// function addTransaction(rows) {
//   return new Promise((resolve, reject) => {
//     const stmt = db.prepare(
//       `INSERT INTO account_transactions (publicKey, tokenId, ticker, cost, profit) VALUES (?, ?, ?, ?, ?)`
//     );

//     db.serialize(() => {
//       db.run('BEGIN TRANSACTION');
//       rows.forEach((row) => {
//         stmt.run(row.publicKey, row.tokenId, row.ticker, row.cost, row.profit, function (err) {
//           if (err) {
//             reject(err.message);
//           }
//         });
//       });
//       db.run('COMMIT TRANSACTION', (err) => {
//         if (err) {
//           reject(err.message);
//         } else {
//           resolve('All rows have been inserted successfully');
//         }
//       });
//     });

//     stmt.finalize();
//   });
// }

function addTransaction(db, rows) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN'); // Start transaction

      rows.forEach((row) => {
        db.run(
          `INSERT INTO account_transactions (publicKey, tokenId, ticker, cost, profit) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(tokenId) DO UPDATE SET
            cost = cost + EXCLUDED.cost,
            profit = profit + EXCLUDED.profit`,
          [row.publicKey, row.tokenId, row.ticker, row.cost, row.profit],
          (err) => {
            if (err) {
              db.run('ROLLBACK'); // Roll back on error
              reject(err);
              return;
            }
          }
        );
      });

      db.run('COMMIT', (err) => {
        // Commit all changes
        if (err) {
          reject('Failed to commit transaction: ' + err.message);
        } else {
          resolve('All user data updated successfully.');
        }
      });
    });
  });
}

// Define a function to retrieve all transactions from the 'account_transactions' table
function getTransactions(publicKey) {
  return new Promise((resolve, reject) => {
    // Execute an SQL query to select all columns from the 'account_transactions' table
    db.all(`SELECT * FROM account_transactions WHERE publicKey = ?`, [publicKey], (err, rows) => {
      if (err) {
        reject(err.message); // If an error occurs during the query, reject the promise with the error message
      }
      resolve(rows); // If the query is successful, resolve the promise with the rows of transactions
    });
  });
}

// Define a function to add an account to the 'transaction_detail' table
function addTransactionDetail(rows) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
      `INSERT INTO transaction_detail (tokenId, 
        transactionHash,
        fromToken,
        fromAmount,
        toToken,
        toAmount,
        time) VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    db.serialize(() => {
      db.run('BEGIN TRANSACTION DETAIL');
      rows.forEach((row) => {
        stmt.run(
          row.tokenId,
          row.transactionHash,
          row.fromToken,
          row.fromAmount,
          row.toToken,
          row.toAmount,
          row.time,
          function (err) {
            if (err) {
              reject(err.message);
            }
          }
        );
      });
      db.run('COMMIT TRANSACTION DETAIL', (err) => {
        if (err) {
          reject(err.message);
        } else {
          resolve('All rows have been inserted successfully');
        }
      });
    });

    stmt.finalize();
  });
}

// Define a function to retrieve all transaction details from the 'transaction_detail' table
function getTransactionDetails(tokenId) {
  return new Promise((resolve, reject) => {
    // Execute an SQL query to select all columns from the 'transaction_detail' table
    db.all(`SELECT * FROM transaction_detail WHERE tokenId = ?`, [tokenId], (err, rows) => {
      if (err) {
        reject(err.message); // If an error occurs during the query, reject the promise with the error message
      }
      resolve(rows); // If the query is successful, resolve the promise with the rows of transactions
    });
  });
}

// Export the all add, get, update, check account functions so they can be used elsewhere in the project
module.exports = {
  checkAccountExists,
  addAccount,
  getAccounts,
  addTransaction,
  getTransactions,
  getAccountTotalProfit,
  addTransactionDetail,
  getTransactionDetails,
  getTransactionId
};
