import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    // 개발 환경에서는 로컬 파일 시스템 사용
    this.uploadDir = path.join(process.cwd(), 'uploads');

    // uploads 디렉토리가 없으면 생성
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  uploadFile(
    file: Express.Multer.File,
    folder: string = 'images',
  ): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const folderPath = path.join(this.uploadDir, folder);

    // 폴더가 없으면 생성
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, fileName);
    const publicUrl = `http://localhost:3001/uploads/${folder}/${fileName}`;

    try {
      // 파일을 로컬에 저장
      fs.writeFileSync(filePath, file.buffer);
      return Promise.resolve(publicUrl);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류';
      throw new Error(`파일 업로드 실패: ${errorMessage}`);
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'images',
  ): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  deleteFile(fileUrl: string): Promise<void> {
    try {
      // URL에서 파일 경로 추출
      const urlParts = fileUrl.split('/uploads/');
      if (urlParts.length < 2) {
        throw new Error('잘못된 파일 URL입니다.');
      }

      const relativePath = urlParts[1];
      const filePath = path.join(this.uploadDir, relativePath);

      // 파일이 존재하면 삭제
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return Promise.resolve();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류';
      throw new Error(`파일 삭제 실패: ${errorMessage}`);
    }
  }

  async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
    const deletePromises = fileUrls.map((url) => this.deleteFile(url));
    await Promise.all(deletePromises);
  }
}
