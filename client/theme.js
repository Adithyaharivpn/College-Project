import { createTheme } from "@mui/material";

const theme = createTheme(
    {
        palette:{
            primary:{
                main:"#0D47A1",
            },
            secondary:{
                main:"#FF7043",
            },
            background:{
                default:"#212121",
            },
        },
        typography:{
                 t:'PT Sans',
                 cap:"'PT Sans Caption'"
            }
    }
)
export default theme;