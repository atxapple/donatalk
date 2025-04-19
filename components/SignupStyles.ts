import { styled } from "../styles/stitches.config";

export const Wrapper = styled("div", {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "$lg",
  backgroundColor: "$light",
});

export const Card = styled("div", {
  width: "100%",
  maxWidth: "550px",
  backgroundColor: "$white",
  borderRadius: "$lg",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
  padding: "$lg",
  display: "flex",
  flexDirection: "column",
  gap: "$md",
});

export const Title = styled("h1", {
  fontSize: "$xxl",
  textAlign: "center",
  color: "$dark",
  marginBottom: "$sm",
});

export const Subtitle = styled("p", {
  textAlign: "center",
  fontSize: "$md",
  color: "$mediumgray",
  marginBottom: "$md",
});

export const Field = styled("div", {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

export const Label = styled("label", {
  fontWeight: "600",
  color: "$dark",
});

export const Input = styled("input", {
  padding: "$md",
  fontSize: "$base",
  borderRadius: "$sm",
  border: "1px solid #ccc",
  "&:focus": {
    borderColor: "$heart",
    outline: "none",
  },
});

export const Textarea = styled("textarea", {
  padding: "$md",
  fontSize: "$base",
  borderRadius: "$sm",
  border: "1px solid #ccc",
  resize: "vertical",
  "&:focus": {
    borderColor: "$heart",
    outline: "none",
  },
});

export const Button = styled("button", {
  backgroundColor: "$heart",
  color: "white",
  fontWeight: "600",
  padding: "$md",
  borderRadius: "$md",
  border: "none",
  transition: "background-color 0.3s",
  "&:hover": {
    backgroundColor: "#d73c2c",
  },
  "&:disabled": {
    backgroundColor: "$mediumgray",
    cursor: "not-allowed",
  },
});

export const ErrorBox = styled("div", {
  backgroundColor: "#fee",
  color: "#a00",
  padding: "$md",
  borderRadius: "$sm",
  border: "1px solid #faa",
});
