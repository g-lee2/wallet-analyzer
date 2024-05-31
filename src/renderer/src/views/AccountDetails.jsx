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
    await window.electron.sumAndUpdateTotalProfit(publicKey);
    const fetchedAccount = await window.electron.getAccountTotalProfit(publicKey);  // Call the getAccountTotalProfit function exposed by preload.js
    setAccountTotalProfit(fetchedAccount);  // Update the accounts state with the fetched account's total profit
  };

  const fetchTransactions = async () => {
    const fetchedTransactions = await window.electron.getTransactions(publicKey);  // Call the getTransactions function exposed by preload.js
    setTransactions(fetchedTransactions);  // Update the transaction state with the fetched transactions
  };

  // useEffect to fetch account's totalProfit and transactions when the component mounts
  useEffect(() => {
    fetchAccountInfo(); 
    fetchTransactions(); 
  }, [transactionDetailUpdate]);

  const fetchDataApiCall = async () => {
    console.log("apicalltransaction");
    try {
        const result = await window.electron.fetchTransactionData(`https://api.helius.xyz/v0/addresses/${publicKey}/transactions`);
        setData(result);
        // handleGetTransactions();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
  };

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

  // Function to handle saving transaction as an array of objects in state when the button is clicked
  useEffect(() => {
    console.log("here");
    const filteredItems = data.map(({ timestamp, signature, tokenTransfers, accountData }) => ({
      time: changeToLocalDateTime(timestamp), 
      transactionHash: signature,
      tokenTransferred: tokenTransfers.map(({ tokenAmount }) => tokenAmount)[0],
      tokenId: tokenTransfers.map(({ mint }) => mint)[0],
      accountBalanceChange: changeToSol(accountData.filter(account => account.account === publicKey).map(account => account.nativeBalanceChange)[0])
    })); 
    const finalFilter = filteredItems.filter((item) => item.tokenId !== null);
    const finalFinalFilter = finalFilter.filter((item) => item.tokenId !== undefined);
    setTransactionsFromApi([...transactionsFromApi, ...finalFinalFilter]);
    console.log("done??");
  }, [data]);

  // const handleGetTransactions = async () => {
  //   console.log("here");
  //   const filteredItems = await data.map(({ timestamp, signature, tokenTransfers, accountData }) => ({
  //     time: changeToLocalDateTime(timestamp), 
  //     transactionHash: signature,
  //     tokenTransferred: tokenTransfers.map(({ tokenAmount }) => tokenAmount)[0],
  //     tokenId: tokenTransfers.map(({ mint }) => mint)[0],
  //     accountBalanceChange: changeToSol(accountData.filter(account => account.account === publicKey).map(account => account.nativeBalanceChange)[0])
  //   }));
  //   await setTransactionsFromApi([...transactionsFromApi, ...filteredItems]);
  //   console.log("done??");
  // };

  useEffect(() => {
    if (tokenNameSymb != undefined) {
      const tokenName = tokenNameSymb.result.content.metadata.name;
      const tokensymbol = tokenNameSymb.result.content.metadata.symbol;
      const tokenId = tokenNameSymb.result.id;
      window.electron.updateTokenNameSymbol(tokenId, tokenName, tokensymbol);
      fetchTransactions(); 
    }
  }, [tokenNameSymb]);

  // const handleGetTokenName = async () => {
  //   const tokenName = tokenNameSymb.result.content.metadata.name;
  //   const tokensymbol = tokenNameSymb.result.content.metadata.symbol;
  //   await window.electron.updateTokenNameSymbol(tokenId, tokenName, tokensymbol);
  //   fetchTransactions(); 
  // };

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

  const prepareTransactionDetailForDb = (transaction) => {
    if (!transaction) {
      return;
    } 
    const newTransaction = {
      publicKey: publicKey,
      tokenId: transaction.tokenId,
      cost: transaction.fromAmount < 0 ? transaction.fromAmount : 0,
      profit: transaction.fromAmount > 0 ? transaction.toAmount : 0,
    }
    return newTransaction;
  }

  useEffect(() =>{
    const response = transactionsFromApi.map(prepareForDb);
    setTransactionUpdateAfterApi(response);
  }, [transactionsFromApi]);

  useEffect(() => {
    window.electron.checkIfTransactionDetailExists(transactionUpdateAfterApi).then((notFoundRows) => {
      setPreTransactionDetailUpdate(notFoundRows);
      console.log(notFoundRows);
    });
  }, [transactionUpdateAfterApi]);

  useEffect(() => {
    if (preTransactionDetailUpdate.length > 0) {
      window.electron.addTransactionDetail(preTransactionDetailUpdate);
      const responseTwo = preTransactionDetailUpdate.map(prepareTransactionDetailForDb);
      setTransactionDetailUpdate(responseTwo);
    }
  }, [preTransactionDetailUpdate]);

  useEffect(() => {
    window.electron.addTransaction(transactionDetailUpdate);
    fetchAccountInfo(); 
    fetchTransactions();
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
            {/* <Button sx={{color: '#C4B6B6', backgroundColor:"#46424f", '&:hover': {
    backgroundColor: '#5e5a66'}}} variant="contained" 
    onClick={fetchDataApiCall}
    >Get Transactions</Button> */}
          </Grid>
          <Grid item>
            <Box sx={{ backgroundColor: '#5e5a66', padding: 2, borderRadius: 1, overflow: 'auto', maxWidth: 900 }}>
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
                      <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>
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
                      <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>{transaction.cost}</TableCell>
                      <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>{transaction.profit} </TableCell>
                      
                        <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>
                        {/* {!transaction.tokenName && (
                          <Button
                            onClick={() => fetchTokenApiCall(transaction.tokenId)}
                            sx={{ marginTop: 1, width: '100%', color: '#C4B6B6', backgroundColor:"#46424f", '&:hover': {
                              backgroundColor: '#2d2a30'} }}
                          >
                            Get Token Name
                          </Button>
                          )}  */}
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
