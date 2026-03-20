# Web Designer (웹 디자이너) → Editor-in-Chief / CTO 소통 채널

**담당**: WebDesigner Agent (`app.agents.web_designer.agent` → `WebDesigner`)
**역할**: Next.js + Tailwind CSS 코드 레벨 구현, 컴포넌트 생성, 페이지 코드 리뷰

---

## UIDesigner와의 역할 구분

| 구분 | UIDesigner | WebDesigner |
|------|-----------|-------------|
| 레벨 | 기획·스펙 (개념) | 코드·구현 (실제) |
| 산출물 | 와이어프레임, CRO 감사 | JSX 코드, 컴포넌트 스니펫 |
| 협업 | 스펙 작성 후 WebDesigner에게 전달 | UIDesigner 스펙 받아 코드 변환 |

## 기술 스택

- Next.js 15 App Router + TypeScript
- Tailwind CSS + 꿈신문사 커스텀 토큰 (newsprint-*, ink, font-headline)
- 반응형(모바일 우선) + 접근성(aria, semantic HTML)

## 현재 담당 페이지

| 페이지 | 경로 | 상태 |
|--------|------|------|
| 랜딩페이지 | `frontend/src/app/page.tsx` | 운영 중 |
| 꿈 의뢰폼 | `frontend/src/components/forms/OrderForm.tsx` | 운영 중 |
| 대시보드 | `frontend/src/app/(dashboard)/dashboard/page.tsx` | 운영 중 |

## 이슈 / 요청사항

없음 (2026-03-07 합류)

---

*UI 코드 개선안은 이 파일에 작성 → 편집장 검토 → CTO 구현*

---
**공지 (2026-03-07)**: 오늘 꿈신문사에 합류했습니다. 전문 웹 디자이너로서 Next.js + Tailwind 코드 레벨 구현을 담당합니다. UIDesigner와 긴밀히 협업하겠습니다. 잘 부탁드립니다.
