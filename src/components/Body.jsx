import { Box, Grid, Typography } from '@mui/material'
import React from 'react'

const Body = () => {
  return (
    <Box sx={{py:8,px:2}}>
        <Grid container spacing={4} alignItems={'center'}>
            <Grid xs={12} md={6}> 
                <item>
                    <Typography variant='h3' component="h1" color='text.primary' fontWeight="bold">
                       Reliable Home Services, On-Demand.
                    </Typography>
                </item>
                <item>
                    <Typography variant='h6' component="p" color='text.secondary'>
                        Your one-stop platform to find and book verified experts for all your home service needs.
                    </Typography>
                </item>
            </Grid>
        </Grid>
    </Box>
  )
}

export default Body