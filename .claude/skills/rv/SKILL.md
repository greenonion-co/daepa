---
name: rv
description: PR 리뷰 검토 및 반영
---

## Instructions

1. 현재 branch의 open PR을 찾는다: `gh pr list --head <current-branch> --json number,title,url`
2. PR의 인라인 리뷰 코멘트를 가져온다:
    - `gh api repos/{owner}/{repo}/pulls/{number}/comments`
3. 이미 eyes emoji가 달린 코멘트는 skip한다:
    - 각 코멘트의 `reactions` 필드에서 `eyes > 0`인 항목은 대응 완료로 간주하고 제외
    - 새로운(eyes 없는) 코멘트만 이후 단계에서 처리
    - 새로운 코멘트가 없으면 "새로운 리뷰 없음"을 보고하고 종료
4. 리뷰 대상 파일의 **현재 코드**를 읽어서 리뷰 시점의 코드와 비교한다 (이미 후속 커밋에서 해결된 건 식별).
5. 각 리뷰를 아래 기준으로 분류한다:
    - **✅ 이미 해결됨**: 후속 커밋에서 이미 수정된 경우
    - **✅ 수정 반영**: 소프트웨어 엔지니어링 관점에서 타당하고, 작업 의도와 부합하는 리뷰 → 즉시 코드 수정
    - **❌ 수정 불필요**: 리뷰어의 오인, over-engineering, 또는 작업 의도와 맞지 않는 경우 → 사유 설명
    - **🟡 판단 모호**: 도메인 지식이나 사용자 판단이 필요한 경우 → AskUserQuestion으로 질문
6. 수정이 필요한 리뷰는 코드에 반영한다.
7. 확인 및 대응이 완료된 리뷰 코멘트에 'eyes' emoji 리액션을 남긴다:
    - `gh api repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions -f content=eyes`
9. 최종 결과를 리뷰별로 요약 보고한다.
