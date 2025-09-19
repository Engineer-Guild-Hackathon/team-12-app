import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    kinako: Palette["primary"];
    yomogi: Palette["primary"];
    tamago: Palette["primary"];
    gray: Palette["primary"];
    sumire: Palette["primary"];
  }

  interface PaletteOptions {
    kinako?: PaletteOptions["primary"];
    yomogi?: PaletteOptions["primary"];
    tamago?: PaletteOptions["primary"];
    gray?: PaletteOptions["primary"];
    sumire?: PaletteOptions["primary"];
  }

  interface PaletteColor {
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
  }

  interface SimplePaletteColorOptions {
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
  }
}
