import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react"; 

import {
  Box,
  Button,
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
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import UpdateIcon from '@mui/icons-material/Update';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

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

  function changeToLocalDateTime(timestamp) {
    // Convert to milliseconds.
    const date = new Date(timestamp * 1000);
  
    // Formatting the date and time to PST timezone and 12 hour format.
    const options = {
      timeZone: 'America/Los_Angeles', 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    };
  
    // Format the date to be readable for US users.
    const readableDate = new Intl.DateTimeFormat('en-US', options).format(date);
  
    return readableDate;
  }
  
  function changeToSol (numb) {
    const divideBy = 1000000000;
    const result = numb / divideBy;
    return result;
  }

  // Function to fetch an account's totalProfit from the database.
  const fetchAccountInfo = async () => {
    await window.electron.updateCostProfit();
    await window.electron.sumAndUpdateTotalProfit(publicKey);
    const fetchedAccount = await window.electron.getAccountTotalProfit(publicKey);  // Call the getAccountTotalProfit function exposed by preload.js.
    setAccountTotalProfit(fetchedAccount);  // Update the accounts state with the fetched total profit.
  };

  const fetchTransactions = async () => {
    const fetchedTransactions = await window.electron.getTransactions(publicKey);  // Call the getTransactions function exposed by preload.js.
    setTransactions(fetchedTransactions);  // Update the transaction state with the fetched transactions.
  };

  useEffect(() => {
    fetchAccountInfo(); 
    fetchTransactions(); 
  }, []);

  // This function gets the transaction history for a specific public key.
  const fetchDataApiCall = async () => {
    try {
      const result = await window.electron.fetchTransactionData(`https://api.helius.xyz/v0/addresses/${publicKey}/transactions`);
      setData(result);
      // handleGetTransactions();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
  };

  // Function to handle saving transaction as an array of objects, when the button is clicked. It takes only necessary information from each transaction.
  useEffect(() => {
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
  }, [data]);

  // This function prepares the transactions with the necessary extracted information to populate the relevant database fields.
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

  // This function reformats the transaction information to be stored in the account_transactions (another table) table in the database with different fields.
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


  // This is the function that will now get the transactions from the api call and calls the function that will prepare/format it for the db.
  useEffect(() =>{
    const response = transactionsFromApi.map(prepareForDb);
    setTransactionUpdateAfterApi(response);
  }, [transactionsFromApi]);

  // This function checks if a transaction exists in the transaction_detail table. If it doesn't, it sets the state to trigger the useEffect to add transactions to the database.
  useEffect(() => {
    window.electron.checkIfTransactionDetailExists(transactionUpdateAfterApi).then((notFoundRows) => {
      setPreTransactionDetailUpdate(notFoundRows);
      console.log(notFoundRows);
    });
  }, [transactionUpdateAfterApi]);

  // This functions adds the transactions that were prepared after the api call to the transaction_detail table in the db and then calls the function that will reformat the data again to be stored in the account_transactions table in the db.
  useEffect(() => {
    if (preTransactionDetailUpdate.length > 0) {
      window.electron.addTransactionDetail(preTransactionDetailUpdate);
      const responseTwo = preTransactionDetailUpdate.map(prepareTransactionDetailForDb);
      setTransactionDetailUpdate(responseTwo);
    }
  }, [preTransactionDetailUpdate]);

  // This functions adds the transactions to the account_transactions table in the db and retrieves the info from the db to be displayed to the user.
  useEffect(() => {
    window.electron.addTransaction(transactionDetailUpdate)
    .then(() => {
      fetchAccountInfo(); 
      fetchTransactions();
    });
  }, [transactionDetailUpdate]);

  // When the transaction hash is clicked, user will be redirected to the corresponding transaction detail page.
  const handleOnClick = (transactionId) => {
    navigate(`/account-details/${publicKey}/transaction/${transactionId}`);
  }

  return (
    <Box sx={{ padding: 2, overflowY: 'auto', height: '100vh' }}>
      <Grid container justifyContent="center">
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={6} sx={{textAlign: 'left'}}>
              <Link onClick={() => navigate(-1)} sx={{ textDecoration: 'none' }}>
              <Button sx={{ mt: 2, mb: 2, ml: 2, borderColor: '#A8E86A', color: "white", textTransform: 'none', verticalAlign: 'middle', '&:hover': {
                color: '#a0da55'} }}>
                  <ArrowBackIosNewIcon fontSize="small" sx={{marginRight: '6px'}} /> Back
              </Button>
              </Link>
            </Grid>
            <Grid item xs={6} sx={{textAlign: 'right'}}>
              <Button sx={{ mt: 2, mb: 2, mr: 2, width:'210px', height: '56px', borderRadius: '10px', borderColor: '#A8E86A', textTransform: 'none', color: '#A8E86A', '&:hover': { borderColor: '#e5f8ce', color: '#e5f8ce'}}} variant="outlined" onClick={fetchDataApiCall}> <UpdateIcon sx={{marginRight: '8px'}} fontSize="small"/> Update Transactions</Button>
            </Grid>
          </Grid>
        </Grid>
        <Box
          justifyContent="center"
          alignItems="center"
          sx={{
            width: 900,
            marginTop: 2,
            borderRadius: '16px',
            minHeight: '112px',
            display: 'flex',
            flexDirection: 'row',
            padding: 2,
            bgcolor: '#101010'
          }}
        >
          <Box sx={{ display: 'flex',flexDirection: 'column',alignItems: 'center',flex: 1,textAlign: 'left'}}>
            <Typography variant="h6">
            Wallet:
            </Typography>
            <Typography variant="body2">
            {publicKey}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ mx: 2, height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.07)' }} />
          <Box sx={{display: 'flex',flexDirection: 'column',alignItems: 'center',flex: 1,textAlign: 'right' }}>    
            <Typography variant="h6">
              Total Profit:
            </Typography>
            <Typography variant="body1">
            {accountTotalProfit?.totalProfit ?? 0} SOL
            </Typography>
          </Box>
        </Box>
        <Grid item mt={2}>
          <Box sx={{ backgroundColor: '#101010', padding: 2, borderRadius: '16px', overflow: 'auto', width: 900, maxHeight: '500px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(0, 0, 0, 0)', textAlign: 'center' }}>Token</TableCell>
                  <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(0, 0, 0, 0)', textAlign: 'center' }}>Cost</TableCell>
                  <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(0, 0, 0, 0)', textAlign: 'center' }}>Profit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map(transaction => (
                  <TableRow key={transaction.transactionId} >
                    <TableCell sx={{ color: '#A8E86A', borderBottom: '2px solid rgba(255, 255, 255, 0.07)', height: '42px', textAlign: 'center' }}>
                      <Link
                        variant="contained"
                        onClick={() => handleOnClick(transaction.tokenId)}
                        sx={{ width: '100%', color: '#A8E86A', textDecorationColor: '#A8E86A', textUnderlineOffset: '3px', '&:hover': {
                          cursor: 'pointer',
                          textDecorationColor: '#e5f8ce',
                          color: '#e5f8ce'
                        } }}
                      >
                      {transaction.tokenId}
                      </Link>
                    </TableCell>
                    <TableCell sx={{ color: '#EB5757', borderBottom: '2px solid rgba(255, 255, 255, 0.07)', height: '42px', verticalAlign: 'middle' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingDownIcon />{transaction.cost}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#219653', borderBottom: '2px solid rgba(255, 255, 255, 0.07)', height: '42px', verticalAlign: 'middle' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUpIcon />{transaction.profit}
                      </Box> 
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
