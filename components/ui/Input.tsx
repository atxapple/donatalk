import { styled } from "../../styles/stitches.config";

export const Input = styled("input", {
  padding: "$sm",
  fontSize: "$base",
  borderRadius: "$sm",
  border: "1px solid #ccc",
  "&:focus": {
    borderColor: "$heart",
    outline: "none",
  },
});
