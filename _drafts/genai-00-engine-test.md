---
title: "[엔진 테스트] 단계 그림과 수식 유도"
description: "이미지 생성 모델 시리즈 엔진 회귀 확인용 초안입니다. 공개하지 않습니다."
categories: [Generative AI]
tags: [test]
math: true
toc: true
genai: true
sitemap: false # 테스트 초안: sitemap과 llms.txt에서 제외
---

이 초안은 시리즈 엔진이 실제 테마에서 동작하는지 확인하는 페이지입니다. 단계 그림은 화면에 들어오면 한 번 재생되고, 수식 유도는 줄이 쌓인 뒤 전체 보기로 넘어가야 합니다. 라이트와 다크, 데스크톱과 모바일에서 같은 동작을 확인합니다. 편 번호가 없어서 시리즈 목차에 나오지 않고, 초안이라 공개되지도 않습니다. 엔진이나 스타일을 고친 뒤에는 이 페이지로 화면 검사를 다시 돌려 이전 동작이 깨지지 않았는지 봅니다.

본문 인라인 수식 $$p(x \mid z)$$도 함께 렌더되는지 봅니다.

## 단계 그림

{% include genai/figs/00-vae-steps.html %}

## 수식 유도

{% include genai/derivs/00-elbo.html %}
