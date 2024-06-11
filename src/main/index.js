import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';
import sqlite3 from 'sqlite3';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import 'dotenv/config';

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
      tokenName TEXT,
      tokenSymbol TEXT,
      cost DOUBLE,
      profit DOUBLE,
      FOREIGN KEY (publicKey) REFERENCES account (publicKey)
    )`);
    // Create the 'transaction_detail' table if it doesn't already exist
    db.run(`CREATE TABLE IF NOT EXISTS transaction_detail (
      transactionDetailId INTEGER PRIMARY KEY AUTOINCREMENT,
      tokenId TEXT, 
      tokenName TEXT,
      tokenSymbol TEXT,
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
    // Step 1: Sum all prop1 and prop3 values related to this publicKey in table1
    const totalProfit = await new Promise((resolve, reject) => {
      db.get(
        // SELECT SUM(profit) AS totalProfit FROM account_transactions WHERE publicKey = ?'
        'SELECT SUM(profit) AS totalProfit, SUM(cost) AS totalCost FROM account_transactions WHERE publicKey = ?',
        [publicKey],
        (err, row) => {
          if (err) {
            reject('Error fetching profit and cost sums: ' + err.message);
          } else {
            const total = (row ? row.totalProfit : 0) + (row ? row.totalCost : 0);
            // const total = row ? row.totalProfit : 0;
            resolve(total);
          }
        }
      );
    });

    // Step 2: Update prop2 with the calculated sum in table2
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

    console.log('Successfully updated totalProfit for publicKey:', publicKey);
    return 'Success';
  } catch (error) {
    console.error(error);
    throw new Error('Error processing the request: ' + error.message);
  }
});

ipcMain.handle('sum-and-update-cost-profit', async (event, all) => {
  try {
    // Step 1: Sum all prop1 and prop3 values related to this publicKey in table1
    const totalProfit = await new Promise((resolve, reject) => {
      db.get(
        // SELECT SUM(profit) AS totalProfit FROM account_transactions WHERE publicKey = ?'
        'SELECT SUM(profit) AS totalProfit, SUM(cost) AS totalCost FROM account_transactions WHERE publicKey = ?',
        [publicKey],
        (err, row) => {
          if (err) {
            reject('Error fetching profit and cost sums: ' + err.message);
          } else {
            const total = (row ? row.totalProfit : 0) + (row ? row.totalCost : 0);
            // const total = row ? row.totalProfit : 0;
            resolve(total);
          }
        }
      );
    });

    // Step 2: Update prop2 with the calculated sum in table2
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

    console.log('Successfully updated totalProfit for publicKey:', publicKey);
    return 'Success';
  } catch (error) {
    console.error(error);
    throw new Error('Error processing the request: ' + error.message);
  }
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

ipcMain.handle('add-transaction', async (event, rows) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN'); // Start transaction

      rows.forEach((row) => {
        db.run(
          // `INSERT INTO account_transactions (publicKey, tokenId, cost, profit) VALUES (?, ?, ?, ?)
          //   ON CONFLICT(tokenId) DO UPDATE SET
          //   cost = cost + EXCLUDED.cost,
          //   profit = profit + EXCLUDED.profit`
          `INSERT INTO account_transactions (publicKey, tokenId) VALUES (?, ?) ON CONFLICT(tokenId) DO NOTHING`,
          // profit = (cost + (profit + EXCLUDED.profit))
          // [row.publicKey, row.tokenId, row.cost, row.profit]
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

// ipcMain.handle('check-if-transaction-detail-exists', (event, objects) => {
//   return new Promise((resolve, reject) => {
//     const transactionHashes = objects.map((obj) => obj.transactionHash); // Extracting IDs from objects
//     const placeholders = transactionHashes.map(() => '?').join(','); // Creating the placeholder string
//     const query = `SELECT transactionHash FROM table_table WHERE transactionHash IN (${placeholders})`; // Constructing the query

//     db.all(query, transactionHashes, function (err, rows) {
//       if (err) {
//         reject('Error checking existence: ' + err.message);
//       } else {
//         const foundTransactionHashes = new Set(rows.map((row) => row.transactionHash)); // Storing found TransactionHashes in a Set
//         const notFoundObjects = objects.filter(
//           (obj) => !foundTransactionHashes.has(obj.transactionHash)
//         ); // Filtering out objects not found

//         resolve(notFoundObjects); // Resolving the promise with the objects not found
//       }
//     });
//   })
//     .then((notFoundObjects) => {
//       return notFoundObjects;
//     })
//     .catch((error) => {
//       throw new Error('Error checking existence: ' + error.message);
//     });
// });
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

ipcMain.handle('update-token-name-symbol', async (event, tokenId, tokenName, tokenSymbol) => {
  try {
    // Step 1: Update prop1 and prop2 in table1
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE account_transactions SET tokenName = ?, tokenSymbol = ? WHERE tokenId = ?',
        [tokenName, tokenSymbol, tokenId],
        function (err) {
          if (err) {
            reject('Error updating account_transactions: ' + err.message);
          } else {
            resolve();
          }
        }
      );
    });

    // Step 2: Update prop1 and prop2 in table2
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE transaction_detail SET tokenName = ?, tokenSymbol = ? WHERE tokenId = ?',
        [tokenName, tokenSymbol, tokenId],
        function (err) {
          if (err) {
            reject('Error updating transaction_detail: ' + err.message);
          } else {
            resolve();
          }
        }
      );
    });

    console.log(`Successfully updated tokenName and tokenSymbol for tokenId: ${tokenId}`);
    return 'Success';
  } catch (error) {
    console.error(error);
    return { error: 'Error processing the request: ' + error.message };
  }
});

