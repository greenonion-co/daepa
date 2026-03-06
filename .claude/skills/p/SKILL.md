---
name: p
description: git push & PR 생성
---

## Instructions

1. Run `git push origin HEAD`.
2. If push fails, report the error and stop.
3. After successful push, check if a PR already exists for this branch: `gh pr view HEAD --json url 2>/dev/null`.
4. If a PR already exists, report the push result and existing PR URL, then stop.
5. If no PR exists, run `git log --oneline main..HEAD` and `git diff main...HEAD --stat` in parallel to understand all commits and changed files.
6. Analyze all commits and changes to generate PR content:
    - **Title**: Conventional Commits 스타일, 한국어, 72자 이내 (예: `feat(finance): 재무 탭 이름 변경`)
    - **내용**: 작업 배경과 변경사항을 간단명료하게 bullet point로 정리
7. Ask the user for related links using `AskUserQuestion`:
    - question: "PR에 추가할 관련 링크가 있나요? (Asana, Notion, Figma, 잔디 등)"
    - options: "없음", "링크 입력"
    - If user selects "없음", leave 관련 링크 section as `-`
    - If user provides links, add them to 관련 링크 section
8. Create the PR using `gh pr create`:

```
gh pr create --title "PR 제목" --body "$(cat <<'EOF'
## 내용
- 변경사항 설명

## 관련 링크
-

## 기타
-

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

9. Report the result: push status and PR URL.
