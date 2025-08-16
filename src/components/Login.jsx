import { Box, Grid, Typography, TextField, Button, Paper } from '@mui/material'
import React from 'react'

const Login = () => {
  return (
    <Box sx={{ py: 8, px: 2 }}>
      <Grid container justifyContent="center" alignItems="center">
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Login
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Enter your details to access your account.
            </Typography>
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                required
              />
              <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                Login
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
export default Login