---
title: "[이미지 생성 모델] 1. 생성 모델의 개념과 발전 과정"
date: 2026-11-16 19:00:00 +0900
description: "판별 모델과 생성 모델의 차이, 생성 모델이 이미지를 만드는 두 단계, VAE에서 Flow Matching까지 각 모델이 앞 모델의 한계를 어떻게 넘었는지 정리합니다."
categories: [Generative AI, 이미지 생성 모델]
tags: [Generative AI, VAE, GAN, Diffusion, Flow Matching]
math: true
toc: true
genai: true
genai_no: 1
genai_session: 1
faq:
  - q: "생성 모델과 판별 모델은 무엇이 다른가요?"
    a: "판별 모델은 입력이 주어졌을 때 레이블의 확률 p(y|x)를 배워 입력이 무엇인지 맞힙니다. 생성 모델은 데이터 자체의 분포 p(x)를 배우고, 그 분포에서 샘플을 뽑아 학습 데이터에 없던 새 데이터를 만듭니다."
  - q: "VAE, GAN, Diffusion은 각각 어떤 한계가 있나요?"
    a: "VAE는 결과가 흐릿하게 나오기 쉽습니다. GAN은 선명한 이미지를 만들지만 학습이 불안정하고 비슷한 이미지만 반복해 내는 모드 붕괴가 생길 수 있습니다. Diffusion은 학습이 안정적이고 품질이 좋지만 노이즈를 걷어 내는 단계를 많이 반복해야 해서 생성이 느립니다."
  - q: "Flow Matching은 Diffusion과 무엇이 다른가요?"
    a: "Diffusion은 단계마다 섞인 노이즈를 예측해 걷어 냅니다. Flow Matching은 노이즈에서 이미지로 가는 속도(velocity)를 신경망이 직접 학습합니다. 그중 Rectified Flow는 경로를 곧게 펴서 적은 단계로 생성할 수 있게 했습니다."
  - q: "Stable Diffusion은 어떤 모델인가요?"
    a: "이미지를 압축한 잠재 공간에서 Diffusion을 실행하는 Latent Diffusion을 바탕으로 2022년에 공개된 텍스트-이미지 생성 모델입니다. 2024년에 나온 Stable Diffusion 3는 Transformer 구조와 Rectified Flow를 함께 씁니다."
image:
  path: /assets/img/genai/01/cover.png
  alt: "이미지 생성 모델 시리즈 1편, 생성 모델의 개념과 발전 과정"
---

안녕하세요! 이미지 생성 모델 시리즈의 첫 번째 글입니다. 이번 글에서는 생성 모델의 개념과 이미지 생성 모델의 발전 과정을 소개합니다. 

생성 모델이란 건 무엇일까요? **생성 모델은 데이터의 분포를 배운 뒤 새 샘플을 만드는 모델입니다.** 이 시리즈에서는 이미지 생성 모델의 대표적인 모델인 VAE, GAN, Diffusion부터 최근의 DiT와 Flow Matching까지 각 모델의 원리에 대해서 다룰 예정입니다. 

이번 첫 번째 글에서는 이러한 모델 사이의 관계와 생성 모델의 발전 흐름을 먼저 정리합니다. 지난 10여 년 동안 이미지 생성 모델은 앞선 모델의 한계를 줄이며 발전했습니다. 예를 들면 흐릿한 이미지가 만들어지던 문제를 개선하고, 학습의 불안정성을 줄이고, 생성 속도를 높이는 방향으로 발전해 왔습니다.  

{% include genai/nav.html %}

> **이 글의 핵심**
>
> - 생성 모델은 **데이터 분포를 배우고, 그 분포에서 새 이미지를 뽑는** 모델입니다.
> - 이미지 생성 모델은 **흐릿한 결과(VAE) → 불안정한 학습(GAN) → 느린 생성(Diffusion)이라는** 한계를 차례로 넘으며 발전했습니다.
> - 최근 모델은 **Transformer 구조(DiT)와 Flow Matching 계열 학습 방식을** 함께 씁니다.
{: .prompt-tip }
## 판별 모델과 생성 모델

딥러닝 모델은 하는 일에 따라 판별 모델(discriminative model)과 생성 모델(generative model)로 나눌 수 있습니다.

판별 모델은 **입력의 종류나 특징을 판단**합니다. 손글씨 숫자 이미지를 넣으면 레이블 7을 내놓는 분류 모델이 대표적입니다. 확률로 쓰면 **입력 $$x$$가 주어졌을 때 레이블 $$y$$의 확률 $$p(y \mid x)$$를 배우는 모델**입니다.

<details class="gm-more" markdown="1">
<summary>관련 확률 개념</summary>

