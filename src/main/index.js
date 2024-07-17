import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import 'dotenv/config';
import sqlite3 from 'sqlite3';

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
      cost DOUBLE,
      profit DOUBLE,
      FOREIGN KEY (publicKey) REFERENCES account (publicKey)
    )`);
    // Create the 'transaction_detail' table if it doesn't already exist
    db.run(`CREATE TABLE IF NOT EXISTS transaction_detail (
      transactionDetailId INTEGER PRIMARY KEY AUTOINCREMENT,
      tokenId TEXT, 
      transactionHash TEXT UNIQUE,
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

ipcMain.handle('sum-and-update-total-profit', async (event, publicKey) => {
  try {
    // Step 1: Sum all profit and cost values related to this publicKey in the account_transactions table
    const totalProfit = await new Promise((resolve, reject) => {
      db.get(
        'SELECT SUM(profit) AS totalProfit, SUM(cost) AS totalCost FROM account_transactions WHERE publicKey = ?',
        [publicKey],
        (err, row) => {
          if (err) {
            reject('Error fetching profit and cost sums: ' + err.message);
          } else {
            const total = (row ? row.totalProfit : 0) + (row ? row.totalCost : 0);
            resolve(total);
          }
        }
      );
    });

    // Step 2: Update totalProfit with the calculated sum in the account table
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE account SET totalProfit = ? WHERE publicKey = ?',
        [totalProfit, publicKey],
        function (err) {
          if (err) {
            reject('Error updating prop2: ' + err.message);
          } else {
            resolve();
          }
        }
      );
    });
    return 'Success';
  } catch (error) {
    console.error(error);
    throw new Error('Error processing the request: ' + error.message);
  }
});

// IPC handler for deleting rows with hardcoded conditions
ipcMain.handle('delete-rows-sol', async () => {
  const sql = `DELETE FROM account_transactions WHERE transactionId > 592 OR transactionId < 1311`;

  return new Promise((resolve, reject) => {
    db.run(sql, function (err) {
      if (err) {
        console.error('Error executing delete query', err.message);
        reject(new Error('Error executing delete query'));
      } else {
        console.log(`Rows deleted: ${this.changes}`);
        resolve({ message: 'Delete successful', changes: this.changes });
      }
    });
  });
});

ipcMain.handle('update-cost-profit', async () => {
  return new Promise((resolve, reject) => {
    const updateSql = `
          WITH AggregatedProps AS (
              SELECT
                  tokenId,
                  SUM(CASE WHEN fromToken = 'SOL' THEN fromAmount ELSE 0 END) AS TotalCost,
                  SUM(CASE WHEN toToken = 'SOL' THEN toAmount ELSE 0 END) AS TotalProfit
              FROM transaction_detail
              GROUP BY tokenId
          )
          UPDATE account_transactions
          SET
              cost = (SELECT TotalCost FROM AggregatedProps WHERE AggregatedProps.tokenId = account_transactions.tokenId),
              profit = (SELECT TotalProfit FROM AggregatedProps WHERE AggregatedProps.tokenId = account_transactions.tokenId)
          WHERE EXISTS (
              SELECT 1 FROM AggregatedProps WHERE AggregatedProps.tokenId = account_transactions.tokenId
          );
      `;

    db.run(updateSql, function (err) {
      if (err) {
        console.error('Error performing SQL operation', err.message);
        reject(err);
      } else {
        resolve({ message: 'Update successful', changes: this.changes });
      }
    });
  });
});

// Handle IPC call for retrieving transaction id from the account_transactions table
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

// Handle IPC call for retrieving adding transactions to the account_transactions table
ipcMain.handle('add-transaction', async (event, rows) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN'); // Start transaction

      rows.forEach((row) => {
        db.run(
          `INSERT INTO account_transactions (publicKey, tokenId) VALUES (?, ?) ON CONFLICT(tokenId) DO NOTHING`,
          [row.publicKey, row.tokenId],
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

// Handle IPC call for add transaction details
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
        time) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(transactionHash) DO NOTHING`);

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

// Handle IPC call for checking if a transaction exists in the db already
ipcMain.handle('check-if-transaction-detail-exists', async (event, rows) => {
  const notFoundRows = [];

  for (const row of rows) {
    const transactionHash = row.transactionHash;
    const result = await new Promise((resolve, reject) => {
      db.get(
        'SELECT transactionHash FROM transaction_detail WHERE transactionHash = ?',
        [transactionHash],
        (err, row) => {
          if (err) {
            reject('Error checking existence: ' + err.message);
          } else {
            resolve(row || null);
          }
        }
      );
    }).catch((error) => {
      throw new Error(error);
    });

    if (!result) {
      notFoundRows.push(row);
    }
  }

  return notFoundRows;
});

// Handle IPC call for retrieving one transaction hash
ipcMain.handle('get-token-transaction-hash', async (event, tokenId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT transactionHash FROM transaction_detail WHERE tokenId = ? LIMIT 1',
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

// Handle IPC call for fetching all transactions via a Solana RPC
ipcMain.handle('fetch-transaction-data', async (event, endpoint) => {
  const apiKey = process.env.REACT_APP_API_KEY;
  const url = `${endpoint}?api-key=${apiKey}&limit=10`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on('ping', () => console.log('pong'));

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
