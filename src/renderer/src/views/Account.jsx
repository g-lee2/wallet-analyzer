import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, TextField, Button } from '@mui/material';

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
    <div>
      <Box sx={{ textAlign: 'center', padding: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{color: '#C4B6B6'}}>
        Account List
        </Typography>
        <Grid container spacing={2} justifyContent="center" alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField fullWidth id="outlined-basic" label="Enter Public Key" variant="outlined" value={publicKey} onChange={(e) => setPublicKey(e.target.value)} InputLabelProps={{
                  style: { color: '#C4B6B6' },
                }}
                InputProps={{
                  style: { color: '#C4B6B6' },
                }} sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#C4B6B6',
                    },
                    '&:hover fieldset': {
                      borderColor: '#C4B6B6',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#C4B6B6',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#C4B6B6',
                  },
                  '& .MuiInputBase-input': {
                    color: '#C4B6B6',
                  },
                }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button sx={{color: '#C4B6B6', backgroundColor:"#46424f", '&:hover': {
                backgroundColor: '#5e5a66'}}} fullWidth variant="contained" onClick={handleAddAccount}>
                  Search
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={2} justifyContent="center" sx={{ marginTop: 4 }}>
          {accounts.map(account => (
            <Grid item key={account.id}>
              <Button sx={{color: '#C4B6B6', backgroundColor:"#46424f", '&:hover': {
                backgroundColor: '#5e5a66'}}} variant="contained" onClick={() => setPublicKey(account.publicKey)}>
                  {account.publicKey} - Total: {account.totalProfit}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>
    </div>
  );
}
