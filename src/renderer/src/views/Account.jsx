import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, TextField, Button, InputAdornment, Table, TableBody, TableCell,TableContainer,TableHead,TableRow, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function Account() {
  const navigate = useNavigate();
  // State to store the input value for public key
  const [publicKey, setPublicKey] = useState('');
  // State to store the list of accounts fetched from the database
  const [accounts, setAccounts] = useState([]);

  // Function to handle adding a user when the button is clicked
  const handleAddAccount = async () => {
    try {
      const accountExists = await window.electron.checkAccountExists(publicKey);
      if (!accountExists) {
        // Call the addAccount function exposed by preload.js
          await window.electron.addAccount(publicKey);
          navigate(`/account-details/${publicKey}`);
      } else {
          console.log("Account already exists.");
          navigate(`/account-details/${publicKey}`);
      }
  } catch (error) {
      console.error("Error in IPC call:", error);
  }
    setPublicKey("");  // Reset the input field
    await fetchAccounts();  // Refetch the list of accounts to update the UI
  };

  // Function to fetch all accounts from the database
  const fetchAccounts = async () => {
    const fetchedAccounts = await window.electron.getAccounts();  // Call the getAccounts function exposed by preload.js
    setAccounts(fetchedAccounts);  // Update the accounts state with the fetched accounts
  };

  // useEffect to fetch accounts when the component mounts
  useEffect(() => {
    fetchAccounts();  
  }, []);

  return (
    <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    sx={{ width: '100vw', height: '100vh' }} // This sets the parent Box to take the full viewport width and height
  >
      <Box sx={{ textAlign: 'center', flexDirection: 'column', alignItems:'center', justifyContent: 'center', display: 'flex', backgroundColor: '#101010', borderRadius: '16px', minWidth: '841px', minHeight: '537px' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{color: '#FFFFFF'}}>
        Enter or Select One Account
        </Typography>
        <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{marginTop: 3}}>
          <Grid item >
            <TextField fullWidth id="outlined-basic" placeholder="Search here..." variant="outlined" value={publicKey} onChange={(e) => setPublicKey(e.target.value)} InputLabelProps={{style: { color: '#171717' }}}
                InputProps={{style: { color: '#171717' }, startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize='large' sx={{ color: '#FFFFFF'}}/>
                  </InputAdornment>
                ),}} sx={{'& .MuiOutlinedInput-root': {'& fieldset': {
                      borderColor: '#171717',
                    },
                    '&:hover fieldset': {
                      borderColor: '#171717',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#171717',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#F0F0F0',
                  },
                  '& .MuiInputBase-input': {
                    color: '#FFFFFF',
                  }, height: '56px', width: '426px',
                  backgroundColor: '#171717',
                  borderRadius: '10px',
                }}
            />
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button sx={{borderRadius: '10px', height: '56px', width: '180px', color: '#171717', backgroundColor:"#A8E86A", '&:hover': {
                backgroundColor: '#a0da55'}}} fullWidth variant="contained" onClick={handleAddAccount}>
                  Search
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={2} justifyContent="center" sx={{ marginTop: 4 }}>
          {/* {accounts.map(account => (
            <Grid item key={account.id}>
              <Button sx={{color: '#C4B6B6', backgroundColor:"#46424f", '&:hover': {
                backgroundColor: '#5e5a66'}}} variant="contained" onClick={() => navigate(`/account-details/${account.publicKey}`)}>
                  {account.publicKey} - Total: {account.totalProfit}
              </Button>
            </Grid>
          ))} */}

      <Table sx={{ width: 600 }} aria-label="simple table">
        <TableBody>
          {accounts.map(account => (
            <TableRow
              key={account.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell align="center" sx={{ color: '#A8E86A', backgroundColor:"#101010", borderBottom: '2px solid rgba(255, 255, 255, 0.07)', '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.07)', cursor: 'pointer'}}} onClick={() => navigate(`/account-details/${account.publicKey}`)}>
                  {account.publicKey.toUpperCase()}
              </TableCell>
              {/* <TableCell align="right" sx={{color: '#B2F35F', backgroundColor:"#101010" }}>
                  Total: {account.totalProfit}
              </TableCell> */}
            </TableRow>
          ))}
        </TableBody>
      </Table>

        </Grid>
      </Box>
    </Box>
  );
}

