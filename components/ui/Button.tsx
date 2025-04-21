import { styled } from "../../styles/stitches.config";

export const Button = styled("button", {
  backgroundColor: "$heart",
  color: "white",
  fontWeight: "600",
  padding: "$sm",
  borderRadius: "$sm",
  border: "none",
  transition: "background-color 0.3s",
  marginTop: "$sm",
  "&:hover": {
    backgroundColor: "#d73c2c",
  },
  "&:disabled": {
    backgroundColor: "$mediumgray",
    cursor: "not-allowed",
  },
});
