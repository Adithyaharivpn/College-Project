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

const Body = () => {
  return (
    <Box
      component="section"
      sx={{
        px: 4,
        py: 30,
        mx: "auto",
        ml:10
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
                          p: 1.6,
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
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                },
              }}
            />
          </Box>
        </Grid>
        <Grid
          size="grow"
          sx={{ textAlign: "right", height: "100%" }}
        >
          <Box
            component="img"
            src="./src/assets/worker.png"
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
        </Grid>
      </Grid>
    </Box>
  );
};

export default Body;
