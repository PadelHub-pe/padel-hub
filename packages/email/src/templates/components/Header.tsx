import { Img } from "@react-email/components";

const LOGO_URL = "https://padelhub.pe/images/padelhub-horizontal-fullcolor.png";

export function Header() {
  return (
    <Img
      src={LOGO_URL}
      alt="PadelHub"
      width="180"
      height="37"
      style={{ margin: "0 0 24px" }}
    />
  );
}
