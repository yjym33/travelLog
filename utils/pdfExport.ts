import type { TravelLog } from "@/types/travel";
import type { Emotion } from "@/types/travel";

/**
 * 여행 기록을 PDF로 내보내기
 */
export async function exportTravelToPDF(
  travelLog: TravelLog,
  emotion: Emotion
): Promise<void> {
  // 인쇄용 HTML 생성
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("팝업이 차단되었습니다. 팝업을 허용해주세요.");
    return;
  }

  const html = generatePrintHTML(travelLog, emotion);
  printWindow.document.write(html);
  printWindow.document.close();

  // 이미지 로딩 대기
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 인쇄 다이얼로그 표시
  printWindow.print();
}

/**
 * 여러 여행 기록을 PDF로 내보내기 (스토리용)
 */
export async function exportStoryToPDF(
  travelLogs: TravelLog[],
  emotions: Record<string, Emotion>,
  storyTitle: string,
  storyDescription: string
): Promise<void> {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("팝업이 차단되었습니다. 팝업을 허용해주세요.");
    return;
  }

  const html = generateStoryPrintHTML(
    travelLogs,
    emotions,
    storyTitle,
    storyDescription
  );
  printWindow.document.write(html);
  printWindow.document.close();

  await new Promise((resolve) => setTimeout(resolve, 1500));
  printWindow.print();
}

/**
 * 단일 여행 기록용 HTML 생성
 */
function generatePrintHTML(log: TravelLog, emotion: Emotion): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${log.placeName} - Travelog</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid ${emotion.color};
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .emotion {
          font-size: 60px;
          margin: 20px 0;
        }
        h1 {
          color: ${emotion.color};
          font-size: 32px;
          margin: 10px 0;
        }
        .meta {
          color: #666;
          font-size: 14px;
        }
        .photos {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin: 30px 0;
        }
        .photos img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
        }
        .diary {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid ${emotion.color};
          margin: 30px 0;
        }
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 20px 0;
        }
        .tag {
          background: ${emotion.color}20;
          color: ${emotion.color};
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #999;
          font-size: 12px;
        }
        @media print {
          body {
            padding: 0;
          }
          .photos img {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="emotion">${emotion.emoji}</div>
        <h1>${log.placeName}</h1>
        <div class="meta">${log.country} · ${log.createdAt}</div>
        <div class="meta" style="margin-top: 5px">${emotion.label}</div>
      </div>

      ${
        log.photos.length > 0
          ? `
      <div class="photos">
        ${log.photos
          .map(
            (photo) => `
          <img src="${photo}" alt="Travel photo" onerror="this.style.display='none'" />
        `
          )
          .join("")}
      </div>
      `
          : ""
      }

      ${
        log.diary
          ? `
      <div class="diary">
        <h2 style="margin-top: 0; color: ${emotion.color};">여행 일기</h2>
        <p>${log.diary.replace(/\n/g, "<br>")}</p>
      </div>
      `
          : ""
      }

      ${
        log.tags.length > 0
          ? `
      <div class="tags">
        ${log.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
      `
          : ""
      }

      <div class="footer">
        <p>Created with Travelog 🌍</p>
        <p>Your travel memories, beautifully preserved</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * 스토리용 HTML 생성
 */
function generateStoryPrintHTML(
  logs: TravelLog[],
  emotions: Record<string, Emotion>,
  title: string,
  description: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title} - Travelog</title>
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .cover {
          page-break-after: always;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          margin: -15mm;
        }
        .cover h1 {
          font-size: 48px;
          margin: 20px 0;
        }
        .cover p {
          font-size: 20px;
          opacity: 0.9;
        }
        .travel-log {
          page-break-after: always;
          padding: 20px 0;
        }
        .log-header {
          margin-bottom: 20px;
        }
        .log-title {
          font-size: 28px;
          color: #667eea;
          margin: 10px 0;
        }
        .log-meta {
          color: #666;
          font-size: 14px;
        }
        .log-emotion {
          font-size: 40px;
          margin: 15px 0;
        }
        .log-photos {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin: 20px 0;
        }
        .log-photos img {
          width: 100%;
          height: 180px;
          object-fit: cover;
          border-radius: 8px;
        }
        .log-diary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="cover">
        <h1>${title}</h1>
        <p>${description || "나의 여행 이야기"}</p>
        <p style="margin-top: 40px; font-size: 16px;">
          ${logs.length}개의 여행 기록
        </p>
      </div>

      ${logs
        .map((log) => {
          const emotion = emotions[log.emotion];
          return `
        <div class="travel-log">
          <div class="log-header">
            <div class="log-emotion">${emotion.emoji}</div>
            <h2 class="log-title">${log.placeName}</h2>
            <div class="log-meta">${log.country} · ${log.createdAt} · ${
            emotion.label
          }</div>
          </div>

          ${
            log.photos.length > 0
              ? `
          <div class="log-photos">
            ${log.photos
              .slice(0, 4)
              .map(
                (photo) => `
              <img src="${photo}" alt="Travel photo" onerror="this.style.display='none'" />
            `
              )
              .join("")}
          </div>
          `
              : ""
          }

          ${
            log.diary
              ? `
          <div class="log-diary">
            <p>${log.diary.replace(/\n/g, "<br>")}</p>
          </div>
          `
              : ""
          }

          ${
            log.tags.length > 0
              ? `
          <div style="margin-top: 15px;">
            ${log.tags
              .map(
                (tag) =>
                  `<span style="color: #667eea; margin-right: 10px;">${tag}</span>`
              )
              .join("")}
          </div>
          `
              : ""
          }
        </div>
      `;
        })
        .join("")}

      <div class="footer">
        <p>Created with Travelog 🌍</p>
      </div>
    </body>
    </html>
  `;
}
