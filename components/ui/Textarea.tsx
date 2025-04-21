import { styled } from "../../styles/stitches.config";

export const Textarea = styled("textarea", {
  padding: "$sm",
  fontSize: "$base",
  borderRadius: "$sm",
  border: "1px solid #ccc",
  resize: "vertical",
  "&:focus": {
    borderColor: "$heart",
    outline: "none",
  },
});
