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

// 디바이스 성능 정보 타입
interface DeviceInfo {
  isHighEnd: boolean;
  isMidRange: boolean;
  isLowEnd: boolean;
  gpuMemory: number;
  cpuCores: number;
  availableMemory: number;
}

// 성능 메트릭 타입
interface PerformanceMetrics {
  loadTime: number;
  modelSize?: string;
  deviceInfo?: DeviceInfo;
  error?: string;
  success: boolean;
}

class ImageAnalysisService {
  private model: mobilenet.MobileNet | null = null;
  private isModelLoading = false;

  // WebGL 지원 확인
  private checkWebGLSupport(): { supported: boolean; context: string | null } {
    try {
      const canvas = document.createElement("canvas");

      // WebGL 1.0 지원 확인
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

      if (gl) {
        return { supported: true, context: "webgl1" };
      }

      // WebGL 2.0 지원 확인
      const gl2 = canvas.getContext("webgl2");
      if (gl2) {
        return { supported: true, context: "webgl2" };
      }

      return { supported: false, context: null };
    } catch (e) {
      console.warn("WebGL 지원 확인 실패:", e);
      return { supported: false, context: null };
    }
  }

  // 디바이스 성능 감지
  private detectDeviceCapabilities(): DeviceInfo {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");

    // GPU 메모리 추정
    const gpuMemory = gl ? this.estimateGPUMemory(gl) : 0;

    // CPU 코어 수
    const cpuCores = navigator.hardwareConcurrency || 2;

    // 사용 가능한 메모리 (대략적)
    const availableMemory = (navigator as any).deviceMemory || 4;

    return {
      isHighEnd: gpuMemory > 1000 && cpuCores >= 8 && availableMemory >= 8,
      isMidRange: gpuMemory > 500 && cpuCores >= 4 && availableMemory >= 4,
      isLowEnd: gpuMemory > 100 && cpuCores >= 2 && availableMemory >= 2,
      gpuMemory,
      cpuCores,
      availableMemory,
    };
  }

