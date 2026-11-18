# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: toon.spec.mjs >> 카툰 캡처 sunset × 숲·정상 전망
- Location: tests/e2e/toon.spec.mjs:67:2

# Error details

```
Error: page.evaluate: TypeError: window.hiking.jumpTargets is not a function
    at eval (eval at evaluate (:370:30), <anonymous>:2:29)
    at UtilityScript.evaluate (<anonymous>:372:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
```

# Page snapshot

```yaml
- generic [active]:
  - generic "관악산 정상 접근 3D 시범 공간" [ref=e1]
  - generic:
    - region "등반 정보" [ref=e2]:
      - generic [ref=e3]:
        - generic [ref=e4]: 서 있음
        - strong [ref=e5]:
          - text: "0.0"
          - emphasis [ref=e6]: km/h
        - button "등반 정보 접기" [expanded] [ref=e7] [cursor=pointer]:
          - generic [aria-hidden] [ref=e8]: ▴
      - heading [level=1] [ref=e9]:
        - status [ref=e10]: 출발 전 · 일주문으로 걸어가면 시작돼요
      - generic [ref=e19]:
        - generic [ref=e20]:
          - text: 고도
          - strong [ref=e21]:
            - text: "50"
            - emphasis [ref=e22]: m
        - generic [ref=e23]:
          - text: 걸은
          - strong [ref=e24]: 00:00:00
        - generic [ref=e25]:
          - text: 남은
          - strong [ref=e26]: 98분
      - generic [ref=e27]:
        - generic [ref=e28]: 스테미너
        - progressbar "스테미너" [ref=e29]
        - generic [ref=e31]: "100"
      - generic [ref=e32]:
        - generic "초콜릿 개수" [ref=e33]: 5/5
        - button "먹기" [ref=e35] [cursor=pointer]
      - generic [ref=e37]:
        - generic [ref=e38]: 노면 · 광장 · 포장
        - generic "방위" [ref=e39]: 북 ↑
      - button "시점 바꾸기 (V)" [ref=e40] [cursor=pointer]:
        - emphasis [aria-hidden] [ref=e41]
        - generic [ref=e42]: 3인칭 보기
        - generic [ref=e43]: V
    - navigation "수첩 탭" [ref=e44]:
      - button "지도 M" [ref=e45] [cursor=pointer]:
        - emphasis [aria-hidden] [ref=e46]
        - generic [ref=e47]: 지도
        - generic [ref=e48]: M
      - button "수첩 J" [ref=e49] [cursor=pointer]:
        - emphasis [aria-hidden] [ref=e50]
        - generic [ref=e51]: 수첩
        - generic [ref=e52]: J
      - button "배낭" [ref=e53] [cursor=pointer]:
        - emphasis [aria-hidden] [ref=e54]
      - button "쉬기" [ref=e56] [cursor=pointer]:
        - emphasis [aria-hidden] [ref=e57]
      - button "설정" [ref=e59] [cursor=pointer]:
        - emphasis [aria-hidden] [ref=e60]
    - generic:
      - status "서울 현재 시각과 날씨" [ref=e62]:
        - generic [ref=e64]: 17:20
        - generic [ref=e65]: 맑음
      - button "소리 켜기/끄기" [pressed] [ref=e66] [cursor=pointer]:
        - generic [ref=e68]: 소리 켜짐
        - generic [ref=e69]: · 화질 높음 · 고정
      - button "라디오 꺼짐 — 눌러서 라디오 올리기" [ref=e70] [cursor=pointer]:
        - generic [ref=e71]: 라디오
    - generic:
      - button "자동 걷기 켜기 (R)" [ref=e73] [cursor=pointer]:
        - generic [ref=e75]: 걷기
        - generic [ref=e76]: 자동 걷기
        - generic [ref=e77]: R
      - button "달리기(누르고 있는 동안)" [ref=e78] [cursor=pointer]:
        - generic [aria-hidden] [ref=e79]: »
        - generic [ref=e80]: 달리기
        - generic [ref=e81]: Shift
      - button "쌍안경 B" [ref=e82] [cursor=pointer]:
        - generic [ref=e84]: 쌍안경
        - generic [ref=e85]: B
      - button "휴대폰 P" [ref=e86] [cursor=pointer]:
        - generic [ref=e88]: 휴대폰
        - generic [ref=e89]: P
      - button "앉기 C" [ref=e90] [cursor=pointer]:
        - generic [ref=e92]: 앉기
        - generic [ref=e93]: C
    - contentinfo:
      - generic:
        - generic: W
        - generic: A
        - generic: S
        - generic: D
        - text: 걷기
        - generic: · 드래그 둘러보기
  - generic:
    - generic: H
    - text: 다시 보기
  - status
```