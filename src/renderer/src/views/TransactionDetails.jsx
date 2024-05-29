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

  const fetchTransactionDetailList = async () => {
    const fetchedTransactionDetails = await window.electron.getTransactionDetails(tokenId);  // Call the getTransactionDetails function exposed by preload.js
    setTransactionDetailList(fetchedTransactionDetails);  // Update the transaction state with the fetched transaction details in a list form
  };

  // useEffect to fetch transaction details when the component mounts
  useEffect(() => {
    fetchTransactionDetailList(tokenId); 
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
    <Grid item xs={12} md={6}>
      <Card sx={{ backgroundColor: '#5e5a66', color: '#C4B6B6', marginTop: 2 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ marginBottom: 1 }}>
              Token:
            </Typography>
            <Typography variant="body1" sx={{ marginTop: 1 }}>{tokenId}
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
              <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>Transaction Hash</TableCell>
              <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>From Amount</TableCell>
              <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>From Token</TableCell>
              <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>To Amount</TableCell>
              <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>To Token</TableCell>
              <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactionDetailList.map(transactionDetail => (
              <TableRow key={transactionDetail.transactionDetailId}>
                <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>{transactionDetail.transactionHash}</TableCell>
                <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>{transactionDetail.fromAmount}</TableCell>
                <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>{transactionDetail.fromToken}</TableCell>
                <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>{transactionDetail.toAmount}</TableCell>
                <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>{transactionDetail.toToken}</TableCell>
                <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>{transactionDetail.time}</TableCell>
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

{/* <Box sx={{ padding: 2, overflowY: 'auto', height: '100vh'}}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <Grid container alignItems="center" spacing={2}>
                <Grid item>
                  <Link href="../" sx={{ textDecoration: 'none' }}>
                    <Button sx={{ textAlign: 'left',backgroundColor:"#46424f", '&:hover': {
          backgroundColor: '#5e5a66'}, color: '#C4B6B6'}} >Back</Button>
                  </Link>
                  </Grid>
            </Grid>
          </Grid>
        <Grid item xs>
          <Typography variant="h5" align="center" sx={{color: '#C4B6B6'}}>Transaction Details Page</Typography>
        </Grid>
      </Grid>
      
      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: '#5e5a66', color: '#C4B6B6', marginTop: 2 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" sx={{ marginBottom: 1 }}>
                Token:
              </Typography>
              <Typography variant="body1" sx={{ marginTop: 1 }}>{tokenId}
              </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ backgroundColor: '#5e5a66', padding: 2, borderRadius: 1, maxWidth: 800, margin: '20px auto', }}>
          <TableContainer sx={{ maxHeight: '50vh', overflow: 'auto' }}>
            <Table sx={{ borderCollapse: 'collapse' }}>
              <TableHead stickyHeader>
                <TableRow>
                  <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>Transaction Hash</TableCell>
                  <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>From Amount</TableCell>
                  <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>From Token</TableCell>
                  <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>To Amount</TableCell>
                  <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>To Token</TableCell>
                  <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {transactionDetailList.map(transactionDetail => (
                  <TableRow key={transactionDetail.transactionDetailId}>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>{transactionDetail.transactionHash}</TableCell>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>{transactionDetail.fromAmount}</TableCell>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>{transactionDetail.fromToken}</TableCell>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>{transactionDetail.toAmount}</TableCell>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>{transactionDetail.toToken}</TableCell>
                    <TableCell sx={{ color: '#C4B6B6', borderBottom: '2px solid gray' }}>{transactionDetail.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TableContainer>
          </Box>
        </Grid>
      </Grid>
    </Box> */}