  // GPU 메모리 추정
  private estimateGPUMemory(gl: WebGLRenderingContext): number {
    try {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        // GPU별 메모리 추정 로직
        if (renderer.includes("NVIDIA")) return 2000;
        if (renderer.includes("AMD")) return 1500;
        if (renderer.includes("Intel")) return 500;
        if (renderer.includes("Apple")) return 1000;
      }
    } catch (e) {
      console.warn("GPU 메모리 추정 실패:", e);
    }
    return 500; // 기본값
  }

  // 최적 모델 설정 선택
  private selectOptimalModel(attempt: number = 1): any {
    const deviceInfo = this.detectDeviceCapabilities();

    // 시도별 다른 설정 (점진적 경량화)
    const modelConfigs = [
      // 첫 번째 시도: 디바이스 성능에 맞는 모델
      deviceInfo.isHighEnd
        ? { version: 2, alpha: 1.0 }
        : deviceInfo.isMidRange
        ? { version: 2, alpha: 0.75 }
        : deviceInfo.isLowEnd
        ? { version: 2, alpha: 0.5 }
        : { version: 2, alpha: 0.25 },

      // 두 번째 시도: 중간 품질
      { version: 2, alpha: 0.5 },

      // 세 번째 시도: 최소 크기
      { version: 2, alpha: 0.25 },
    ];

    return modelConfigs[Math.min(attempt - 1, modelConfigs.length - 1)];
  }

  // 모델 크기 정보
  private getModelSize(alpha: number): string {
    const sizes: { [key: number]: string } = {
      1.0: "16.9MB",
      0.75: "12.6MB",
      0.5: "8.4MB",
      0.25: "4.2MB",
    };
    return sizes[alpha] || "알 수 없음";
  }

  // 성능 메트릭 저장
  private savePerformanceMetrics(metrics: PerformanceMetrics): void {
    try {
      // 로컬 스토리지에 성능 데이터 저장
      const existingData = JSON.parse(
        localStorage.getItem("ai-performance") || "[]"
      );
      existingData.push({
        ...metrics,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });

      // 최근 100개만 유지
      if (existingData.length > 100) {
        existingData.splice(0, existingData.length - 100);
      }

      localStorage.setItem("ai-performance", JSON.stringify(existingData));
    } catch (e) {
      console.warn("성능 메트릭 저장 실패:", e);
    }
  }

  // 재시도 메커니즘으로 모델 로드
  private async loadModelWithRetry(
    maxRetries: number = 3
  ): Promise<mobilenet.MobileNet> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`TensorFlow.js 모델 로딩 시도 ${attempt}/${maxRetries}`);

        // 시도별 다른 설정
        const modelConfig = this.selectOptimalModel(attempt);
        console.log(`모델 설정:`, modelConfig);

        const modelPromise = mobilenet.load(modelConfig);

        // 시도별 다른 타임아웃 (점진적 증가)
        const timeoutMs = 10000 * attempt; // 10초, 20초, 30초
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(new Error(`모델 로드 타임아웃 (${timeoutMs / 1000}초)`)),
            timeoutMs
          )
        );

        this.model = await Promise.race([modelPromise, timeoutPromise]);

        const modelSize = this.getModelSize(modelConfig.alpha);
        console.log(`모델 로딩 성공 (시도 ${attempt}) - 크기: ${modelSize}`);
        return this.model;
      } catch (error) {
        console.warn(`모델 로딩 실패 (시도 ${attempt}):`, error);

        if (attempt === maxRetries) {
          throw new Error(`모델 로딩 실패 (${maxRetries}회 시도 후 포기)`);
        }

        // 지수 백오프 (Exponential Backoff)
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`${delayMs / 1000}초 후 재시도...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw new Error("모델 로딩 실패");
  }

  // 최적화된 모델 로드
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
    const startTime = performance.now();

    try {
      // 1. WebGL 지원 확인
      const webglInfo = this.checkWebGLSupport();
      if (!webglInfo.supported) {
        throw new Error(
          "WebGL을 지원하지 않는 브라우저입니다. 메타데이터 분석을 사용합니다."
        );
      }

      console.log(`WebGL 지원 확인: ${webglInfo.context}`);

      // 2. TensorFlow.js 백엔드 설정
      await tf.setBackend("webgl");
      await tf.ready();
      console.log(`TensorFlow.js 백엔드: ${tf.getBackend()}`);

      // 3. 디바이스 성능 정보 출력
      const deviceInfo = this.detectDeviceCapabilities();
      console.log("디바이스 성능 정보:", deviceInfo);

      // 4. 재시도 메커니즘으로 모델 로드
      this.model = await this.loadModelWithRetry(3);

      const loadTime = performance.now() - startTime;
      console.log(`모델 로딩 완료 - 소요시간: ${loadTime.toFixed(2)}ms`);

      // 5. 성능 메트릭 저장 (실제 사용된 모델 크기)
      const actualModelConfig = this.selectOptimalModel(1); // 첫 번째 시도에서 사용된 설정
      this.savePerformanceMetrics({
        loadTime,
        modelSize: this.getModelSize(actualModelConfig.alpha),
        deviceInfo,
        success: true,
      });

      return this.model;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      console.error("모델 로딩 실패:", error);

      // 실패 메트릭 저장
      this.savePerformanceMetrics({
        loadTime,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
        success: false,
      });

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

    // URL 패턴 분석 (강화된 버전)
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
      // 추가 패턴들
      {
        pattern: /travel|여행|trip|vacation/,
        tags: ["#여행", "#모험", "#새로운경험"],
      },
      { pattern: /family|가족|family/, tags: ["#가족", "#사랑", "#행복"] },
      { pattern: /friend|친구|friends/, tags: ["#친구", "#추억", "#즐거움"] },
      {
        pattern: /wedding|결혼|wedding/,
        tags: ["#결혼", "#축하", "#특별한날"],
      },
      {
        pattern: /birthday|생일|birthday/,
        tags: ["#생일", "#축하", "#특별한날"],
      },
      {
        pattern: /concert|콘서트|music/,
        tags: ["#콘서트", "#음악", "#즐거움"],
      },
      { pattern: /sport|운동|fitness/, tags: ["#운동", "#건강", "#활동"] },
      { pattern: /hiking|등산|climbing/, tags: ["#등산", "#자연", "#모험"] },
      { pattern: /swimming|수영|pool/, tags: ["#수영", "#물", "#활동"] },
      { pattern: /cooking|요리|kitchen/, tags: ["#요리", "#음식", "#집"] },
      {
        pattern: /art|예술|museum|gallery/,
        tags: ["#예술", "#문화", "#아름다움"],
      },
      {
        pattern: /festival|축제|celebration/,
        tags: ["#축제", "#즐거움", "#문화"],
      },
      { pattern: /winter|겨울|snow|cold/, tags: ["#겨울", "#눈", "#차가움"] },
      { pattern: /summer|여름|sun|hot/, tags: ["#여름", "#태양", "#뜨거움"] },
      {
        pattern: /autumn|가을|fall|leaves/,
        tags: ["#가을", "#단풍", "#아름다움"],
      },
      { pattern: /spring|봄|blossom|flower/, tags: ["#봄", "#꽃", "#새싹"] },
    ];

    for (const { pattern, tags: patternTags } of urlPatterns) {
      if (pattern.test(url)) {
        tags.push(...patternTags);
      }
    }

    // 파일명 패턴 분석 (강화된 버전)
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

      // 시간 패턴
      if (/\d{1,2}[-_]\d{2}/.test(filename) || /\d{4}/.test(filename)) {
        tags.push("#시간", "#순간", "#기록");
      }

      // 장소명 패턴 (더 많은 도시 추가)
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
        { pattern: /bangkok|방콕/, tags: ["#방콕", "#태국", "#도시"] },
        { pattern: /taipei|타이페이/, tags: ["#타이페이", "#대만", "#도시"] },
        { pattern: /hongkong|홍콩/, tags: ["#홍콩", "#중국", "#도시"] },
        { pattern: /shanghai|상하이/, tags: ["#상하이", "#중국", "#도시"] },
        { pattern: /beijing|베이징/, tags: ["#베이징", "#중국", "#역사"] },
        { pattern: /sydney|시드니/, tags: ["#시드니", "#호주", "#바다"] },
        { pattern: /melbourne|멜버른/, tags: ["#멜버른", "#호주", "#도시"] },
        { pattern: /vancouver|밴쿠버/, tags: ["#밴쿠버", "#캐나다", "#자연"] },
        { pattern: /toronto|토론토/, tags: ["#토론토", "#캐나다", "#도시"] },
        { pattern: /berlin|베를린/, tags: ["#베를린", "#독일", "#역사"] },
        { pattern: /munich|뮌헨/, tags: ["#뮌헨", "#독일", "#맥주"] },
        { pattern: /rome|로마/, tags: ["#로마", "#이탈리아", "#역사"] },
        { pattern: /milan|밀라노/, tags: ["#밀라노", "#이탈리아", "#패션"] },
        {
          pattern: /barcelona|바르셀로나/,
          tags: ["#바르셀로나", "#스페인", "#건축"],
        },
        { pattern: /madrid|마드리드/, tags: ["#마드리드", "#스페인", "#도시"] },
        {
          pattern: /amsterdam|암스테르담/,
          tags: ["#암스테르담", "#네덜란드", "#운하"],
        },
        { pattern: /vienna|비엔나/, tags: ["#비엔나", "#오스트리아", "#음악"] },
        { pattern: /prague|프라하/, tags: ["#프라하", "#체코", "#아름다움"] },
        {
          pattern: /budapest|부다페스트/,
          tags: ["#부다페스트", "#헝가리", "#온천"],
        },
        { pattern: /istanbul|이스탄불/, tags: ["#이스탄불", "#터키", "#역사"] },
        { pattern: /dubai|두바이/, tags: ["#두바이", "#UAE", "#현대"] },
        { pattern: /mumbai|뭄바이/, tags: ["#뭄바이", "#인도", "#영화"] },
        { pattern: /delhi|델리/, tags: ["#델리", "#인도", "#역사"] },
        { pattern: /bangkok|방콕/, tags: ["#방콕", "#태국", "#음식"] },
        { pattern: /phuket|푸켓/, tags: ["#푸켓", "#태국", "#바다"] },
        { pattern: /bali|발리/, tags: ["#발리", "#인도네시아", "#자연"] },
        {
          pattern: /jakarta|자카르타/,
          tags: ["#자카르타", "#인도네시아", "#도시"],
        },
        {
          pattern: /kuala|쿠알라룸푸르/,
          tags: ["#쿠알라룸푸르", "#말레이시아", "#도시"],
        },
        { pattern: /manila|마닐라/, tags: ["#마닐라", "#필리핀", "#도시"] },
        { pattern: /hochiminh|호치민/, tags: ["#호치민", "#베트남", "#음식"] },
        { pattern: /hanoi|하노이/, tags: ["#하노이", "#베트남", "#역사"] },
        { pattern: /seoul|서울/, tags: ["#서울", "#한국", "#K팝"] },
        { pattern: /busan|부산/, tags: ["#부산", "#한국", "#영화제"] },
        { pattern: /jeju|제주/, tags: ["#제주", "#한국", "#휴양지"] },
      ];

      for (const { pattern, tags: patternTags } of locationPatterns) {
        if (pattern.test(filename)) {
          tags.push(...patternTags);
          break;
        }
      }

      // 카메라/기기 패턴
      const devicePatterns = [
        { pattern: /iphone|아이폰/, tags: ["#아이폰", "#모바일", "#사진"] },
        { pattern: /samsung|삼성/, tags: ["#삼성", "#모바일", "#사진"] },
        { pattern: /canon|캐논/, tags: ["#캐논", "#카메라", "#사진"] },
        { pattern: /nikon|니콘/, tags: ["#니콘", "#카메라", "#사진"] },
        { pattern: /sony|소니/, tags: ["#소니", "#카메라", "#사진"] },
        { pattern: /gopro|고프로/, tags: ["#고프로", "#액션캠", "#모험"] },
        {
          pattern: /fujifilm|후지필름/,
          tags: ["#후지필름", "#카메라", "#사진"],
        },
        { pattern: /leica|라이카/, tags: ["#라이카", "#카메라", "#고급"] },
        {
          pattern: /olympus|올림푸스/,
          tags: ["#올림푸스", "#카메라", "#사진"],
        },
        {
          pattern: /panasonic|파나소닉/,
          tags: ["#파나소닉", "#카메라", "#사진"],
        },
      ];

      for (const { pattern, tags: patternTags } of devicePatterns) {
        if (pattern.test(filename)) {
          tags.push(...patternTags);
          break;
        }
      }

      // 이벤트/활동 패턴 (강화된 버전)
      const activityPatterns = [
        {
          pattern: /wedding|결혼|wedding/,
          tags: ["#결혼", "#축하", "#특별한날"],
        },
        {
          pattern: /birthday|생일|birthday/,
          tags: ["#생일", "#축하", "#특별한날"],
        },
        {
          pattern: /travel|여행|trip/,
          tags: ["#여행", "#모험", "#새로운경험"],
        },
        { pattern: /vacation|휴가|holiday/, tags: ["#휴가", "#휴식", "#여행"] },
        {
          pattern: /party|파티|celebration/,
          tags: ["#파티", "#축하", "#즐거움"],
        },
        {
          pattern: /concert|콘서트|music/,
          tags: ["#콘서트", "#음악", "#즐거움"],
        },
        { pattern: /sport|운동|fitness/, tags: ["#운동", "#건강", "#활동"] },
        { pattern: /hiking|등산|climbing/, tags: ["#등산", "#자연", "#모험"] },
        { pattern: /swimming|수영|pool/, tags: ["#수영", "#물", "#활동"] },
        { pattern: /cooking|요리|kitchen/, tags: ["#요리", "#음식", "#집"] },
        { pattern: /dancing|춤|dance/, tags: ["#춤", "#예술", "#즐거움"] },
        { pattern: /singing|노래|sing/, tags: ["#노래", "#음악", "#즐거움"] },
        { pattern: /reading|독서|book/, tags: ["#독서", "#지식", "#휴식"] },
        {
          pattern: /writing|글쓰기|write/,
          tags: ["#글쓰기", "#창작", "#표현"],
        },
        { pattern: /painting|그림|paint/, tags: ["#그림", "#예술", "#창작"] },
        {
          pattern: /photography|사진|photo/,
          tags: ["#사진", "#예술", "#기록"],
        },
        { pattern: /gaming|게임|game/, tags: ["#게임", "#재미", "#도전"] },
        { pattern: /shopping|쇼핑|shop/, tags: ["#쇼핑", "#구매", "#즐거움"] },
        { pattern: /study|공부|learn/, tags: ["#공부", "#학습", "#성장"] },
        { pattern: /work|일|job/, tags: ["#일", "#직장", "#성취"] },
        { pattern: /meeting|회의|meet/, tags: ["#회의", "#업무", "#소통"] },
        {
          pattern: /interview|면접|interview/,
          tags: ["#면접", "#도전", "#기회"],
        },
        {
          pattern: /graduation|졸업|graduate/,
          tags: ["#졸업", "#성취", "#새시작"],
        },
        {
          pattern: /promotion|승진|promote/,
          tags: ["#승진", "#성취", "#자랑"],
        },
        {
          pattern: /retirement|은퇴|retire/,
          tags: ["#은퇴", "#새시작", "#자유"],
        },
        {
          pattern: /anniversary|기념일|anniversary/,
          tags: ["#기념일", "#특별", "#추억"],
        },
        {
          pattern: /holiday|휴일|holiday/,
          tags: ["#휴일", "#휴식", "#즐거움"],
        },
        {
          pattern: /weekend|주말|weekend/,
          tags: ["#주말", "#휴식", "#즐거움"],
        },
        {
          pattern: /morning|아침|morning/,
          tags: ["#아침", "#새시작", "#에너지"],
        },
        { pattern: /evening|저녁|evening/, tags: ["#저녁", "#휴식", "#평온"] },
        { pattern: /night|밤|night/, tags: ["#밤", "#평온", "#휴식"] },
      ];

      for (const { pattern, tags: patternTags } of activityPatterns) {
        if (pattern.test(filename)) {
          tags.push(...patternTags);
          break;
        }
      }
    } catch (error) {
      console.warn("파일명 분석 중 오류:", error);
    }

    // 기본 태그 추가 (더 다양하게)
    if (tags.length === 0) {
      const defaultTags = [
        ["#여행", "#추억", "#기록"],
        ["#모험", "#새로운경험", "#즐거움"],
        ["#자연", "#풍경", "#아름다움"],
        ["#사람", "#인간", "#관계"],
        ["#음식", "#맛집", "#요리"],
        ["#문화", "#예술", "#아름다움"],
        ["#도시", "#건축", "#현대"],
        ["#휴식", "#평온", "#조용함"],
        ["#활동", "#운동", "#건강"],
        ["#학습", "#성장", "#발전"],
      ];
      const randomDefault =
        defaultTags[Math.floor(Math.random() * defaultTags.length)];
      tags.push(...randomDefault);
    }

    return [...new Set(tags)].slice(0, 15); // 중복 제거 및 최대 15개
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

// 성능 분석 유틸리티 함수들
export const performanceUtils = {
  // 성능 데이터 조회
  getPerformanceData: (): PerformanceMetrics[] => {
    try {
      return JSON.parse(localStorage.getItem("ai-performance") || "[]");
    } catch (e) {
      console.warn("성능 데이터 조회 실패:", e);
      return [];
    }
  },

  // 성공률 계산
  getSuccessRate: (): number => {
    const data = performanceUtils.getPerformanceData();
    if (data.length === 0) return 0;

    const successCount = data.filter((d) => d.success).length;
    return (successCount / data.length) * 100;
  },

  // 평균 로딩 시간 계산
  getAverageLoadTime: (): number => {
    const data = performanceUtils.getPerformanceData();
    if (data.length === 0) return 0;

    const successData = data.filter((d) => d.success);
    if (successData.length === 0) return 0;

    const totalTime = successData.reduce((sum, d) => sum + d.loadTime, 0);
    return totalTime / successData.length;
  },

  // 디바이스별 성능 분석
  getDevicePerformance: (): { [key: string]: any } => {
    const data = performanceUtils.getPerformanceData();
    const deviceStats: { [key: string]: any } = {};

    data.forEach((d) => {
      if (d.deviceInfo) {
        const deviceType = d.deviceInfo.isHighEnd
          ? "high-end"
          : d.deviceInfo.isMidRange
          ? "mid-range"
          : d.deviceInfo.isLowEnd
          ? "low-end"
          : "unknown";

        if (!deviceStats[deviceType]) {
          deviceStats[deviceType] = { count: 0, success: 0, totalTime: 0 };
        }

        deviceStats[deviceType].count++;
        if (d.success) deviceStats[deviceType].success++;
        deviceStats[deviceType].totalTime += d.loadTime;
      }
    });

    // 성공률과 평균 시간 계산
    Object.keys(deviceStats).forEach((deviceType) => {
      const stats = deviceStats[deviceType];
      stats.successRate = (stats.success / stats.count) * 100;
      stats.averageTime = stats.totalTime / stats.count;
    });

    return deviceStats;
  },

  // 성능 데이터 초기화
  clearPerformanceData: (): void => {
    localStorage.removeItem("ai-performance");
  },

  // 성능 리포트 생성
  generateReport: (): string => {
    const data = performanceUtils.getPerformanceData();
    const successRate = performanceUtils.getSuccessRate();
    const avgLoadTime = performanceUtils.getAverageLoadTime();
    const deviceStats = performanceUtils.getDevicePerformance();

    let report = `=== AI 이미지 분석 성능 리포트 ===\n`;
    report += `총 시도 횟수: ${data.length}\n`;
    report += `성공률: ${successRate.toFixed(1)}%\n`;
    report += `평균 로딩 시간: ${avgLoadTime.toFixed(2)}ms\n\n`;

    report += `=== 디바이스별 성능 ===\n`;
    Object.keys(deviceStats).forEach((deviceType) => {
      const stats = deviceStats[deviceType];
      report += `${deviceType}: ${
        stats.count
      }회 시도, ${stats.successRate.toFixed(
        1
      )}% 성공, ${stats.averageTime.toFixed(2)}ms 평균\n`;
    });

    return report;
  },
};

// 개발자 도구용 디버그 함수 (전역에서 접근 가능)
if (typeof window !== "undefined") {
  (window as any).aiDebug = {
    // 성능 데이터 조회
    getPerformance: () => performanceUtils.getPerformanceData(),

    // 성공률 확인
    getSuccessRate: () => performanceUtils.getSuccessRate(),

    // 평균 로딩 시간 확인
    getAverageTime: () => performanceUtils.getAverageLoadTime(),

    // 디바이스별 성능 확인
    getDeviceStats: () => performanceUtils.getDevicePerformance(),

    // 성능 리포트 생성
    getReport: () => performanceUtils.generateReport(),

    // 성능 데이터 초기화
    clearData: () => performanceUtils.clearPerformanceData(),

    // 현재 디바이스 정보 확인
    getDeviceInfo: () => {
      const service = new ImageAnalysisService();
      return (service as any).detectDeviceCapabilities();
    },

    // WebGL 지원 확인
    checkWebGL: () => {
      const service = new ImageAnalysisService();
      return (service as any).checkWebGLSupport();
    },
  };

  console.log("🔧 AI 디버그 도구가 활성화되었습니다!");
  console.log("사용법: aiDebug.getReport() - 성능 리포트 확인");
  console.log("사용법: aiDebug.getDeviceInfo() - 디바이스 정보 확인");
  console.log("사용법: aiDebug.checkWebGL() - WebGL 지원 확인");
}

// 싱글톤 인스턴스
export const imageAnalysisService = new ImageAnalysisService();
