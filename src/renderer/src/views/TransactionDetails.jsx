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
  Link, Tooltip
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

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

  // const transactions = transactionDetailList.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <>
      <Box sx={{ padding: 2, overflow: 'auto', height: '100vh' }}>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <Link href="../" sx={{ textDecoration: 'none' }}>
                <Button sx={{ mt: 2, mb: 2, ml: 2, borderColor: '#A8E86A', color: "white", textTransform: 'none', verticalAlign: 'middle', '&:hover': {
                color: '#a0da55'} }}>
                  <ArrowBackIosNewIcon fontSize="small" sx={{marginRight: '6px'}} /> Back
              </Button>
                </Link>
              </Grid>
            </Grid>
            {/* <Grid item xs>
              <Typography variant="h5" align="center" sx={{color: '#C4B6B6'}}>Transaction Details Page</Typography>
            </Grid> */}
          </Grid>
          
          <Grid item alignItems="center">
            <Card sx={{ backgroundColor: 'rgba(0, 0, 0, 0)', color: 'white', width: 800}}>
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  {/* <Typography variant="body1" sx={{ marginBottom: 1 }}>
                    Token:
                  </Typography> */}
                  <Typography variant="body1" sx={{ marginTop: 1 }}>{tokenName ? tokenName : tokenId}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item alignItems="center">
            <Box sx={{ backgroundColor: '#101010', padding: 2, borderRadius: '16px', maxWidth: 960, overflow: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(0, 0, 0, 0)', whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'center' }}>Transaction Hash</TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(0, 0, 0, 0)', whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'right' }}> From</TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(0, 0, 0, 0)', whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'center' }}></TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(0, 0, 0, 0)', whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'center' }}></TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(0, 0, 0, 0)', whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'right' }}> To </TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(0, 0, 0, 0)', whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'center' }}></TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(0, 0, 0, 0)', whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'center' }}>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactionDetailList.map(transactionDetail => (
                    <TableRow key={transactionDetail.transactionDetailId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <Tooltip title={transactionDetail.transactionHash}>
                      <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(255, 255, 255, 0.07)',whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis', maxWidth: '275px' }}>{transactionDetail.transactionHash}</TableCell></Tooltip>
                      <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(255, 255, 255, 0.07)',whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis', maxWidth: '275px' }}>{Math.abs(transactionDetail.fromAmount)}  </TableCell>
                      <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(255, 255, 255, 0.07)',whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis', maxWidth: '275px' }}>{transactionDetail.fromToken === 'SOL' ? transactionDetail.fromToken : (transactionDetail.tokenName ? transactionDetail.tokenName : 'Token')}</TableCell>
                      <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(255, 255, 255, 0.07)',whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis', maxWidth: '275px' }}>{'>'}</TableCell>
                      <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(255, 255, 255, 0.07)',whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis', maxWidth: '275px' }}>{Math.abs(transactionDetail.toAmount)} </TableCell>
                      <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(255, 255, 255, 0.07)',whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis', maxWidth: '275px' }}>{transactionDetail.toToken === 'SOL' ? transactionDetail.toToken : (transactionDetail.tokenName ? transactionDetail.tokenName : 'Token')}</TableCell>
                      <TableCell sx={{ color: 'white', borderBottom: '2px solid rgba(255, 255, 255, 0.07)', whiteSpace: 'normal', wordWrap: 'break-word', maxWidth: '150px', textAlign: 'center' }}>{transactionDetail.time} PST</TableCell>
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
