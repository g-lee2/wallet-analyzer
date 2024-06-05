import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
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
  Link
} from '@mui/material';

export default function TransactionDetails() {
  let {tokenId} = useParams();
  const [transactionDetailList, setTransactionDetailList] = useState([]);
  const [tokenName, setTokenName] = useState('');

  const fetchTransactionDetailList = async () => {
    const fetchedTransactionDetails = await window.electron.getTransactionDetails(tokenId);  // Call the getTransactionDetails function exposed by preload.js
    setTransactionDetailList(fetchedTransactionDetails);  // Update the transaction state with the fetched transaction details in a list form
  };

  const fetchTokenName = async () => {
    const fetchedTokenName = await window.electron.getAccountTokenName(tokenId);  // Call the getTransactionDetails function exposed by preload.js
    setTokenName(fetchedTokenName.tokenName);  // Update the transaction state with the fetched transaction details in a list form
  };

  // useEffect to fetch transaction details when the component mounts
  useEffect(() => {
    fetchTransactionDetailList(tokenId); 
    fetchTokenName(tokenId);
  }, []);

  return (
    <>
      <Box sx={{ padding: 2, overflow: 'auto', height: '100vh' }}>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <Link href="../" sx={{ textDecoration: 'none' }}>
                <Button sx={{ textAlign: 'left', backgroundColor:"#46424f", '&:hover': {
        backgroundColor: '#5e5a66'}, color: '#C4B6B6' }}>Back</Button>
                </Link>
              </Grid>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" align="center" sx={{color: '#C4B6B6'}}>Transaction Details Page</Typography>
            </Grid>
          </Grid>
          <Grid item>
            <Card sx={{ backgroundColor: '#5e5a66', color: '#C4B6B6', width: 600 }}>
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ marginBottom: 1 }}>
                    Token:
                  </Typography>
                  <Typography variant="body1" sx={{ marginTop: 1 }}>{tokenName ? tokenName : tokenId}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item>
            <Box sx={{ backgroundColor: '#5e5a66', padding: 2, borderRadius: 1, maxWidth: 900, overflow: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', whiteSpace: 'normal', wordWrap: 'break-word' }}>Time</TableCell>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', whiteSpace: 'normal', wordWrap: 'break-word' }}>Transaction Hash</TableCell>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', whiteSpace: 'normal', wordWrap: 'break-word' }}>From Amount</TableCell>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', whiteSpace: 'normal', wordWrap: 'break-word' }}>From Token</TableCell>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', whiteSpace: 'normal', wordWrap: 'break-word' }}>{'>'}</TableCell>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', whiteSpace: 'normal', wordWrap: 'break-word' }}>To Amount</TableCell>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', whiteSpace: 'normal', wordWrap: 'break-word' }}>To Token</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactionDetailList.map(transactionDetail => (
                    <TableRow key={transactionDetail.transactionDetailId}>
                      <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', whiteSpace: 'normal', wordWrap: 'break-word', maxWidth: '150px' }}>{transactionDetail.time}</TableCell>
                      <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', whiteSpace: 'normal', wordWrap: 'break-word', maxWidth: '150px' }}>{transactionDetail.transactionHash}</TableCell>
                      <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', whiteSpace: 'normal', wordWrap: 'break-word', maxWidth: '150px' }}>{Math.abs(transactionDetail.fromAmount)}</TableCell>
                      <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', whiteSpace: 'normal', wordWrap: 'break-word', maxWidth: '150px' }}>{transactionDetail.fromToken === 'SOL' ? transactionDetail.fromToken : (transactionDetail.tokenName ? transactionDetail.tokenName : transactionDetail.tokenId)}</TableCell>
                      <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', whiteSpace: 'normal', wordWrap: 'break-word', maxWidth: '150px' }}>{'>'}</TableCell>
                      <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', whiteSpace: 'normal', wordWrap: 'break-word', maxWidth: '150px' }}>{transactionDetail.toAmount}</TableCell>
                      <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray', whiteSpace: 'normal', wordWrap: 'break-word', maxWidth: '150px' }}>{transactionDetail.toToken === 'SOL' ? transactionDetail.toToken : (transactionDetail.tokenName ? transactionDetail.tokenName : transactionDetail.tokenId)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  )
}
