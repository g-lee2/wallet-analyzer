import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';
import sqlite3 from 'sqlite3';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';

// Define the path to the SQLite database
const dbPath = join(__dirname, '../../resources/database.sqlite');

// Connect to the SQLite Database, and create it if it doesn't already exist
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to the database.');
    // Create an account table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS account (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      publicKey TEXT,
      totalProfit DOUBLE  
    )`);
    // Create an account_transactions table if it doesn't exist
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
  }
});

// Handle IPC to check if an account exists
ipcMain.handle('check-account-exists', (event, publicKey) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT 1 FROM account WHERE publicKey = ? LIMIT 1`, [publicKey], function (err, row) {
      if (err) {
        reject(err);
      } else {
        resolve(row ? true : false); // returns true if account exists, otherwise false
      }
    });
  });
});

// Handle IPC call for adding an account
ipcMain.handle('add-account', async (event, publicKey) => {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO account (publicKey) VALUES (?)`, [publicKey], function (err) {
      if (err) {
        console.error('Failed to add account', err);
        reject(new Error('Error adding account'));
      } else {
        console.log(`A row has been inserted with rowid ${this.lastID}`);
        resolve(`Account added with ID ${this.lastID}`);
      }
    });
  });
});

// Handle IPC call for retrieving all accounts
ipcMain.handle('get-accounts', async (event) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, publicKey, totalProfit FROM account', [], (err, rows) => {
      if (err) {
        console.error('Failed to retrieve accounts', err);
        reject(new Error('Failed to retrieve accounts'));
      } else {
        resolve(rows);
      }
    });
  });
});

// Handle IPC call for retrieving a certain account's total profit
ipcMain.handle('get-account-total-profit', async (event, publicKey) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT totalProfit FROM account WHERE publicKey = ?', [publicKey], (err, row) => {
      if (err) {
        reject(new Error('Failed to retrieve account from the database: ' + err.message));
      } else {
        resolve(row);
      }
    });
  });
});

ipcMain.handle('get-transaction-id', async (event, tokenId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT transactionId FROM account_transactions WHERE tokenId = ?',
      [tokenId],
      (err, row) => {
        if (err) {
          reject(new Error('Failed to retrieve account from the database: ' + err.message));
        } else {
          resolve(row);
        }
      }
    );
  });
});

// ipcMain.handle('add-transaction', (event, rows) => {
//   return new Promise((resolve, reject) => {
//     db.serialize(() => {
//       db.run('BEGIN TRANSACTION');
//       const stmt = db.prepare(
//         `INSERT INTO account_transactions (publicKey, tokenId, ticker, cost, profit) VALUES (?, ?, ?, ?, ?)`
//       );

//       rows.forEach((row) => {
//         stmt.run([row.publicKey, row.tokenId, row.ticker, row.cost, row.profit], function (err) {
//           if (err) {
//             reject(err.message); // This will stop and reject the first error encountered
//             return;
//           }
//         });
//       });

//       db.run('COMMIT TRANSACTION', (err) => {
//         if (err) {
//           reject(err.message); // Handle commit errors
//         } else {
//           stmt.finalize(); // Make sure to finalize the statement
//           console.log(`A row has been inserted with rowid`);
//           resolve('All rows have been inserted successfully');
//         }
//       });
//     });
//   });
// });

ipcMain.handle('add-transaction', async (event, rows) => {
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
});

// Handle IPC call for retrieving all transactions
ipcMain.handle('get-transactions', async (event, publicKey) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM account_transactions WHERE publicKey = ?`, [publicKey], (err, rows) => {
      if (err) {
        console.error('Failed to retrieve transactions', err);
        reject(new Error('Failed to retrieve transactions'));
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('add-transaction-detail', (event, rows) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION DETAIL');
      const stmt = db.prepare(`INSERT INTO transaction_detail (tokenId, 
        transactionHash,
        fromToken,
        fromAmount,
        toToken,
        toAmount,
        time) VALUES (?, ?, ?, ?, ?, ?, ?)`);

      rows.forEach((row) => {
        stmt.run(
          [
            row.tokenId,
            row.transactionHash,
            row.fromToken,
            row.fromAmount,
            row.toToken,
            row.toAmount,
            row.time
          ],
          function (err) {
            if (err) {
              reject(err.message); // This will stop and reject the first error encountered
              return;
            }
          }
        );
      });

      db.run('COMMIT TRANSACTION DETAIL', (err) => {
        if (err) {
          reject(err.message); // Handle commit errors
        } else {
          stmt.finalize(); // Make sure to finalize the statement
          console.log(`A row has been inserted with rowid`);
          resolve('All rows have been inserted successfully');
        }
      });
    });
  });
});

// Handle IPC call for retrieving all transaction details
ipcMain.handle('get-transaction-details', async (event, tokenId) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM transaction_detail WHERE tokenId = ?`, [tokenId], (err, rows) => {
      if (err) {
        console.error('Failed to retrieve transaction details', err);
        reject(new Error('Failed to retrieve transaction details'));
      } else {
        resolve(rows);
      }
    });
  });
});

// Function to create the main window of the Electron app
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: process.platform === 'linux' ? join(__dirname, '../../resources/icon.png') : undefined,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  // Show window when it is ready to be displayed
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external URLs by opening them in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' }; // Prevent new window creation
  });

  // Load the correct URL in the window based on development or production environment
  const rendererUrl = is.dev
    ? process.env.ELECTRON_RENDERER_URL
    : join(__dirname, '../renderer/index.html');
  mainWindow.loadURL(rendererUrl);
}

// App readiness to create window
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.yourdomain.yourapp');
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Handle all windows closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // If not on macOS
    db.close(() => console.log('Database connection closed')); // Close the database connection properly
    app.quit();
  }
});