- $$p(x)$$: 이미지 $$x$$가 얼마나 그럴듯한지를 나타내는 확률(연속값이면 확률 밀도)입니다.
- $$p(y \mid x)$$: 이미지 $$x$$가 주어졌을 때 레이블이 $$y$$일 확률입니다. 세로 막대 처럼 보이는 | 뒤에 있는 요소가 주어진 조건에 해당합니다. 
- $$p(x \mid c)$$: 조건 $$c$$가 주어졌을 때 이미지 $$x$$의 분포입니다. 예를 들어 글로 이미지를 만드는 모델에서는 프롬프트가 $$c$$입니다.

확률 분포와 샘플링의 기초는 세 번째 글에서 따로 다룰 예정입니다!

</details>

또한, 이미지 분야의 판별 모델은 무엇을 맞히느냐에 따라 다시 나뉩니다.

- **분류:** 이미지 전체가 무엇인지 맞힙니다. 예: ResNet, EfficientNet
- **객체 탐지:** 이미지 속 물체가 어디에 있고 무엇인지 함께 찾습니다. 예: YOLO, Faster R-CNN
- **분할:** 픽셀마다 어느 물체에 속하는지 정합니다. 예: Mask R-CNN, SAM

{% include genai/figs/01-discriminative-tasks.html %}

세 작업은 입력을 해석하는 방식이 다릅니다. 공통점은 **아예 새로운 이미지를 만들지는 않는다는 것입니다.**

반면에 생성 모델은 레이블 대신 **데이터 자체가 어떤 분포를 이루는지, 즉 $$p(x)$$를 배웁니다.**  생성 모델이 데이터의 분포를 배우는 이유는 무엇일까요? 그 이유는 **학습한 분포에서 샘플을 뽑으면 학습 데이터에 없던 새 이미지를 만들 수 있기 때문입니다.** 숫자 7처럼 원하는 종류의 이미지만 만들고 싶으면 조건 $$c$$를 붙인 조건부 분포 $$p(x \mid c)$$를 배웁니다. Stable Diffusion, DALL·E 2, Imagen처럼 글로 설명하면 이미지를 그려 주는 모델이 이 조건부 생성 모델입니다.

{% include genai/figs/01-two-models.html %}

## 분포 학습과 샘플링

생성 모델이 이미지를 만드는 과정은 분포 학습과 샘플링 두 단계로 나눌 수 있습니다.

1. **분포 학습:** 많은 학습 이미지를 바탕으로 그럴듯한 이미지가 이미지 공간의 어디에 몰려 있는지 배웁니다. 손글씨 숫자 데이터라면 7의 형태를 갖춘 이미지와 0의 형태를 갖춘 이미지가 각각 모인 영역을 찾습니다.
2. **샘플링:** 배운 분포에서 무작위로 한 점을 뽑고, 그 점을 이미지로 만듭니다. 뽑을 때마다 다른 점이 뽑히게 되므로 결과도 매번 달라집니다.

> 실제 이미지는 픽셀 수만큼 차원이 있어서, 28×28 흑백 숫자 이미지만 해도 784차원입니다. 아래 그림은 이해를 돕기 위해 이미지를 특징 두 개로 줄여 평면에 놓았다고 가정합니다.
{: .prompt-info }
{% include genai/figs/01-distribution-sampling.html %}

여기서 특별히 조건부 생성에서는 두 번째 단계에서 조건에 맞는 샘플을 뽑습니다. 조건으로 숫자 7을 주면 모델은 학습한 분포 가운데 7에 해당하는 영역에서만 샘플을 뽑습니다. 결과는 매번 달라도 모두 7입니다.

> 텍스트 프롬프트로 이미지를 만드는 모델도 원리는 같습니다. **프롬프트가 조건 역할을 합니다.** 모델에 조건을 넣는 구체적인 방법은 9편에서 다룹니다.
{: .prompt-tip }
## 이미지 생성 모델의 발전 과정

이미지 생성 모델은 앞 세대의 모델의 한계점을 다음 세대가 해결하는 방식으로 발전했습니다. 아래 그림은 세대별 특징과 한계를 정리한 것입니다. 모델들에 대한 자세한 설명은 앞으로 계속 다룰 예정입니다. 이 글에서는 흐름만 알아두시면 됩니다. 

{% include genai/figs/01-generations.html %}

### VAE

VAE(Variational Autoencoder)는 이미지를 저차원 잠재 공간으로 압축했다가 다시 복원하도록 학습하는 모델입니다. 잠재 공간을 정규분포 모양으로 정리해 두기 때문에, **정규분포에서 뽑은 점으로 새 이미지를 만들 수 있습니다.** 다만 **생성 결과가 흐릿하다는 한계가 있었습니다.**

### GAN

GAN(Generative Adversarial Network)은 이미지를 만드는 생성자와 진짜인지 가려내는 판별자를 함께 학습시키는 모델입니다. 판별자를 통과해야 하므로 **VAE보다 훨씬 선명한 이미지를 만들지만** (흐릿한 이미지는 진짜 이미지와 다르기 때문에 판별자가 가짜 이미지라고 쉽게 판별해버릴 가능성이 높습니다. 이를 피하기 위해 생성자는 진짜 이미지처럼 선명한 이미지를 만듭니다.), **두 네트워크의 균형을 맞추기 어려워 학습이 불안정했습니다.**

