---
layout: post
date: 2025-04-01
title: "문서의 모든 구조를 유지하며 요약하기! HierarchiSummarizer 개발기"
tags: [Large Language Model, 자동화툴, 문서 자동 요약, 문서 자동 번역, exaon3.5, openai, ollama, Groq, Mistral, ]
categories: [기타, ]
toc: true
toc_sticky: false
math: true
---

![0](/assets/img/2025-04-01-HierarchiSummarizer.md/0.png)


안녕하세요. 오늘은 제가 개발한 [HierarchiSummarizer](https://github.com/jeongHwarr/HierarchiSummarizer)를 소개드리려고 합니다! 사실 이건 제가 사용하려고 개발한 거긴 합니다.. 정말 필요해서 개발했어요. 매일매일 쏟아지는 논문의 핵심 내용을 빨리.. 하지만 자세히.. 읽고 싶어서 개발했습니다. 기존 요약 툴도 찾아봤지만 지나치게 요약을 많이 해서 불편했어요. 또, 원래 논문을 읽을 때도 목록식으로 정리하면서 읽곤 하는데, 이렇게 정리하는 과정이 번거로워서 LLM을 활용해 자동화했습니다.


## 개발하게 된 계기


처음에는 긴 문서를 자동으로 요약하는 도구가 필요했습니다. 하지만 기존 요약 도구들은 문서의 계층 구조를 무시하고 텍스트를 단순 압축하는 경우가 많았어요. 그래서 "문서의 구조를 유지하면서 핵심 내용을 정리할 수 있는 요약 도구를 만들어보자!"는 생각으로 개발을 시작하게 되었습니다.


## HierarchiSummarizer란?


HierarchiSummarizer는 **문서의 계층 구조를 분석하고 핵심 내용을 요약하는 LLM 기반 툴**입니다. 문서 전체를 보고 요약하는 것이 아니라, 문서의 전체 구조를 분석하고 각 구조에 내용을 요약합니다! 그러니까 문서 내에 있는 모든 챕터가 요약 결과에 다 포함되고 각 챕터 내용이 요약되어서 최종 요약 결과에 합쳐진다고 볼 수 있어요. 그 결과 문서의 구조를 유지하면서 중요한 부분을 정리할 수 있습니다. 또한 요약 뿐만 아니라 원하는 언어로 번역도 동시에 할 수 있습니다


## 제공하는 기능 


✅ **PDF & Markdown 지원**


PDF 파일을 자동으로 Markdown으로 변환한 후, 내용을 요약합니다.


✅ **다양한 AI 모델 지원**


Mistral, OpenAI, Groq, Ollama 등 여러 LLM(대형 언어 모델)과 연동할 수 있어요.


✅ **요약 스타일 맞춤 설정**


계층적 요약(번호 목록, 불릿 포인트 등) 또는 문단 형식 등 원하는 스타일로 요약할 수 있습니다.


✅ **불필요한 내용 제외**


특정 제목 수준(예: 1단계 제목)이나 특정 섹션(예: 참고문헌)을 제외할 수 있습니다.


✅ **다국어 지원**


요약된 내용을 영어뿐만 아니라 원하는 언어로 번역할 수도 있습니다.


## 사용법


### 1. 설치하기


{% raw %}
```text
git clone https://github.com/jeongHwarr/HierarchiSummarizer.git
cd HierarchiSummarizer
pip install -r requirements.txt
```
{% endraw %}


### 2. API 키 설정하기


PDF를 Markdown으로 변환할 때 Mistral OCR 모델을 사용했기 때문에 Mistral API가 필수적입니다! Mistral API key를 발급 받은 후 `config.yaml` 파일에 아래와 같이 추가해 주세요.


{% raw %}
```text
mistral:
  model: open-mistral-nemo
  api_key: your_api_key  # 필수 입력
```
{% endraw %}


Mistral API key는 무료로 발급 받을 수 있으며, 아래 과정을 통해 발급 받을 수 있습니다. 

1. [Mistral AI website](https://docs.mistral.ai/getting-started/) 방문하기
2. 회원가입 혹은 로그인
3. [https://console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) 해당 페이지에서 Create new key 클릭하기!
4. 발급 받은 API 키를 config.yaml에 있는 mistral에 api_key에 입력하기!

### 3. 요약할 파일 준비하기


요약할 PDF 또는 Markdown 파일을 `workspace/to_process/` 폴더에 넣어 주세요.


### 4. 실행하기


{% raw %}
```text
python run.py
```
{% endraw %}


실행하면 문서가 처리되며, 결과는 `workspace/output/` 폴더에 저장됩니다. PDF 문서의 경우, 변환된 Markdown 파일도 함께 확인할 수 있습니다!


## HierarchiSummarizer 커스터마이징 


config.yaml을 수정해서 요약 결과는 커스터마이징 할 수 있습니다! 주요 설정 방법입니다.


### 1. **언어 설정**


기본적으로 요약은 영어로 출력되지만, 다른 언어로 요약 결과를 원할 경우 `config.yaml` 파일에서 `language` 항목을 변경할 수 있습니다. 예를 들어, 한국어로 번역된 요약을 원한다면 아래와 같이 설정하세요:


{% raw %}
```yaml
language: 한국어
```
{% endraw %}


### 2. **추가적인 요구사항 추가**


기본적인 요약 외에도 요약 생성 시 특정한 요구사항을 프롬프트로 추가하고 싶다면, `config.yaml`의 `additional_requirements` 항목을 수정하면 됩니다. 예를 들어, 요약 문장의 끝에 마침표를 사용하지 않도록 하는 요구사항을 추가하려면 아래와 같이 설정할 수 있습니다:


{% raw %}
```javascript
additional_requirements: |
요약 문장의 끝에는 마침표를 사용하지 말아줘 
```
{% endraw %}


이렇게 설정하면, 모든 요약 결과에서 마침표가 생략된 형태로 결과를 받을 수 있습니다. 물론.. 요구 사항을 잘 지키는 결과를 내뱉을 수 있을지는 LLM 모델 성능에 따라 바뀌게 됩니다.. ㅎㅎ 여러 시도를 해보시길 바랍니다. 


### 3. **불필요한 섹션 제외하기**


요약할 때 특정 섹션이나 제목 수준을 제외하고 싶다면, `exclude_section`과 `exclude_level` 항목을 활용하여 제외할 섹션과 제목 수준을 지정할 수 있습니다. 예를 들어, 레벨 1 헤더(#)를 가지는 섹션과 `참고문헌` 섹션을 제외하고 싶다면 아래와 같이 설정할 수 있습니다.


{% raw %}
```javascript
exclude_section:
  - reference
  - references

exclude_level:
  - 1

```
{% endraw %}


### 4. 요약 스타일 & 레벨 변경하기


요약 결과를 원하는 형식으로 받을 수 있습니다. `summary_style` 항목을 통해 다양한 스타일로 요약할 수 있습니다. 예를 들어, 계층적인 불릿 포인트 목록으로 요약하려면 아래와 같이 설정할 수 있습니다! LLM에게 프롬프트로 전달하는 부분이기 때문에 필요에 따라 유연하게 설정하실 수 있습니다. 


{% raw %}
```javascript
summary_style: hierarchical bullet list
```
{% endraw %}


요약 강도도 다음과 같이 설정할 수 있습니다.  


{% raw %}
```javascript
summary_level: detailed # detailed, medium, concise
```
{% endraw %}


## 기타

- PDF를 마크다운으로 변환하는 게 굉장히 힘들었는데.. 최근 mistral OCR이 출시되면서 해결이 되었네요! mistral OCR 성능이 아주아주 좋습니다!
- 로고가 없으니까 좀 허전한 듯 하여서.. 로고 이미지도 개발했습니다. 로고 이미지는 ChatGPT랑 미리 캔버스를 이용해서 만들었는데 생각보다 그럴 듯 한 것 같네요.
- 한국어로 요약할 때는 ollama를 사용해서 exaone3.5:7.8b 모델을 사용 중인데 역시 한국어 성능은 다른 비슷한 사이즈의 모델보다 훨씬 좋은 것 같습니다!
- 사실 논문을 타겟으로 개발된 거라 논문 이외의 다른 포맷의 문서에서는 성능이 어떨지 잘 모르겠습니다..😅

## 추후 개발 예정


추후 시간이 된다면 streamit을 활용해서 GUI로도 개발해 볼 생각입니다. 시간이..된다면요..


그리고 현재는 이미지가 요약 과정 중에 생략될 때가 있네요! 룰 기반으로 섹션 뒤에 원래 섹션에 있던 이미지를 넣어주는 방식으로 하면 모든 이미지가 출력될 수 있겠지만 그렇게 되면 이미지의 원래 위치 정보가 사라져서 현재는 LLM에게 의존하고 있는데 LLM이 요약 과정 중에 이미지 정보를 날려버리는 경우가 많네요 😭 이미지 태그를 유지시켜달라고 열심히 시스템 프롬프트에 강조를 했으나.. 어쩔 수 없나봅니다. 이 부분은 그냥 추후에 룰 베이스로 이미지 태그를 전부 포함 시키려고 합니다.


---


아직 손 볼 부분은 많지만.. 제가 직접 정리하고 요약했던 걸 LLM을 이용해서 자동화 시키니까 너무 편하네요.. 필요하신 분들은 적극 사용해주시면 감사하겠고, contributor로 같이 개발해주셔도 감사할 것 같습니다! 

