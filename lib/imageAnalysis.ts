import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

// 이미지 분석 결과 타입
export interface ImageAnalysisResult {
  tags: string[];
  confidence: number;
  dominantColors: string[];
  imageType: string;
  brightness: "dark" | "normal" | "bright";
  composition: string[];
}

class ImageAnalysisService {
  private model: mobilenet.MobileNet | null = null;
  private isModelLoading = false;

  // 모델 로드
  private async loadModel(): Promise<mobilenet.MobileNet> {
    if (this.model) return this.model;

    if (this.isModelLoading) {
      // 모델이 로딩 중이면 대기
      while (this.isModelLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.model!;
    }

    this.isModelLoading = true;
    try {
      console.log("TensorFlow.js 모델 로딩 중...");
      this.model = await mobilenet.load();
      console.log("모델 로딩 완료");
      return this.model;
    } catch (error) {
      console.error("모델 로딩 실패:", error);
      throw new Error("AI 모델을 로드할 수 없습니다.");
    } finally {
      this.isModelLoading = false;
    }
  }

  // 이미지 URL을 Canvas로 변환
  private async loadImageToCanvas(
    imageUrl: string
  ): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      // CORS 설정을 조건부로 적용
      if (
        imageUrl.startsWith("http://localhost") ||
        imageUrl.startsWith("https://")
      ) {
        img.crossOrigin = "anonymous";
      }

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas context를 가져올 수 없습니다."));
          return;
        }