### Diffusion 모델

Diffusion 모델은 노이즈에서 출발해 노이즈를 조금씩 걷어 내며(디노이징) 이미지를 만드는 모델입니다. **학습이 안정적이고 품질과 다양성도 좋지만**, 노이즈를 걷어 내는 단계를 수십 번에서 많게는 1,000번까지 반복해야 해서 **생성 속도가 느렸습니다**. 2022년에는 압축한 잠재 공간에서 같은 과정을 실행하는 Latent Diffusion이 Stable Diffusion으로 공개되면서 이미지 생성이 대중화되었습니다.

> 세 모델이 각각 어떤 원리로 이미지를 만들고 왜 이런 장단점이 생기는지는 2편에서 그림과 함께 비교합니다.
{: .prompt-info }
### DiT와 Flow Matching

DiT(Diffusion Transformer)는 Diffusion에서 노이즈를 예측하던 U-Net 자리에 Transformer를 넣어, **트랜스포머의 장점인 모델과 데이터를 키울수록 품질이 좋아지는 확장성**을 보였습니다. Flow Matching은 노이즈에서 이미지로 가는 속도(velocity)를 직접 학습하는 방식이고, 그중 Rectified Flow는 경로를 곧게 펴서 **적은 디노이징 단계로 생성**할 수 있게 했습니다. 2024년에 나온 Stable Diffusion 3와 FLUX.1이 두 방향을 함께 쓰며, DiT는 13편, Flow Matching은 14편에서 다룹니다.

## 활용 분야와 확장 방향

**이미지 생성 모델은 여러 산업에서 쓰입니다.** 온라인 쇼핑몰에서는 상품 사진의 배경을 바꾸거나 한 상품을 여러 연출로 만드는 데 쓰고, 패션에서는 옷 사진을 모델이 입은 모습으로 합성하는 가상 피팅에 씁니다. 게임에서는 콘셉트 아트와 배경 텍스처의 초안을 빠르게 만드는 데 쓰입니다. 의료처럼 학습 데이터를 모으기 어려운 분야에서는 CT나 MRI 영상을 합성해 부족한 학습 데이터를 보강하는 연구가 이어지고 있습니다.

생성 대상도 정지 이미지를 넘어 점점 넓어지고 있습니다.

{% include genai/figs/01-extensions.html %}

비디오는 1분 안팎의 짧은 클립에서는 높은 품질을 보이지만, 긴 영상에서 인물과 장면을 일관되게 유지하는 일은 아직 풀어야 할 과제입니다. 3D에서는 여러 시점의 2D 이미지를 먼저 만들고 이를 바탕으로 3D 형상을 복원하는 방식이 많이 쓰입니다. 비디오와 3D 생성은 15편에서 자세히 다룹니다.

## 요약

- 판별 모델은 입력이 주어졌을 때의 레이블 분포 $$p(y \mid x)$$를 배우고, **생성 모델은 데이터 분포 $$p(x)$$를 배웁니다.**
- 생성 모델은 분포를 배운 뒤 그 분포에서 샘플을 뽑아 새 이미지를 만들고, 조건을 주면 조건에 맞는 영역에서만 뽑습니다.
- **VAE는 흐릿한 결과, GAN은 불안정한 학습, Diffusion은 느린 생성**이라는 한계를 남겼고, 다음 세대 모델이 이를 차례로 줄여 왔습니다.
- 최근 모델은 Transformer 구조(DiT)와 Flow Matching 계열 학습 방식을 함께 써서 확장성과 생성 속도를 높였습니다.
- 이미지 생성 기술은 비디오, 3D, 편집으로 넓어지고 있습니다.

## 자주 묻는 질문

{% include genai/faq.html %}

다음 편에서는 VAE, GAN, Diffusion을 나란히 놓고 각 모델이 이미지를 만드는 방식과 장단점을 비교합니다.

{% include genai/pager.html %}

{% include genai/cta.html %}

## 참고 문헌

- Kingma, D. P., & Welling, M. (2013). Auto-Encoding Variational Bayes. arXiv:1312.6114.
- Goodfellow, I. et al. (2014). Generative Adversarial Nets. NeurIPS.
- Sohl-Dickstein, J. et al. (2015). Deep Unsupervised Learning using Nonequilibrium Thermodynamics. ICML.
- Ho, J., Jain, A., & Abbeel, P. (2020). Denoising Diffusion Probabilistic Models. NeurIPS.
- Rombach, R. et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models. CVPR.
- Peebles, W., & Xie, S. (2023). Scalable Diffusion Models with Transformers. ICCV.
- Lipman, Y. et al. (2023). Flow Matching for Generative Modeling. ICLR.
- Liu, X., Gong, C., & Liu, Q. (2023). Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow. ICLR.
- Esser, P. et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis. ICML.
