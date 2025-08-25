import {
  Box,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import LocationPinIcon from "@mui/icons-material/LocationPin";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import workerImage from "../assets/worker.png"

const Body = () => {
  return (
    <>
    <Box
      component="section"
      sx={{
        px: { xs: 2, md: 4 },
        py: { xs: 10, md: 40 },
        mx: "auto",
        ml: { xs: 0, md: 20 },
        maxWidth: "1440px",
      }}
    >
      <Grid container spacing={4} alignItems="center">
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography
            variant="h4"
            component="h1"
            color="text.primary"
            fontWeight="bold"
            sx={{ fontFamily: "t" }}
            gutterBottom
          >
            Reliable Home Services, On-Demand.
          </Typography>
          <Typography
            variant="h6"
            component="p"
            color="text.secondary"
            sx={{ fontFamily: "cap", mb: 4 }}
          >
            Your one-stop platform to find and book verified experts for all
            your home service needs.
          </Typography>
          <Box
            component="form"
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              maxWidth: 780,
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 1,
              px: 1,
              py: 1,
            }}
          >
            <TextField
              placeholder="Your Location"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton>
                        <LocationPinIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                p: 1,
                flexGrow: 1,
              }}
            />
            <TextField
              placeholder="Search a Job"
              variant="outlined"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        sx={{
                          bgcolor: "#0D47A1",
                          "--IconButton-hoverBg": "#08306b",
                          color: "white",
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0,
                          p: 1.9,
                          mr: -1.7,
                          flex: 2,
                        }}
                      >
                        <SearchOutlinedIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                p: 1,
                flexGrow: 10,
                "& .MuiOutlinedInput-root": {
                  borderTopRightRadius: "50px",
                  borderBottomRightRadius: "50px",
                },
              }}
            />
          </Box>
        </Grid>
        {/* <Grid size={{xs:12,md:6}} sx={{ textAlign: "right", height: "100%" }}>
          <Box
            component="img"
            src={workerImage}
            alt="Worker with toolbox"
            sx={{
              width: "100%",
              height: "auto",
              maxHeight: 500,
              filter: "drop-shadow(0 0 15px rgba(0,0,0,0.1))",
              borderRadius: 2,
              objectFit: "contain",
            }}
          />
        </Grid> */}
      </Grid>
    </Box>
   <Box
        component="img"
        src={workerImage}
        alt="Worker with toolbox"
        sx={{
          position: 'absolute', 
          top: '50%',            
          right: '10%',            
          transform: 'translateY(-50%)', 
          filter: "drop-shadow(0 0 15px rgba(0,0,0,0.1))",
          width: '1440px',
          height: '1080px',
          display: { xs: 'none', lg: 'block' },
        }}
      >
    </Box>
    </>
  );
};

export default Body;
