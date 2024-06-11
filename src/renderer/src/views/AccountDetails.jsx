import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react"; 
// import tokenData from './getAsset.json';
// import data from "./extra.json";

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Link,
  Divider
} from '@mui/material';

export default function AccountDetails() {
  let {publicKey} = useParams();
  const navigate = useNavigate();
  const [accountTotalProfit, setAccountTotalProfit] = useState();
  const [transactions, setTransactions] = useState([]);
  const [transactionUpdateAfterApi, setTransactionUpdateAfterApi] = useState([]);
  const [preTransactionDetailUpdate, setPreTransactionDetailUpdate] = useState([]);
  const [transactionDetailUpdate, setTransactionDetailUpdate] = useState([]);
  const [transactionsFromApi, setTransactionsFromApi] = useState([]);
  const [data, setData] = useState([]);
  const [tokenNameSymb, setTokenNameSymb] = useState();

  function changeToLocalDateTime(timestamp) {
    // Convert to milliseconds
    const date = new Date(timestamp * 1000);
  
    // Options for formatting the date and time
    const options = {
      timeZone: 'America/Los_Angeles', // PST timezone
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, // 12-hour format
    };
  
    // Format the date
    const readableDate = new Intl.DateTimeFormat('en-US', options).format(date);
  
    return readableDate;
  }
  
  function changeToSol (numb) {
    const divideBy = 1000000000;
    const result = numb / divideBy;
    return result;
  }

  // Function to fetch an account's totalProfit from the database
  const fetchAccountInfo = async () => {
    await window.electron.updateCostProfit();
    await window.electron.sumAndUpdateTotalProfit(publicKey);
    const fetchedAccount = await window.electron.getAccountTotalProfit(publicKey);  // Call the getAccountTotalProfit function exposed by preload.js
    setAccountTotalProfit(fetchedAccount);  // Update the accounts state with the fetched account's total profit
  };

  const fetchTransactions = async () => {
    const fetchedTransactions = await window.electron.getTransactions(publicKey);  // Call the getTransactions function exposed by preload.js
    setTransactions(fetchedTransactions);  // Update the transaction state with the fetched transactions
  };

  useEffect(() => {
    fetchAccountInfo(); 
    fetchTransactions(); 
  }, []);

  // this function gets the signatures for a specific public key, then grabs just the signature from the json response, and calls the function that will sort those into an array of JSON-RPC request objects
  const fetchDataApiCall = async () => {
    console.log("apicalltransaction");
    // try {
    //     // const result = await window.electron.fetchTransactionData(`https://api.helius.xyz/v0/addresses/${publicKey}/transactions`);
    //     window.electron.fetchTransactionData(publicKey);
    //     // await window.electron.fetchTransactionDataTwo(result);
    //     // setData(result);
    //     // handleGetTransactions();
    // } catch (error) {
    //     console.error('Error fetching data:', error);
    // }
    window.electron.fetchTransactionData(publicKey)
    .then(data => {
      if (!data) {
        console.error('no data');
      } else {
        console.log('Data received from main process:', data);
        const signatures = data.result.map((item) => item.signature);
        createBatchRequests(signatures);
      }
    }).catch(error => {
      console.error('Error in fetching data:', error);
    });
  };

  // this function gets the signatures for a specific public key, then grabs just the signature from the json response, and calls the function that will sort those into an array of JSON-RPC request objects
  const fetchDataApiCallBeforeTransaction = async (tokId) => {
    console.log("apicalltransactionbeforeone");
    // try {
    //     // const result = await window.electron.fetchTransactionData(`https://api.helius.xyz/v0/addresses/${publicKey}/transactions`);
    //     window.electron.fetchTransactionData(publicKey);
    //     // await window.electron.fetchTransactionDataTwo(result);
    //     // setData(result);
    //     // handleGetTransactions();
    // } catch (error) {
    //     console.error('Error fetching data:', error);
    // }
    console.log(tokId);
    const transHash = await window.electron.getTokenTransactionHash(tokId);
    window.electron.fetchTransactionDataBefore(publicKey, transHash.transactionHash)
    .then(data => {
      if (!data) {
        console.error('no data');
      } else {
        console.log('Data received from main process:', data);
        const signatures = data.result.map((item) => item.signature);
        createBatchRequests(signatures);
      }
    }).catch(error => {
      console.error('Error in fetching data:', error);
    });
  };

  // this is the function that will sort those signatures into an array of JSON-RPC request objects
  const createBatchRequests = async (signs) => {
    window.electron.fetchTransactionDataTwo(signs).then(data => {
      if (!data) {
        console.error('no data');
      } else {
        console.log('Data received from main process:', data);
        makeBatchRequest(data);
      }
    }).catch(error => {
      console.error('Error in fetching data:', error);
    });
  }

  const createBatchRequestsTwo = async () => {
    const signs = []
    window.electron.fetchTransactionDataTwo(signs).then(data => {
      if (!data) {
        console.error('no data');
      } else {
        console.log('Data received from main process:', data);
        makeBatchRequest(data);
      }
    }).catch(error => {
      console.error('Error in fetching data:', error);
    });
  }

  // this is the function that make a request to get transaction metadata for each signature in the array of JSON-RPC request object
  const makeBatchRequest = async (batch) => {
    window.electron.fetchTransactionDataThree(batch).then(data => {
      if (!data) {
        console.error('no data');
      } else {
        console.log('Data received from main process:', data);
        filterBatchRequest(data);
      }
    }).catch(error => {
      console.error('Error in fetching data:', error);
    });
  }

  // This function will filter out all failed transactions
  const filterBatchRequest = async (batch) => {
    window.electron.fetchTransactionDataFour(batch).then(data => {
      if (!data) {
        console.error('no data');
      } else {
        console.log('Data received from main process:', data);
        setData(data);
      }
    }).catch(error => {
      console.error('Error in fetching data:', error);
    });
  }

  const fetchDataApiOneTransaction = async () => {
    window.electron.fetchTransactionDataOne().then(data => {
      if (!data) {
        console.error('no data');
      } else {
        console.log('Data received from main process:', data);
        setData(data);
      }
    }).catch(error => {
      console.error('Error in fetching data:', error);
    });
  }

  // Function that gets the token metadata from the HELIUS API NOT RPC and calls the function that will just grab the token name and symbol
  const fetchTokenApiCall = async (token) => {
    console.log("apicalltoken");
    try {
        const result = await window.electron.fetchTokenData(token);
        // handleGetTransactions();
        setTokenNameSymb(result);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
  };

  // useEffect(() => {
  //   console.log("here");
  //   const filteredItems = data.map(({ timestamp, signature, tokenTransfers, accountData }) => ({
  //     time: changeToLocalDateTime(timestamp), 
  //     transactionHash: signature,
  //     tokenTransferred: tokenTransfers.map(({ tokenAmount }) => tokenAmount)[0],
  //     tokenId: tokenTransfers.map(({ mint }) => mint)[0],
  //     accountBalanceChange: changeToSol(accountData.filter(account => account.account === publicKey).map(account => account.nativeBalanceChange)[0])
  //   })); 
  //   const finalFilter = filteredItems.filter((item) => item.tokenId !== null);
  //   const finalFinalFilter = finalFilter.filter((item) => item.tokenId !== undefined);
  //   setTransactionsFromApi([...transactionsFromApi, ...finalFinalFilter]);
  //   console.log("done??");
  // }, [data]);

  // Function to handle saving transaction as an array of objects in state when the button is clicked and it takes only necessary information from each transaction doesn't save to the db though, it needs to be prepared 
  useEffect(() => {
    console.log("here");
    console.log(data.length);
    if (data.length > 0)
    {const filteredItems = data.map(({ result: {blockTime, meta: { postBalances, postTokenBalances, preBalances, preTokenBalances}, transaction: {signatures, message: { accountKeys }} } }) => {
      const indexOfOwner = accountKeys.indexOf(publicKey);

      const postTokenNumber = postTokenBalances.length > 0 && postTokenBalances.map(item => {
        if (item.owner === publicKey) {
          return parseInt(item.uiTokenAmount.uiAmountString)
        }
      }).filter(item => item !== undefined);
      const preTokenNumber = preTokenBalances.length > 0 && preTokenBalances.map(item => {
        if (item.owner === publicKey) {
          return parseInt(item.uiTokenAmount.uiAmountString)
        }
      }).filter(item => item !== undefined);
      
      let finalTokenBalanceChange = null;
      
      if (preTokenNumber && postTokenNumber && preTokenNumber > postTokenNumber) {
        finalTokenBalanceChange = preTokenNumber - postTokenNumber;
      } else if (preTokenNumber && postTokenNumber && postTokenNumber > preTokenNumber) {
        finalTokenBalanceChange = postTokenNumber - preTokenNumber;
      } else if (preTokenNumber && !postTokenNumber && preTokenNumber === 0) {
        finalTokenBalanceChange = preTokenNumber;
      } else if (preTokenNumber && !postTokenNumber) {
        finalTokenBalanceChange = null;
      } else if (!preTokenNumber && postTokenNumber) {
        finalTokenBalanceChange = postTokenNumber;
      } else {
        return null;
      };

      return {
        time: changeToLocalDateTime(blockTime), 
        transactionHash: signatures[0],
        tokenTransferred: finalTokenBalanceChange,
        tokenId: preTokenBalances[0].mint,
        accountBalanceChange: changeToSol(postBalances[indexOfOwner] - preBalances[indexOfOwner])
    }}); 
    // filter out ones that don't have postTokenBalances?
    // const firstFilter = filteredItems.filter((item) => !item.tokenTransferred);
    const finalFilter = filteredItems.filter((item) => item.tokenTransferred !== null);
    // const finalFinalFilter = finalFilter.filter((item) => item.tokenId !== undefined);
    setTransactionsFromApi([...transactionsFromApi, ...finalFilter]);
    // console.log(finalFilter);
    console.log("done??");}
  }, [data]);

  // This is the function that will just grab the token name and symbol from the api call that returns the metadata of the token based on token id and update the db
  useEffect(() => {
    if (tokenNameSymb != undefined) {
      const tokenName = tokenNameSymb.result.content.metadata.name;
      const tokensymbol = tokenNameSymb.result.content.metadata.symbol;
      const tokenId = tokenNameSymb.result.id;
      window.electron.updateTokenNameSymbol(tokenId, tokenName, tokensymbol);
      fetchTransactions(); 
    }
  }, [tokenNameSymb]);

  // This functions prepares the transactions to be stored in the database, based on the info that was taken from the api call and the function that grabbed only the necessary info from the api call (of the transaction)
  const prepareForDb = (transaction) => {
    if (!transaction) {
      return;
    }
    const newTransaction = {
      tokenId: transaction.tokenId,
      transactionHash: transaction.transactionHash,
      fromToken: transaction.accountBalanceChange < 0 ? 'SOL' : transaction.tokenId,
      fromAmount: transaction.accountBalanceChange < 0 ? transaction.accountBalanceChange : transaction.tokenTransferred,
      toToken: transaction.accountBalanceChange < 0 ? transaction.tokenId : 'SOL', 
      toAmount: transaction.accountBalanceChange < 0 ? transaction.tokenTransferred : transaction.accountBalanceChange,
      time: transaction.time
    }
    return newTransaction;
  }

  // This function further dissects/prepares the transaction info, this will be stored in a different table in the db
  const prepareTransactionDetailForDb = (transaction) => {
    if (!transaction) {
      return;
    } 
    const newTransaction = {
      publicKey: publicKey,
      tokenId: transaction.tokenId,
      // cost: transaction.fromAmount < 0 ? transaction.fromAmount : 0,
      // profit: transaction.fromAmount > 0 ? transaction.toAmount : 0,
      // profit: transaction.fromAmount > 0 ? (transaction.fromAmount - transaction.toAmount) : 0
    }
    return newTransaction;
  }

  // This is the function that will now get the transactions from the api and calls the function that will prepare it for the db
  useEffect(() =>{
    const response = transactionsFromApi.map(prepareForDb);
    setTransactionUpdateAfterApi(response);
  }, [transactionsFromApi]);

  // This is the function now that will check to see if a transaction exists in the db and if it doesn't sets the state that will trigger the useEffect that will add transactions to the db
  useEffect(() => {
    window.electron.checkIfTransactionDetailExists(transactionUpdateAfterApi).then((notFoundRows) => {
      setPreTransactionDetailUpdate(notFoundRows);
      console.log(notFoundRows);
    });
  }, [transactionUpdateAfterApi]);

  // This functions finally adds the transactions that were prepared after the api call to the db and then prepares it again to be stored in a different table in the db
  useEffect(() => {
    if (preTransactionDetailUpdate.length > 0) {
      window.electron.addTransactionDetail(preTransactionDetailUpdate);
      const responseTwo = preTransactionDetailUpdate.map(prepareTransactionDetailForDb);
      setTransactionDetailUpdate(responseTwo);
    }
  }, [preTransactionDetailUpdate]);

  // This functions finally adds the transactions to that other table in the db and refetches the info from the db to be displayed to the user
  useEffect(() => {
    window.electron.addTransaction(transactionDetailUpdate)
    .then(() => {
      fetchAccountInfo(); 
      fetchTransactions();
    });
  }, [transactionDetailUpdate]);

  const handleOnClick = (transactionId) => {
    navigate(`/account-details/${publicKey}/transaction/${transactionId}`);
  }

  return (
    <>
      <Box sx={{ padding: 2, overflowY: 'auto', height: '100vh' }}>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <Link href="/" sx={{ textDecoration: 'none' }}>
                <Button sx={{ textAlign: 'left', backgroundColor:"#46424f", '&:hover': {
                  backgroundColor: '#5e5a66'}, color: '#C4B6B6' }}>
                    Back
                </Button>
                </Link>
              </Grid>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" gutterBottom align="center" sx={{ color: '#C4B6B6'}}>
              Account Details Page
              </Typography>
              <Button
                  onClick={createBatchRequestsTwo}
                  sx={{ width: '100%', height: '26px', color: '#C4B6B6', backgroundColor:"#46424f", '&:hover': {
                    backgroundColor: '#2d2a30'} }}
                >
                  Get Trans One
                </Button>
            </Grid>
          </Grid>
          <Grid item>
            <Card sx={{ backgroundColor: '#5e5a66', color: '#C4B6B6', maxWidth: 800 }}>
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ marginBottom: 2 }}>
                    Wallet: {publicKey}
                  </Typography>
                  <Divider sx={{ marginY: 1, backgroundColor: '#908d96'}} />
                  <Typography variant="body1" sx={{ marginTop: 2.5 }}>
                    Total Profit: {accountTotalProfit?.totalProfit ?? 0} SOL
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <Button sx={{color: '#C4B6B6', backgroundColor:"#46424f", '&:hover': {
    backgroundColor: '#5e5a66'}}} variant="contained" 
    onClick={fetchDataApiCall}
    >Get Transactions</Button>
          </Grid>
          <Grid item>
            <Box sx={{ backgroundColor: '#5e5a66', padding: 2, borderRadius: 1, overflow: 'auto', width: 900, maxHeight: '500px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>Token</TableCell>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>Cost</TableCell>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>Profit</TableCell>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map(transaction => (
                    <TableRow key={transaction.transactionId} >
                      <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', height: '42px' }}>
                        <Link
                          variant="contained"
                          onClick={() => handleOnClick(transaction.tokenId)}
                          sx={{ width: '100%', color: '#C4B6B6', textDecorationColor: 'gray', textUnderlineOffset: '3px', '&:hover': {
                            cursor: 'pointer',
                          } }}
                        >
                        {transaction.tokenName ? transaction.tokenName : transaction.tokenId} 
                        </Link>
                      </TableCell>
                      <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', height: '42px' }}>{transaction.cost}</TableCell>
                      <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', height: '42px' }}>{transaction.profit} </TableCell>
                      
                        <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', height: '42px' }}>
                        {/* {!transaction.tokenName && (
                          <Button
                            onClick={() => fetchTokenApiCall(transaction.tokenId)}
                            sx={{ width: '100%', height: '26px', color: '#C4B6B6', backgroundColor:"#46424f", '&:hover': {
                              backgroundColor: '#2d2a30'} }}
                          >
                            Get Token Name
                          </Button>
                        )}  */}
                        {/* <Button
                            onClick={() => fetchDataApiCallBeforeTransaction(transaction.tokenId)}
                            sx={{ width: '100%', height: '26px', color: '#C4B6B6', backgroundColor:"#46424f", '&:hover': {
                              backgroundColor: '#2d2a30'} }}
                          >
                            Get Trans Before This
                          </Button> */}
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
