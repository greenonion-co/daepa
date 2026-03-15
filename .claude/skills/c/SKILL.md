---
name: c
description: git commit with auto-generated message
---

## Instructions

1. Run `git status` and `git diff --staged` and `git diff` in parallel to understand all changes.
2. If there are no staged changes, stage all modified/deleted/new files that are relevant (exclude `.env`, credentials, secrets). Use specific file paths, not `git add -A`.
3. Run `git log --oneline -5` to understand the repository's commit message style.
4. Analyze all staged changes and generate a commit message following these rules:
    - Use **Conventional Commits** format: `type: description`
    - Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`, `ci`, `build`
    - Description should be concise (under 72 chars), lowercase, no period at the end
    - Focus on **why** the change was made, not what was changed
    - 커밋 메시지는 반드시 **한국어**로 작성 (type prefix는 영어 유지: `feat: 한국어 설명`)
    - If multiple logical changes exist, pick the most significant type
    - Add body (separated by blank line) only if the change is complex enough to need explanation
5. Commit with the generated message. Always include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` in the commit message.
6. Report the result: commit hash and message.