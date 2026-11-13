---
title: "[이미지 생성 모델 1] 생성 모델이란: VAE부터 Flow Matching까지 발전 흐름"
description: "판별 모델과 생성 모델의 차이, 생성 모델이 이미지를 만드는 두 단계, VAE에서 Flow Matching까지 각 모델이 앞 모델의 한계를 어떻게 넘었는지 정리합니다."
categories: [Generative AI, 이미지 생성 모델]
tags: [Generative AI, VAE, GAN, Diffusion, Flow Matching]
math: true
toc: true
genai: true
genai_no: 1
genai_session: 1
---

이번 글에서는 생성 모델이 무엇인지, 그리고 이미지 생성 모델이 어떤 순서로 발전해 왔는지 소개하겠습니다. 이 시리즈는 VAE, GAN, Diffusion을 거쳐 최근의 DiT와 Flow Matching까지 이미지 생성 모델의 원리를 한 편씩 정리하는데, 첫 편에서는 그 전체 지도를 먼저 그립니다. 결론부터 말하면 생성 모델은 데이터가 어떤 모양으로 퍼져 있는지(분포)를 배운 뒤 그 분포에서 새 샘플을 뽑는 모델입니다. 그리고 지난 10여 년 동안 나온 모델들은 대부분 바로 앞 세대가 남긴 문제, 즉 흐릿한 결과와 불안정한 학습과 느린 생성을 하나씩 줄이며 등장했습니다.

{% include genai/nav.html %}

## 판별 모델과 생성 모델

딥러닝 모델은 하는 일에 따라 판별 모델(discriminative model)과 생성 모델(generative model)로 나눌 수 있습니다.

판별 모델은 입력을 보고 그것이 무엇인지 답합니다. 손글씨 숫자 이미지를 넣으면 레이블 7을 내놓는 분류 모델이 대표적입니다. 확률로 쓰면 입력 $$x$$가 주어졌을 때 레이블 $$y$$의 확률 $$p(y \mid x)$$를 배우는 모델입니다. 이미지 분야의 판별 모델은 무엇을 맞히느냐에 따라 다시 나뉩니다.

- **분류:** 이미지 전체가 무엇인지 맞힙니다. 예: ResNet, EfficientNet
- **객체 탐지:** 이미지 속 물체가 어디에 있고 무엇인지 함께 찾습니다. 예: YOLO, Faster R-CNN
- **분할:** 픽셀마다 어느 물체에 속하는지 정합니다. 예: Mask R-CNN, SAM

세 작업은 입력을 해석하는 방식이 다를 뿐, 새 이미지를 만들어 내지는 못한다는 점이 같습니다.

생성 모델은 방향이 반대입니다. 레이블을 맞히는 대신 데이터 자체가 어떤 분포를 이루는지, 즉 $$p(x)$$를 배웁니다. 분포를 알면 그 분포에서 새 샘플을 뽑을 수 있고, 뽑은 샘플이 학습 데이터에 없던 새 이미지가 됩니다. 숫자 7처럼 원하는 종류의 이미지만 만들고 싶으면 조건 $$c$$를 붙인 조건부 분포 $$p(x \mid c)$$를 배웁니다. Stable Diffusion, DALL·E 2, Imagen처럼 글로 설명하면 이미지를 그려 주는 모델이 이 조건부 생성 모델입니다.

{% include genai/figs/01-two-models.html %}

## 생성 모델이 이미지를 만드는 두 단계

생성 모델이 이미지를 만드는 과정은 분포 학습과 샘플링 두 단계로 나눌 수 있습니다.

1. **분포 학습:** 학습 이미지를 많이 보면서, 그럴듯한 이미지가 이미지 공간의 어디에 몰려 있는지 배웁니다. 손글씨 숫자 데이터라면 7다운 이미지들이 모인 영역과 0다운 이미지들이 모인 영역을 찾는 일입니다.
2. **샘플링:** 배운 분포에서 무작위로 한 점을 뽑고, 그 점을 이미지로 만듭니다. 뽑을 때마다 다른 점이 나오므로 결과도 매번 달라집니다.

실제 이미지는 픽셀 수만큼 차원이 있어서, 28×28 흑백 숫자 이미지만 해도 784차원입니다. 아래 그림은 이해를 돕기 위해 이미지를 특징 두 개로 줄여 평면에 놓았다고 가정합니다.

