import multer from 'multer';

// 生产环境（Serverless）使用内存存储，本地开发使用磁盘存储
const isProduction = process.env.NODE_ENV === 'production';

const storage = isProduction
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => {
        const path = require('path');
        const fs = require('fs');
        const uploadDir = path.join(__dirname, '../../uploads/family-photos');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (_req, file, cb) => {
        const path = require('path');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `family-photo-${uniqueSuffix}${ext}`);
      }
    });

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (JPEG, PNG, GIF, WebP)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

// 本地开发：返回本地路径；生产环境：返回空（需要 Supabase Storage）
const getFileUrl = (filename: string): string => {
  if (!filename) return '';
  if (isProduction) return '';
  return `/uploads/family-photos/${filename}`;
};

const deleteFile = (filename: string): void => {
  if (!filename || isProduction) return;
  const path = require('path');
  const fs = require('fs');
  const filePath = path.join(__dirname, '../../uploads/family-photos', filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export { upload, getFileUrl, deleteFile };
