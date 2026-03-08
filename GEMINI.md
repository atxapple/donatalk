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
