"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TravelLog, Emotion } from "@/types/travel";
import { Globe2, RotateCw, ZoomIn, ZoomOut, Play, Pause } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-800 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <Globe2 className="w-12 h-12 text-purple-400 mx-auto mb-2 animate-spin" />
        <div className="text-slate-400">3D 지구본을 불러오는 중...</div>
      </div>
    </div>
  ),
});

interface GlobeViewProps {
  travelLogs: TravelLog[];
  emotions: Record<string, Emotion>;
  onPinClick: (log: TravelLog) => void;
}

export default function GlobeView({
  travelLogs,
  emotions,
  onPinClick,
}: GlobeViewProps) {
  const globeEl = useRef<any>();
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [selectedLog, setSelectedLog] = useState<TravelLog | null>(null);

  // 포인트 데이터 생성
  const pointsData = travelLogs.map((log) => ({
    lat: log.lat,
    lng: log.lng,
    size: 0.5,
    color: emotions[log.emotion]?.color || "#FFD700",
    label: log.placeName,
    log: log,
  }));

  // 여행 경로 연결선 데이터 (시간순)
  const arcsData = travelLogs
    .slice()
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .map((log, index, arr) => {
      if (index === arr.length - 1) return null;
      const next = arr[index + 1];
      return {
        startLat: log.lat,
        startLng: log.lng,
        endLat: next.lat,
        endLng: next.lng,
        color: [
          emotions[log.emotion]?.color || "#FFD700",
          emotions[next.emotion]?.color || "#FFD700",
        ],
      };
    })
    .filter(Boolean) as any[];

  // 초기 카메라 위치 설정
  useEffect(() => {
    if (globeEl.current && travelLogs.length > 0) {
      const firstLog = travelLogs[0];
      globeEl.current.pointOfView(
        {
          lat: firstLog.lat,
          lng: firstLog.lng,
          altitude: 2.5,
        },
        1000
      );
    }
  }, [travelLogs]);

  // 자동 회전
  useEffect(() => {
    if (isAutoRotate && globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    } else if (globeEl.current) {
      globeEl.current.controls().autoRotate = false;
    }
  }, [isAutoRotate]);

  const handleReset = () => {
    if (globeEl.current && travelLogs.length > 0) {
      const firstLog = travelLogs[0];
      globeEl.current.pointOfView(
        {
          lat: firstLog.lat,
          lng: firstLog.lng,
          altitude: 2.5,
        },
        1000
      );
    }
  };

  const handleZoomIn = () => {
    if (globeEl.current) {
      const pov = globeEl.current.pointOfView();
      globeEl.current.pointOfView(
        {
          ...pov,
          altitude: Math.max(pov.altitude - 0.5, 0.5),
        },
        500
      );
    }
  };

  const handleZoomOut = () => {
    if (globeEl.current) {
      const pov = globeEl.current.pointOfView();
      globeEl.current.pointOfView(
        {
          ...pov,
          altitude: Math.min(pov.altitude + 0.5, 5),
        },
        500
      );
    }
  };

  const handlePointClick = (point: any) => {
    setSelectedLog(point.log);
    onPinClick(point.log);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">3D 지구본 뷰</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className="text-slate-300 hover:text-white"
          >
            {isAutoRotate ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                회전 멈춤
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                자동 회전
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="text-slate-300 hover:text-white"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="text-slate-300 hover:text-white"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-slate-300 hover:text-white"
          >
            <RotateCw className="w-4 h-4 mr-2" />
            리셋
          </Button>
        </div>
      </div>

      <div className="relative bg-slate-900 rounded-lg overflow-hidden">
        <Globe
          ref={globeEl}
          height={600}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          atmosphereColor="#8b5cf6"
          atmosphereAltitude={0.15}
          // Points
          pointsData={pointsData}
          pointAltitude={0.01}
          pointRadius={(d: any) => d.size}
          pointColor={(d: any) => d.color}
          pointLabel={(d: any) => `
            <div style="
              background: rgba(0, 0, 0, 0.9);
              padding: 8px 12px;
              border-radius: 8px;
              color: white;
              font-size: 14px;
              border: 1px solid ${d.color};
            ">
              <strong>${d.label}</strong>
            </div>
          `}
          onPointClick={handlePointClick}
          // Arcs (Travel Routes)
          arcsData={arcsData}
          arcColor={(d: any) => d.color}
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={2000}
          arcStroke={0.5}
          arcAltitude={0.3}
          arcAltitudeAutoScale={0.5}
          // Interaction
          enablePointerInteraction={true}
        />

        {/* Info Overlay */}
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm rounded-lg p-3 max-w-xs">
          <div className="text-sm text-slate-300">
            <p className="font-semibold text-white mb-2">💡 사용 팁</p>
            <ul className="space-y-1 text-xs">
              <li>• 마우스로 지구본을 드래그하여 회전</li>
              <li>• 스크롤로 줌 인/아웃</li>
              <li>• 핀을 클릭하여 상세 정보 보기</li>
              <li>• 선은 시간순 여행 경로를 나타냅니다</li>
            </ul>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-4 text-slate-300">
            <div className="text-center">
              <div className="text-xl font-bold text-purple-400">
                {travelLogs.length}
              </div>
              <div className="text-xs">여행지</div>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center">
              <div className="text-xl font-bold text-pink-400">
                {new Set(travelLogs.map((log) => log.country)).size}
              </div>
              <div className="text-xs">국가</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
