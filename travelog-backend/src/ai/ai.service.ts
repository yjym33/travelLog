import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {
    this.logger.log('자체 AI 이미지 분석 서비스가 초기화되었습니다.');
  }

  /**
   * 사진을 분석하여 자동 태그를 생성합니다.
   * @param imageUrl 분석할 이미지 URL
   * @returns 생성된 태그 배열
   */
  async analyzeImage(imageUrl: string): Promise<string[]> {
    try {
      this.logger.log(`이미지 분석 시작: ${imageUrl}`);

      // 이미지 메타데이터 기반 분석
      const tags = this.analyzeImageMetadata(imageUrl);

      this.logger.log(`이미지 분석 완료: ${tags.join(', ')}`);
      return tags;
    } catch (error) {
      this.logger.error(
        `이미지 분석 실패, 시뮬레이션 모드로 폴백: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
      return await this.simulateImageAnalysis(imageUrl);
    }
  }

  /**
   * 일기 텍스트를 분석하여 감정을 추출합니다.
   * @param diaryText 분석할 일기 텍스트
   * @returns 감정 분석 결과
   */
  async analyzeEmotion(diaryText: string): Promise<{
    emotion: string;
    confidence: number;
    keywords: string[];
  }> {
    try {
      this.logger.log(`감정 분석 시작: ${diaryText.substring(0, 50)}...`);

      const result = await this.simulateEmotionAnalysis(diaryText);

      this.logger.log(
        `감정 분석 완료: ${result.emotion} (${result.confidence})`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `감정 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
      throw new Error('감정 분석에 실패했습니다.');
    }
  }

  /**
   * 이미지 메타데이터 기반 분석
   */
  private analyzeImageMetadata(imageUrl: string): string[] {
    const tags: string[] = [];
    const url = imageUrl.toLowerCase();

    // URL 패턴 분석
    const urlPatterns = this.analyzeUrlPatterns(url);
    tags.push(...urlPatterns);

    // 파일명 분석
    const filenamePatterns = this.analyzeFilenamePatterns(imageUrl);
    tags.push(...filenamePatterns);

    // 기본 태그 추가
    if (tags.length === 0) {
      tags.push('#여행', '#추억', '#기록');
    }

    return [...new Set(tags)].slice(0, 10); // 중복 제거 및 최대 10개
  }

  /**
   * URL 패턴 분석
   */
  private analyzeUrlPatterns(url: string): string[] {
    const tags: string[] = [];

    // 장소 관련 패턴
    const placePatterns = [
      { pattern: /mountain|산|hill|peak/, tags: ['#산', '#자연', '#등산'] },
      {
        pattern: /beach|바다|sea|ocean|coast/,
        tags: ['#바다', '#해변', '#자연'],
      },
      {
        pattern: /city|도시|urban|downtown/,
        tags: ['#도시', '#건물', '#도시풍경'],
      },
      {
        pattern: /cafe|카페|coffee|coffeeshop/,
        tags: ['#카페', '#커피', '#휴식'],
      },
      {
        pattern: /restaurant|음식|food|dining/,
        tags: ['#음식', '#맛집', '#요리'],
      },
      { pattern: /park|공원|garden|park/, tags: ['#공원', '#자연', '#휴식'] },
      { pattern: /temple|사원|church|교회/, tags: ['#사원', '#종교', '#평온'] },
      { pattern: /bridge|다리|bridge/, tags: ['#다리', '#건축', '#경치'] },
      { pattern: /lake|호수|pond/, tags: ['#호수', '#자연', '#평온'] },
      { pattern: /river|강|stream/, tags: ['#강', '#자연', '#물'] },
    ];

    for (const { pattern, tags: patternTags } of placePatterns) {
      if (pattern.test(url)) {
        tags.push(...patternTags);
      }
    }

    // 시간 관련 패턴
    const timePatterns = [
      { pattern: /sunset|노을|evening/, tags: ['#노을', '#일몰', '#저녁'] },
      { pattern: /sunrise|일출|morning/, tags: ['#일출', '#아침', '#새벽'] },
      { pattern: /night|밤|evening|dark/, tags: ['#야경', '#밤', '#불빛'] },
      { pattern: /day|낮|sunny|bright/, tags: ['#낮', '#햇빛', '#밝음'] },
    ];

    for (const { pattern, tags: patternTags } of timePatterns) {
      if (pattern.test(url)) {
        tags.push(...patternTags);
      }
    }

    // 감정 관련 패턴
    const emotionPatterns = [
      { pattern: /happy|행복|smile|joy/, tags: ['#행복', '#웃음', '#기쁨'] },
      {
        pattern: /peaceful|평온|calm|quiet/,
        tags: ['#평온', '#조용함', '#휴식'],
      },
      {
        pattern: /adventure|모험|adventure|exciting/,
        tags: ['#모험', '#도전', '#신남'],
      },
      {
        pattern: /romantic|로맨틱|love|couple/,
        tags: ['#로맨틱', '#사랑', '#달콤함'],
      },
      {
        pattern: /nostalgic|그리움|memory|past/,
        tags: ['#그리움', '#추억', '#과거'],
      },
    ];

    for (const { pattern, tags: patternTags } of emotionPatterns) {
      if (pattern.test(url)) {
        tags.push(...patternTags);
      }
    }

    return tags;
  }

  /**
   * 파일명 패턴 분석
   */
  private analyzeFilenamePatterns(imageUrl: string): string[] {
    const tags: string[] = [];

    try {
      const url = new URL(imageUrl);
      const pathname = url.pathname.toLowerCase();
      const filename = pathname.split('/').pop() || '';

      // 날짜 패턴 분석 (YYYY-MM-DD, YYYYMMDD 등)
      const datePatterns = [
        /(\d{4})[-_](\d{1,2})[-_](\d{1,2})/, // YYYY-MM-DD 또는 YYYY_MM_DD
        /(\d{4})(\d{2})(\d{2})/, // YYYYMMDD
        /(\d{1,2})[-_](\d{1,2})[-_](\d{4})/, // MM-DD-YYYY 또는 MM_DD_YYYY
      ];

      for (const pattern of datePatterns) {
        if (pattern.test(filename)) {
          tags.push('#날짜', '#기록', '#추억');
          break;
        }
      }

      // 시간 패턴 분석 (HHMM, HH-MM 등)
      const timePatterns = [
        /(\d{1,2})[-_](\d{2})/, // HH-MM 또는 HH_MM
        /(\d{4})/, // HHMM
      ];

      for (const pattern of timePatterns) {
        if (pattern.test(filename)) {
          tags.push('#시간', '#순간', '#기록');
          break;
        }
      }

      // 장소명 패턴 분석
      const locationPatterns = [
        { pattern: /seoul|서울/, tags: ['#서울', '#한국', '#도시'] },
        { pattern: /busan|부산/, tags: ['#부산', '#한국', '#바다'] },
        { pattern: /jeju|제주/, tags: ['#제주', '#한국', '#섬'] },
        { pattern: /tokyo|도쿄/, tags: ['#도쿄', '#일본', '#도시'] },
        { pattern: /osaka|오사카/, tags: ['#오사카', '#일본', '#도시'] },
        { pattern: /kyoto|교토/, tags: ['#교토', '#일본', '#전통'] },
        { pattern: /paris|파리/, tags: ['#파리', '#프랑스', '#로맨틱'] },
        { pattern: /london|런던/, tags: ['#런던', '#영국', '#도시'] },
        { pattern: /newyork|뉴욕/, tags: ['#뉴욕', '#미국', '#도시'] },
        {
          pattern: /singapore|싱가포르/,
          tags: ['#싱가포르', '#아시아', '#도시'],
        },
      ];

      for (const { pattern, tags: patternTags } of locationPatterns) {
        if (pattern.test(filename)) {
          tags.push(...patternTags);
          break;
        }
      }

      // 카메라/기기 패턴 분석
      const devicePatterns = [
        { pattern: /iphone|아이폰/, tags: ['#아이폰', '#모바일', '#사진'] },
        { pattern: /samsung|삼성/, tags: ['#삼성', '#모바일', '#사진'] },
        { pattern: /canon|캐논/, tags: ['#캐논', '#카메라', '#사진'] },
        { pattern: /nikon|니콘/, tags: ['#니콘', '#카메라', '#사진'] },
        { pattern: /sony|소니/, tags: ['#소니', '#카메라', '#사진'] },
        { pattern: /gopro|고프로/, tags: ['#고프로', '#액션캠', '#모험'] },
      ];

      for (const { pattern, tags: patternTags } of devicePatterns) {
        if (pattern.test(filename)) {
          tags.push(...patternTags);
          break;
        }
      }

      // 이벤트/활동 패턴 분석
      const activityPatterns = [
        {
          pattern: /wedding|결혼|wedding/,
          tags: ['#결혼', '#축하', '#특별한날'],
        },
        {
          pattern: /birthday|생일|birthday/,
          tags: ['#생일', '#축하', '#특별한날'],
        },
        {
          pattern: /travel|여행|trip/,
          tags: ['#여행', '#모험', '#새로운경험'],
        },
        { pattern: /vacation|휴가|holiday/, tags: ['#휴가', '#휴식', '#여행'] },
        {
          pattern: /party|파티|celebration/,
          tags: ['#파티', '#축하', '#즐거움'],
        },
        {
          pattern: /concert|콘서트|music/,
          tags: ['#콘서트', '#음악', '#즐거움'],
        },
        { pattern: /sport|운동|fitness/, tags: ['#운동', '#건강', '#활동'] },
        { pattern: /hiking|등산|climbing/, tags: ['#등산', '#자연', '#모험'] },
        { pattern: /swimming|수영|pool/, tags: ['#수영', '#물', '#활동'] },
        { pattern: /cooking|요리|kitchen/, tags: ['#요리', '#음식', '#집'] },
      ];

      for (const { pattern, tags: patternTags } of activityPatterns) {
        if (pattern.test(filename)) {
          tags.push(...patternTags);
          break;
        }
      }
    } catch (error) {
      this.logger.warn('파일명 분석 중 오류 발생:', error);
    }

    return tags;
  }

  /**
   * 이미지 분석 시뮬레이션 (폴백용)
   */
  private async simulateImageAnalysis(imageUrl: string): Promise<string[]> {
    // 실제 구현에서는 Google Vision API, AWS Rekognition 등을 사용
    await new Promise((resolve) => setTimeout(resolve, 1000)); // API 호출 시뮬레이션

    // 이미지 URL 패턴에 따른 시뮬레이션된 태그 생성
    const url = imageUrl.toLowerCase();
    const tags: string[] = [];

    // 장소 관련 태그
    if (url.includes('mountain') || url.includes('산')) {
      tags.push('#산', '#자연', '#등산');
    }
    if (url.includes('beach') || url.includes('바다') || url.includes('sea')) {
      tags.push('#바다', '#해변', '#자연');
    }
    if (
      url.includes('city') ||
      url.includes('도시') ||
      url.includes('building')
    ) {
      tags.push('#도시', '#건물', '#도시풍경');
    }
    if (
      url.includes('cafe') ||
      url.includes('카페') ||
      url.includes('coffee')
    ) {
      tags.push('#카페', '#커피', '#휴식');
    }
    if (
      url.includes('food') ||
      url.includes('음식') ||
      url.includes('restaurant')
    ) {
      tags.push('#음식', '#맛집', '#요리');
    }

    // 시간 관련 태그
    if (
      url.includes('sunset') ||
      url.includes('노을') ||
      url.includes('sunrise')
    ) {
      tags.push('#노을', '#일출', '#일몰');
    }
    if (
      url.includes('night') ||
      url.includes('밤') ||
      url.includes('evening')
    ) {
      tags.push('#야경', '#밤', '#불빛');
    }

    // 감정 관련 태그
    if (
      url.includes('happy') ||
      url.includes('행복') ||
      url.includes('smile')
    ) {
      tags.push('#행복', '#웃음', '#기쁨');
    }
    if (
      url.includes('peaceful') ||
      url.includes('평온') ||
      url.includes('calm')
    ) {
      tags.push('#평온', '#조용함', '#휴식');
    }

    // 기본 태그 (항상 포함)
    if (tags.length === 0) {
      tags.push('#여행', '#추억', '#기록');
    }

    return tags.slice(0, 5); // 최대 5개 태그
  }

  /**
   * 감정 분석 시뮬레이션 (실제 구현 시 AI API로 교체)
   */
  private async simulateEmotionAnalysis(diaryText: string): Promise<{
    emotion: string;
    confidence: number;
    keywords: string[];
  }> {
    // 실제 구현에서는 Google Natural Language API, AWS Comprehend 등을 사용
    await new Promise((resolve) => setTimeout(resolve, 800)); // API 호출 시뮬레이션

    const text = diaryText.toLowerCase();
    const keywords: string[] = [];

    // 감정 키워드 분석
    let emotion = 'happy';
    let confidence = 0.7;

    if (
      text.includes('행복') ||
      text.includes('기쁨') ||
      text.includes('웃음') ||
      text.includes('즐거')
    ) {
      emotion = 'happy';
      confidence = 0.9;
      keywords.push('행복', '기쁨');
    } else if (
      text.includes('평온') ||
      text.includes('조용') ||
      text.includes('차분') ||
      text.includes('안정')
    ) {
      emotion = 'peaceful';
      confidence = 0.85;
      keywords.push('평온', '조용함');
    } else if (
      text.includes('신남') ||
      text.includes('흥분') ||
      text.includes('재미') ||
      text.includes('놀라')
    ) {
      emotion = 'excited';
      confidence = 0.8;
      keywords.push('신남', '흥분');
    } else if (
      text.includes('그리움') ||
      text.includes('아쉬') ||
      text.includes('추억') ||
      text.includes('과거')
    ) {
      emotion = 'nostalgic';
      confidence = 0.75;
      keywords.push('그리움', '추억');
    } else if (
      text.includes('모험') ||
      text.includes('새로') ||
      text.includes('도전') ||
      text.includes('시도')
    ) {
      emotion = 'adventurous';
      confidence = 0.8;
      keywords.push('모험', '도전');
    } else if (
      text.includes('사랑') ||
      text.includes('로맨틱') ||
      text.includes('달콤') ||
      text.includes('특별')
    ) {
      emotion = 'romantic';
      confidence = 0.85;
      keywords.push('사랑', '로맨틱');
    }

    return {
      emotion,
      confidence,
      keywords: keywords.slice(0, 3),
    };
  }
}
