import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    kinako: Palette["primary"];
    yomogi: Palette["primary"];
    tamago: Palette["primary"];
    gray: Palette["primary"];
  }

  interface PaletteOptions {
    kinako?: PaletteOptions["primary"];
    yomogi?: PaletteOptions["primary"];
    tamago?: PaletteOptions["primary"];
    gray?: PaletteOptions["primary"];
  }
}