{% include genai/figs/01-distribution-sampling.html %}

조건부 생성은 두 번째 단계에 조건을 더한 것입니다. 조건으로 숫자 7을 주면 모델은 학습한 분포 가운데 7에 해당하는 영역에서만 샘플을 뽑습니다. 그래서 결과는 매번 다르지만 모두 7입니다. 텍스트 프롬프트로 이미지를 만드는 모델도 원리는 같고, 프롬프트가 조건 역할을 합니다. 모델에 조건을 넣는 구체적인 방법은 9편에서 다룹니다.

## 앞 모델의 한계를 넘으며 이어진 흐름

이미지 생성 모델은 앞 세대가 남긴 문제를 다음 세대가 푸는 방식으로 발전해 왔습니다. 전체 흐름을 그림으로 먼저 보고, 세대별로 짧게 정리하겠습니다.

{% include genai/figs/01-generations.html %}

### VAE: 샘플링의 길을 열었지만 흐릿한 결과

2013년에 제안된 VAE(Variational Autoencoder)는 이미지를 저차원 잠재 공간(latent space)으로 압축했다가 다시 복원하도록 학습합니다. 이때 잠재 공간이 정규분포를 따르도록 함께 학습하기 때문에, 정규분포에서 뽑은 임의의 잠재 벡터로도 새 이미지를 만들 수 있습니다. 대신 결과가 흐릿하게 나온다는 한계가 있습니다. VAE 계열에서는 이후 VQ-VAE, β-VAE처럼 잠재 공간의 형태나 학습 목표를 바꾼 변형이 이어졌습니다. 결과가 흐려지는 이유는 4편과 5편에서 손실 함수를 보며 설명합니다.

### GAN: 선명한 이미지, 불안정한 학습

2014년에 나온 GAN(Generative Adversarial Network)은 이미지를 만드는 생성자(generator)와, 진짜 이미지와 생성된 이미지를 가려내는 판별자(discriminator)를 서로 경쟁시키며 학습합니다. 여기서 판별자는 앞에서 본 판별 모델과 같은 종류의 네트워크이고, GAN 안에서는 생성자를 가르치는 역할을 맡습니다. 생성자는 판별자를 속일 만큼 그럴듯한 이미지를 만들어야 하므로, VAE보다 훨씬 선명한 결과가 나옵니다. StyleGAN은 실제 사진과 구분하기 어려운 고해상도 얼굴 이미지로 주목받았고, Pix2Pix는 스케치를 사진으로 바꾸는 것처럼 한 이미지를 다른 이미지로 변환하는 데 쓰였습니다.

문제는 학습이 불안정하다는 점입니다. 두 네트워크의 균형이 깨지면 학습이 흔들리고, 생성자가 판별자를 잘 속이는 몇 가지 이미지만 되풀이해 내놓는 모드 붕괴(mode collapse)가 생기기도 합니다. GAN의 구조와 이 문제는 6편과 7편에서 다룹니다.

### Diffusion: 안정적이고 품질도 좋지만 느린 생성

Diffusion 모델은 이미지에 노이즈를 조금씩 더해 완전한 노이즈로 만드는 과정을 정해 두고, 그 반대 방향인 노이즈 제거를 신경망이 배우게 합니다. 생성할 때는 순수한 노이즈에서 출발해 노이즈를 한 단계씩 걷어 냅니다. 아이디어는 2015년에 나왔고, 2020년 DDPM이 높은 품질을 보이면서 본격적으로 주목받았습니다. 두 네트워크를 경쟁시키지 않아 학습이 안정적이고, 품질과 다양성도 함께 좋습니다.

대신 느립니다. 노이즈를 걷어 내는 단계를 수십 번에서 많게는 1,000번까지 반복해야 이미지 한 장이 나옵니다. 2022년에는 압축된 잠재 공간에서 Diffusion을 돌리는 Latent Diffusion이 Stable Diffusion이라는 공개 모델로 나오면서, 누구나 고품질 이미지를 직접 만들어 볼 수 있게 되었습니다. Diffusion의 원리는 8편, Stable Diffusion의 구조는 10편, 생성 속도를 높이는 방법은 12편에서 다룹니다.

