"use client";

import { useRef, useEffect } from "react";
import type { TravelLog, Emotion } from "@/types/travel";
import type { ShareImageTemplate } from "@/types/share";

interface ShareImageGeneratorProps {
  travelLog: TravelLog;
  emotion: Emotion;
  template: ShareImageTemplate;
  platform: "instagram" | "twitter" | "facebook";
  onGenerated: (blob: Blob) => void;
}

export default function ShareImageGenerator({
  travelLog,
  emotion,
  template,
  platform,
  onGenerated,
}: ShareImageGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateImage();
  }, [travelLog, template, platform]);

  const generateImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 플랫폼별 이미지 크기 설정
    const sizes = {
      instagram: { width: 1080, height: 1080 },
      twitter: { width: 1200, height: 675 },
      facebook: { width: 1200, height: 630 },
    };

    const size = sizes[platform];
    canvas.width = size.width;
    canvas.height = size.height;

    // 배경 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, size.width, size.height);
    gradient.addColorStop(0, emotion.color + "CC");
    gradient.addColorStop(1, emotion.color + "66");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size.width, size.height);

    // 템플릿별 레이아웃
    switch (template) {
      case "minimal":
        await drawMinimalTemplate(ctx, size, travelLog, emotion);
        break;
      case "vibrant":
        await drawVibrantTemplate(ctx, size, travelLog, emotion);
        break;
      case "classic":
        await drawClassicTemplate(ctx, size, travelLog, emotion);
        break;
      case "modern":
        await drawModernTemplate(ctx, size, travelLog, emotion);
        break;
    }

    // Canvas를 Blob으로 변환
    canvas.toBlob((blob) => {
      if (blob) {
        onGenerated(blob);
      }
    }, "image/png");
  };

  // 미니멀 템플릿
  const drawMinimalTemplate = async (
    ctx: CanvasRenderingContext2D,
    size: { width: number; height: number },
    log: TravelLog,
    emotion: Emotion
  ) => {
    // 중앙에 장소명
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 80px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(log.placeName, size.width / 2, size.height / 2 - 50);

    // 감정 이모지
    ctx.font = "120px sans-serif";
    ctx.fillText(emotion.emoji, size.width / 2, size.height / 2 + 100);

    // 국가와 날짜
    ctx.font = "40px sans-serif";
    ctx.fillStyle = "#ffffffDD";
    ctx.fillText(
      `${log.country} · ${log.createdAt}`,
      size.width / 2,
      size.height / 2 + 220
    );

    // Travelog 로고
    ctx.font = "30px sans-serif";
    ctx.fillStyle = "#ffffffAA";
    ctx.fillText("Travelog", size.width / 2, size.height - 80);
  };

  // 화려한 템플릿
  const drawVibrantTemplate = async (
    ctx: CanvasRenderingContext2D,
    size: { width: number; height: number },
    log: TravelLog,
    emotion: Emotion
  ) => {
    // 배경 패턴
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
      const x = Math.random() * size.width;
      const y = Math.random() * size.height;
      const radius = Math.random() * 100 + 50;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 상단 장소명
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 90px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(log.placeName, size.width / 2, 150);

    // 중앙 감정
    ctx.font = "200px sans-serif";
    ctx.fillText(emotion.emoji, size.width / 2, size.height / 2 + 50);

    // 태그들
    ctx.font = "35px sans-serif";
    ctx.fillStyle = "#ffffffEE";
    const tagsText = log.tags.slice(0, 3).join(" ");
    ctx.fillText(tagsText, size.width / 2, size.height - 200);

    // 브랜드
    ctx.font = "bold 40px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Travelog 🌍", size.width / 2, size.height - 100);
  };

  // 클래식 템플릿
  const drawClassicTemplate = async (
    ctx: CanvasRenderingContext2D,
    size: { width: number; height: number },
    log: TravelLog,
    emotion: Emotion
  ) => {
    // 프레임 효과
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 20;
    ctx.strokeRect(40, 40, size.width - 80, size.height - 80);

    // 장소명
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 70px serif";
    ctx.textAlign = "center";
    ctx.fillText(log.placeName, size.width / 2, 200);

    // 구분선
    ctx.beginPath();
    ctx.moveTo(size.width / 2 - 200, 250);
    ctx.lineTo(size.width / 2 + 200, 250);
    ctx.strokeStyle = "#ffffffCC";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 감정
    ctx.font = "150px sans-serif";
    ctx.fillText(emotion.emoji, size.width / 2, size.height / 2 + 50);

    // 감정 라벨
    ctx.font = "45px serif";
    ctx.fillStyle = "#ffffffDD";
    ctx.fillText(emotion.label, size.width / 2, size.height / 2 + 150);

    // 하단 정보
    ctx.font = "35px serif";
    ctx.fillText(log.country, size.width / 2, size.height - 200);
    ctx.font = "30px serif";
    ctx.fillStyle = "#ffffffAA";
    ctx.fillText(log.createdAt, size.width / 2, size.height - 140);
  };

  // 모던 템플릿
  const drawModernTemplate = async (
    ctx: CanvasRenderingContext2D,
    size: { width: number; height: number },
    log: TravelLog,
    emotion: Emotion
  ) => {
    // 기하학적 배경
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(i * (size.width / 5), 0, size.width / 5 - 10, size.height);
    }

    // 좌측 정렬 장소명
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 100px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(log.placeName, 80, 200);

    // 국가
    ctx.font = "50px sans-serif";
    ctx.fillStyle = "#ffffffCC";
    ctx.fillText(log.country, 80, 280);

    // 중앙 감정
    ctx.textAlign = "center";
    ctx.font = "250px sans-serif";
    ctx.fillText(emotion.emoji, size.width / 2, size.height / 2 + 100);

    // 우하단 브랜드
    ctx.textAlign = "right";
    ctx.font = "35px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Travelog", size.width - 80, size.height - 80);

    // 날짜
    ctx.font = "30px sans-serif";
    ctx.fillStyle = "#ffffffAA";
    ctx.fillText(log.createdAt, size.width - 80, size.height - 140);
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "none" }}
      aria-label="Share image generator canvas"
    />
  );
}