ipcMain.handle('get-account-token-name', async (event, tokenId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT tokenName FROM transaction_detail WHERE tokenId = ?', [tokenId], (err, row) => {
      if (err) {
        reject(new Error('Failed to retrieve account from the database: ' + err.message));
      } else {
        resolve(row);
      }
    });
  });
});

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

ipcMain.handle('fetch-transaction-data', async (event, pubKey) => {
  const apiKey = process.env.REACT_APP_API_KEY;
  // const url = `${endpoint}?api-key=${apiKey}`;
  const baseUrl = process.env.REACT_APP_URL;
  const url = baseUrl + apiKey;
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getSignaturesForAddress',
    params: [
      `${pubKey}`,
      {
        limit: 100,
        commitment: 'confirmed'
      }
    ]
  };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`HTTP error status: ${response.status}`);
    }
    const data = await response.json();
    // console.log('Data to send to renderer:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return { error: error.message };
  }
});

ipcMain.handle('fetch-transaction-data-before', async (event, pubKey, transHash) => {
  const apiKey = process.env.REACT_APP_API_KEY;
  // const url = `${endpoint}?api-key=${apiKey}`;
  const baseUrl = process.env.REACT_APP_URL;
  const url = baseUrl + apiKey;
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getSignaturesForAddress',
    params: [
      `${pubKey}`,
      {
        limit: 6,
        commitment: 'confirmed',
        before: `${transHash}`
      }
    ]
  };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`HTTP error status: ${response.status}`);
    }
    const data = await response.json();
    // console.log('Data to send to renderer:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return { error: error.message };
  }
});

ipcMain.handle('fetch-transaction-data-two', async (event, signatures) => {
  try {
    const batchRequest = signatures.map((signature, index) => ({
      jsonrpc: '2.0',
      id: index + 1,
      method: 'getTransaction',
      params: [
        signature,
        { encoding: 'json', maxSupportedTransactionVersion: 0, commitment: 'confirmed' }
      ]
    }));
    // console.log(batchRequest);
    return batchRequest;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return { error: error.message };
  }
});

ipcMain.handle('fetch-transaction-data-three', async (event, batch) => {
  const apiKey = process.env.REACT_APP_API_KEY;
  // const url = `${endpoint}?api-key=${apiKey}`;
  const baseUrl = process.env.REACT_APP_URL;
  const url = baseUrl + apiKey;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch)
    });
    if (!response.ok) {
      throw new Error(`HTTP error status: ${response.status}`);
    }
    const data = await response.json();
    // console.log('Data to send to renderer:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return { error: error.message };
  }
});

ipcMain.handle('fetch-transaction-data-one', async (event) => {
  const apiKey = process.env.REACT_APP_API_KEY;
  // const url = `${endpoint}?api-key=${apiKey}`;
  const baseUrl = process.env.REACT_APP_URL;
  const url = baseUrl + apiKey;
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getTransaction',
    params: [
      '3BfETUq9sL5UcmfBshxDebEUnnb8FFwW7VP3TcP4vP8qyJtPTUJg2G2zAj7sJcND5B2HeVNaWDxJGACJASFkU97d',
      { encoding: 'json', maxSupportedTransactionVersion: 0, commitment: 'confirmed' }
    ]
  };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`HTTP error status: ${response.status}`);
    }
    const data = await response.json();
    // console.log('Data to send to renderer:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return { error: error.message };
  }
});

ipcMain.handle('fetch-transaction-data-four', async (event, batch) => {
  try {
    const filteredTransactions = await batch.filter(
      (transaction) => transaction.result.meta.err === null
    );
    // console.log(filteredTransactions);
    return filteredTransactions;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return { error: error.message };
  }
});

ipcMain.handle('fetch-token-data', async (event, token) => {
  const apiKey = process.env.REACT_APP_API_KEY;
  const url = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'text',
        method: 'getAsset',
        params: {
          id: `${token}`
        }
      })
    });
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
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
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
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
