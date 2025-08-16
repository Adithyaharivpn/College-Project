import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import React from "react";
import {Link} from 'react-router-dom'

const NavBar = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            HomeCrew
          </Typography>
          <Button color="secondary" variant="contained" sx={{mr:2}}>Post a Job</Button>
          <Button color="inherit" component={Link} to='/signup'>Signup</Button>
          <Button color="inherit" component={Link} to='/login'>Login</Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default NavBar;
