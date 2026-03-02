# Project Guidelines
## Planning Protocol
**When to Pause:**
If requirements are unclear, decisions are pending, or you identify a better approach or potential risks:
1.  **Do not write code.**
2.  **Ask questions** to clarify constraints or propose your ideas.
3.  **Enter Plan Mode** to align on the strategy before execution.
*Goal: Identify improvements and mitigate risks prior to implementation.*
## Version Control
### Commit Rules
1. Keep commits atomic (one change per commit)
2. Before pushing a commit, clean up the code, test them, version up, update all documents including the subfolder documents.
### Version Numbering (SemVer)
| Part | When to bump | Example |
|------|--------------|---------|
| MAJOR | Breaking changes | 1.0.0 → 2.0.0 |
| MINOR | New features (backward compatible) | 1.0.0 → 1.1.0 |
| PATCH | Bug fixes | 1.0.0 → 1.0.1 |
### Release Process
- On MINOR version change: add git tag and update documentation

## Deployment Checklist
Before pushing to `main` (auto-deploys to Vercel):
1. `npx tsc --noEmit` — clean compile
2. `npm run test` — all tests pass
3. Version bumped in `package.json` + `CLAUDE.md`
4. `CHANGELOG.md` updated with what changed
5. Browser-test on `localhost:3000` for UI changes

After push (production):
1. Verify Vercel build succeeds (check terminal or Vercel dashboard)
2. If new env vars needed: `npx vercel env add <NAME> production` then redeploy with `npx vercel --prod`
3. Browser-test on `app.donatalk.com` for critical paths (login, admin, public profiles)

### Env Var Reference
All env vars needed on Vercel: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_API_URL`, `NEXT_PUBLIC_BASE_URL`, `EMAIL_PASSWORD`