        // 이미지 크기 조정 (MobileNet은 224x224 입력을 기대)
        const maxSize = 224;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas);
      };

      img.onerror = (error) => {
        console.error("이미지 로딩 실패:", error, "URL:", imageUrl);
        reject(new Error(`이미지를 로드할 수 없습니다: ${imageUrl}`));
      };

      img.src = imageUrl;
    });
  }

  // 색상 분석
  private analyzeColors(canvas: HTMLCanvasElement): string[] {
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const colorCounts: { [key: string]: number } = {};

    // 샘플링 (성능을 위해 일부 픽셀만 분석)
    const sampleRate = 10;
    for (let i = 0; i < data.length; i += 4 * sampleRate) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // 색상 범주화
      const colorCategory = this.categorizeColor(r, g, b);
      colorCounts[colorCategory] = (colorCounts[colorCategory] || 0) + 1;
    }

    // 가장 많이 나타나는 색상들 반환
    return Object.entries(colorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([color]) => color);
  }

  // 색상 범주화
  private categorizeColor(r: number, g: number, b: number): string {
    const brightness = (r + g + b) / 3;

    if (brightness < 50) return "검정";
    if (brightness > 200) return "흰색";

    // 색상 휴도 계산
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (delta < 30) return "회색";

    const hue = this.getHue(r, g, b, max, delta);

    if (hue < 15 || hue > 345) return "빨강";
    if (hue < 45) return "주황";
    if (hue < 75) return "노랑";
    if (hue < 165) return "초록";
    if (hue < 195) return "청록";
    if (hue < 255) return "파랑";
    if (hue < 285) return "보라";
    if (hue < 315) return "자주";

    return "기타";
  }

  // HSV 색상 공간에서 휴도 계산
  private getHue(
    r: number,
    g: number,
    b: number,
    max: number,
    delta: number
  ): number {
    if (delta === 0) return 0;

    let hue = 0;
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }

    return (hue * 60 + 360) % 360;
  }

  // 이미지 밝기 분석
  private analyzeBrightness(
    canvas: HTMLCanvasElement
  ): "dark" | "normal" | "bright" {
    const ctx = canvas.getContext("2d");
    if (!ctx) return "normal";

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let totalBrightness = 0;
    let pixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalBrightness += (r + g + b) / 3;
      pixelCount++;
    }

    const averageBrightness = totalBrightness / pixelCount;

    if (averageBrightness < 85) return "dark";
    if (averageBrightness > 170) return "bright";
    return "normal";
  }

  // 이미지 구성 분석
  private analyzeComposition(canvas: HTMLCanvasElement): string[] {
    const { width, height } = canvas;
    const aspectRatio = width / height;
    const composition: string[] = [];

    // 비율 분석
    if (Math.abs(aspectRatio - 1) < 0.1) {
      composition.push("정사각형");
    } else if (aspectRatio > 1.5) {
      composition.push("가로형");
    } else if (aspectRatio < 0.7) {
      composition.push("세로형");
    } else {
      composition.push("일반형");
    }

    // 크기 분석
    const totalPixels = width * height;
    if (totalPixels < 50000) {
      composition.push("작은이미지");
    } else if (totalPixels > 200000) {
      composition.push("큰이미지");
    }

    return composition;
  }

  // 이미지 타입 분석
  private analyzeImageType(canvas: HTMLCanvasElement): string {
    const { width, height } = canvas;
    const aspectRatio = width / height;

    // 간단한 휴리스틱으로 이미지 타입 추정
    if (Math.abs(aspectRatio - 16 / 9) < 0.1) return "와이드스크린";
    if (Math.abs(aspectRatio - 4 / 3) < 0.1) return "표준";
    if (Math.abs(aspectRatio - 1) < 0.1) return "정사각형";
    if (aspectRatio > 2) return "파노라마";
    if (aspectRatio < 0.5) return "세로형";

    return "일반";
  }

  // 영어 태그를 한국어로 변환
  private translateToKorean(englishTags: string[]): string[] {
    const translationMap: { [key: string]: string[] } = {
      // 자연
      nature: ["#자연", "#풍경"],
      landscape: ["#풍경", "#자연"],
      mountain: ["#산", "#자연", "#등산"],
      beach: ["#바다", "#해변", "#자연"],
      ocean: ["#바다", "#해변", "#자연"],
      sea: ["#바다", "#해변", "#자연"],
      forest: ["#숲", "#자연", "#나무"],
      tree: ["#나무", "#자연", "#숲"],
      flower: ["#꽃", "#자연", "#아름다움"],
      sky: ["#하늘", "#구름", "#자연"],
      cloud: ["#구름", "#하늘", "#자연"],
      water: ["#물", "#자연", "#시원함"],
      lake: ["#호수", "#자연", "#평온"],
      river: ["#강", "#자연", "#물"],
      snow: ["#눈", "#겨울", "#차가움"],
      ice: ["#얼음", "#겨울", "#차가움"],
      desert: ["#사막", "#뜨거움", "#모험"],

      // 건물/도시
      building: ["#건물", "#도시", "#건축"],
      city: ["#도시", "#건물", "#도시풍경"],
      architecture: ["#건축", "#건물", "#디자인"],
      bridge: ["#다리", "#건축", "#경치"],
      temple: ["#사원", "#종교", "#평온"],
      church: ["#교회", "#종교", "#건축"],
      castle: ["#성", "#역사", "#건축"],

      // 음식
      food: ["#음식", "#맛집", "#요리"],
      restaurant: ["#음식", "#맛집", "#요리"],
      cafe: ["#카페", "#커피", "#휴식"],
      coffee: ["#커피", "#카페", "#휴식"],
      cake: ["#케이크", "#디저트", "#달콤함"],
      bread: ["#빵", "#음식", "#아침"],

      // 교통
      car: ["#자동차", "#교통", "#여행"],
      train: ["#기차", "#교통", "#여행"],
      airplane: ["#비행기", "#여행", "#하늘"],
      boat: ["#배", "#바다", "#여행"],
      bicycle: ["#자전거", "#운동", "#자연"],
      motorcycle: ["#오토바이", "#교통", "#모험"],

      // 사람/활동
      person: ["#사람", "#인물", "#인간"],
      people: ["#사람들", "#인물", "#인간"],
      child: ["#아이", "#어린이", "#순수함"],
      family: ["#가족", "#사랑", "#행복"],
      couple: ["#커플", "#사랑", "#로맨틱"],
      smile: ["#웃음", "#행복", "#기쁨"],
      happy: ["#행복", "#기쁨", "#웃음"],

      // 동물
      dog: ["#강아지", "#동물", "#귀여움"],
      cat: ["#고양이", "#동물", "#귀여움"],
      bird: ["#새", "#동물", "#자유"],
      fish: ["#물고기", "#동물", "#바다"],

      // 시간대
      sunset: ["#노을", "#일몰", "#저녁"],
      sunrise: ["#일출", "#아침", "#새벽"],
      night: ["#야경", "#밤", "#불빛"],
      day: ["#낮", "#햇빛", "#밝음"],

      // 감정/분위기
      peaceful: ["#평온", "#조용함", "#휴식"],
      adventure: ["#모험", "#도전", "#신남"],
      romantic: ["#로맨틱", "#사랑", "#달콤함"],
      nostalgic: ["#그리움", "#추억", "#과거"],
      inspired: ["#영감", "#창의", "#깨달음"],
      grateful: ["#감사", "#고마움", "#행복"],
    };

    const koreanTags: string[] = [];

    for (const tag of englishTags) {
      const cleanTag = tag.toLowerCase().replace(/[^a-z]/g, "");
      if (translationMap[cleanTag]) {
        koreanTags.push(...translationMap[cleanTag]);
      }
    }

    return [...new Set(koreanTags)]; // 중복 제거
  }

  // 메타데이터 기반 분석 (폴백용)
  private analyzeImageMetadata(imageUrl: string): string[] {
    const tags: string[] = [];
    const url = imageUrl.toLowerCase();

    // URL 패턴 분석
    const urlPatterns = [
      { pattern: /mountain|산|hill|peak/, tags: ["#산", "#자연", "#등산"] },
      {
        pattern: /beach|바다|sea|ocean|coast/,
        tags: ["#바다", "#해변", "#자연"],
      },
      {
        pattern: /city|도시|urban|downtown/,
        tags: ["#도시", "#건물", "#도시풍경"],
      },
      {
        pattern: /cafe|카페|coffee|coffeeshop/,
        tags: ["#카페", "#커피", "#휴식"],
      },
      {
        pattern: /restaurant|음식|food|dining/,
        tags: ["#음식", "#맛집", "#요리"],
      },
      { pattern: /park|공원|garden/, tags: ["#공원", "#자연", "#휴식"] },
      { pattern: /temple|사원|church|교회/, tags: ["#사원", "#종교", "#평온"] },
      { pattern: /bridge|다리/, tags: ["#다리", "#건축", "#경치"] },
      { pattern: /lake|호수|pond/, tags: ["#호수", "#자연", "#평온"] },
      { pattern: /river|강|stream/, tags: ["#강", "#자연", "#물"] },
      { pattern: /sunset|노을|evening/, tags: ["#노을", "#일몰", "#저녁"] },
      { pattern: /sunrise|일출|morning/, tags: ["#일출", "#아침", "#새벽"] },
      { pattern: /night|밤|evening|dark/, tags: ["#야경", "#밤", "#불빛"] },
      { pattern: /day|낮|sunny|bright/, tags: ["#낮", "#햇빛", "#밝음"] },
      { pattern: /happy|행복|smile|joy/, tags: ["#행복", "#웃음", "#기쁨"] },
      {
        pattern: /peaceful|평온|calm|quiet/,
        tags: ["#평온", "#조용함", "#휴식"],
      },
      { pattern: /adventure|모험|exciting/, tags: ["#모험", "#도전", "#신남"] },
      {
        pattern: /romantic|로맨틱|love|couple/,
        tags: ["#로맨틱", "#사랑", "#달콤함"],
      },
      {
        pattern: /nostalgic|그리움|memory|past/,
        tags: ["#그리움", "#추억", "#과거"],
      },
    ];

    for (const { pattern, tags: patternTags } of urlPatterns) {
      if (pattern.test(url)) {
        tags.push(...patternTags);
      }
    }

    // 파일명 패턴 분석
    try {
      const urlObj = new URL(imageUrl);
      const pathname = urlObj.pathname.toLowerCase();
      const filename = pathname.split("/").pop() || "";

      // 날짜 패턴
      if (
        /\d{4}[-_]\d{1,2}[-_]\d{1,2}/.test(filename) ||
        /\d{8}/.test(filename)
      ) {
        tags.push("#날짜", "#기록", "#추억");
      }

      // 장소명 패턴
      const locationPatterns = [
        { pattern: /seoul|서울/, tags: ["#서울", "#한국", "#도시"] },
        { pattern: /busan|부산/, tags: ["#부산", "#한국", "#바다"] },
        { pattern: /jeju|제주/, tags: ["#제주", "#한국", "#섬"] },
        { pattern: /tokyo|도쿄/, tags: ["#도쿄", "#일본", "#도시"] },
        { pattern: /osaka|오사카/, tags: ["#오사카", "#일본", "#도시"] },
        { pattern: /kyoto|교토/, tags: ["#교토", "#일본", "#전통"] },
        { pattern: /paris|파리/, tags: ["#파리", "#프랑스", "#로맨틱"] },
        { pattern: /london|런던/, tags: ["#런던", "#영국", "#도시"] },
        { pattern: /newyork|뉴욕/, tags: ["#뉴욕", "#미국", "#도시"] },
        {
          pattern: /singapore|싱가포르/,
          tags: ["#싱가포르", "#아시아", "#도시"],
        },
      ];

      for (const { pattern, tags: patternTags } of locationPatterns) {
        if (pattern.test(filename)) {
          tags.push(...patternTags);
          break;
        }
      }
    } catch (error) {
      console.warn("파일명 분석 중 오류:", error);
    }

    // 기본 태그 추가
    if (tags.length === 0) {
      tags.push("#여행", "#추억", "#기록");
    }

    return [...new Set(tags)].slice(0, 10); // 중복 제거 및 최대 10개
  }

  // 메인 분석 함수
  async analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
    try {
      console.log("이미지 분석 시작:", imageUrl);

      // 모델 로드 시도
      let model: mobilenet.MobileNet | null = null;
      try {
        model = await this.loadModel();
        console.log("TensorFlow.js 모델 로드 성공");
      } catch (modelError) {
        console.warn(
          "TensorFlow.js 모델 로드 실패, 메타데이터 분석으로 폴백:",
          modelError
        );
      }

      // 이미지를 Canvas로 변환 시도
      let canvas: HTMLCanvasElement | null = null;
      try {
        canvas = await this.loadImageToCanvas(imageUrl);
        console.log("이미지 Canvas 변환 성공");
      } catch (canvasError) {
        console.warn(
          "이미지 Canvas 변환 실패, 메타데이터 분석으로 폴백:",
          canvasError
        );
      }

      let predictions: any[] = [];
      let koreanTags: string[] = [];
      let dominantColors: string[] = [];
      let brightness: "dark" | "normal" | "bright" = "normal";
      let composition: string[] = [];
      let imageType = "일반";

      // TensorFlow.js 분석 (가능한 경우)
      if (model && canvas) {
        try {
          predictions = await model.classify(canvas);
          console.log("MobileNet 분석 완료:", predictions.length, "개 예측");

          // 신뢰도가 높은 예측만 선택
          const highConfidencePredictions = predictions
            .filter((pred) => pred.probability > 0.3)
            .map((pred) => pred.className);

          // 한국어 태그로 변환
          koreanTags = this.translateToKorean(highConfidencePredictions);

          // 추가 분석
          dominantColors = this.analyzeColors(canvas);
          brightness = this.analyzeBrightness(canvas);
          composition = this.analyzeComposition(canvas);
          imageType = this.analyzeImageType(canvas);
        } catch (analysisError) {
          console.warn("TensorFlow.js 분석 실패:", analysisError);
        }
      }

      // 메타데이터 기반 분석 (폴백)
      if (koreanTags.length === 0) {
        console.log("메타데이터 기반 분석 시작");
        koreanTags = this.analyzeImageMetadata(imageUrl);
      }

      // 색상 기반 태그 추가
      const colorTags = dominantColors.map((color) => `#${color}`);

      // 밝기 기반 태그 추가
      const brightnessTags =
        brightness === "dark"
          ? ["#어둠", "#밤"]
          : brightness === "bright"
          ? ["#밝음", "#햇빛"]
          : [];

      // 모든 태그 결합
      const allTags = [...koreanTags, ...colorTags, ...brightnessTags];

      // 중복 제거 및 최대 15개로 제한
      const uniqueTags = [...new Set(allTags)].slice(0, 15);

      const result: ImageAnalysisResult = {
        tags: uniqueTags,
        confidence:
          predictions.length > 0
            ? Math.max(...predictions.map((p) => p.probability))
            : 0.7,
        dominantColors,
        imageType,
        brightness,
        composition,
      };

      console.log("이미지 분석 완료:", result);
      return result;
    } catch (error) {
      console.error("이미지 분석 실패:", error);

      // 최종 폴백: 기본 태그 반환
      console.log("최종 폴백: 기본 태그 반환");
      return {
        tags: ["#여행", "#추억", "#기록"],
        confidence: 0.5,
        dominantColors: [],
        imageType: "일반",
        brightness: "normal",
        composition: [],
      };
    }
  }
}

// 싱글톤 인스턴스
export const imageAnalysisService = new ImageAnalysisService();
