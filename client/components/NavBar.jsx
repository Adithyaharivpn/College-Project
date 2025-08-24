import {AppBar,Box,Button,Toolbar,Typography} from "@mui/material";
import React from "react";

const NavBar = () => {
  return (
    <Box sx={{ flexGrow: 1,m:0}}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            HomeCrew
          </Typography>
          <Button color="secondary" variant="contained" sx={{mr:2}}>Post a Job</Button>
          <Button color="inherit">Sign up</Button>
          <Button color="inherit">Login</Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default NavBar;
