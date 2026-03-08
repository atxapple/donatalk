# DonaTalk

"Share your cause and connect with supporters"

DonaTalk is a platform that creates meaningful connections by turning sales pitches into charitable donations. Entrepreneurs and cause advocates (Pitchers) share their stories with interested supporters (Listeners), and donations flow to non-profit organizations as a result of these conversations.

## Project Structure

Our documentation has been centralized to make navigating the project easier:

- [Product Reference](./docs/product-reference.md) - Vision, User Workflows, and Architecture
- [Developer Reference](./docs/developer-reference.md) - Tech Stack, Database Schema, and API Routes
- [AI Instructions](./.ai-instructions.md) - Deployment checklists and project guidelines for LLMs

## Getting Started

First, install the dependencies:
```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing

This project uses Vitest for unit testing. To run the test suite:

```bash
npm run test
```

## Technologies

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, Stitches
- **Backend/Database:** Firebase (Auth, Firestore, Admin SDK)
- **Payments:** PayPal
- **Email:** Nodemailer (SMTP)