### DiT와 Flow Matching: 더 크게, 더 적은 단계로

최근 모델들은 Diffusion을 두 방향으로 바꿨습니다. 첫째는 구조입니다. DiT(Diffusion Transformer)는 Diffusion에서 노이즈를 예측하던 U-Net 자리에 Transformer를 넣었고, 모델을 키울수록 품질이 꾸준히 좋아지는 확장성을 보여 주었습니다. 둘째는 학습 방식입니다. Flow Matching과 Rectified Flow는 노이즈에서 이미지로 가는 경로가 곧아지도록 학습해, 더 적은 단계로 이미지를 만들 수 있게 합니다.

2024년에 나온 Stable Diffusion 3와 FLUX.1은 두 방향을 합친 모델로, Transformer 구조를 Rectified Flow 방식으로 학습합니다. 비디오 생성 모델 Sora도 Diffusion Transformer 구조를 씁니다. DiT는 13편, Flow Matching은 14편에서 다룹니다.

| 계열 | 등장 | 대표 모델 | 특징과 한계 |
|---|---|---|---|
| VAE | 2013 | VQ-VAE, β-VAE | 잠재 공간에서 샘플링 가능, 결과가 흐릿함 |
| GAN | 2014 | Pix2Pix, ProGAN, StyleGAN | 선명한 이미지, 학습이 불안정하고 모드 붕괴 |
| Diffusion | 2015 (DDPM 2020) | DALL·E 2, Imagen, Stable Diffusion | 안정적인 학습과 높은 품질, 생성이 느림 |
| DiT, Flow Matching | 2022 | Stable Diffusion 3, FLUX.1, Sora | 모델을 키울수록 좋아지는 구조, 적은 단계로 생성 |

## 쓰이는 곳과 넓어지는 방향

이미지 생성 모델은 이미 여러 산업에서 쓰입니다. 온라인 쇼핑몰에서는 상품 사진의 배경을 바꾸거나 한 상품을 여러 연출로 만드는 데 쓰고, 패션에서는 옷 사진을 모델이 입은 모습으로 합성하는 가상 피팅에 씁니다. 게임에서는 컨셉 아트와 배경 텍스처의 초안을 빠르게 만드는 데 쓰입니다. 의료처럼 학습 데이터를 모으기 어려운 분야에서는 CT나 MRI 영상을 합성해 부족한 학습 데이터를 보강하는 연구가 이어지고 있습니다.

생성 대상도 정지 이미지를 넘어 넓어지고 있습니다.

| 방향 | 하는 일 | 대표 모델 |
|---|---|---|
| 비디오 | 텍스트나 이미지로 짧은 영상 생성 | Sora, Runway Gen-3 Alpha, Kling |
| 3D | 텍스트나 이미지로 3D 형상 생성 | DreamFusion, Point-E, Shap-E |
| 편집 | 기존 이미지의 일부만 고치거나 형태를 바꿈 | 인페인팅, DragGAN, InstantID |

비디오는 1분 안팎의 짧은 클립에서는 높은 품질을 보이지만, 긴 영상에서 인물과 장면을 일관되게 유지하는 일은 아직 풀어야 할 과제입니다. 3D에서는 여러 시점의 2D 이미지를 먼저 만들고 이를 바탕으로 3D 형상을 복원하는 방식이 많이 쓰입니다. 비디오와 3D 생성은 15편에서 자세히 다룹니다.

## 정리

- 판별 모델은 입력이 주어졌을 때의 레이블 분포 $$p(y \mid x)$$를 배우고, 생성 모델은 데이터 분포 $$p(x)$$를 배웁니다.
- 생성 모델은 분포를 배운 뒤 그 분포에서 샘플을 뽑아 새 이미지를 만들고, 조건을 주면 조건에 맞는 영역에서만 뽑습니다.
- VAE는 흐릿한 결과, GAN은 불안정한 학습, Diffusion은 느린 생성이라는 한계를 남겼고, 다음 세대 모델이 이를 차례로 줄여 왔습니다.
- 최근 모델은 Transformer 구조(DiT)와 적은 단계로 생성하는 학습 방식(Flow Matching)을 함께 씁니다.
- 이미지 생성 기술은 비디오, 3D, 편집으로 넓어지고 있습니다.

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
