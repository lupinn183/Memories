import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { addFileToDb, getAllFiles, getFileById, deleteFileFromDb, initializeDatabase } from './database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Tạo thư mục uploads nếu chưa tồn tại
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cấu hình multer để lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Lọc file loại nếu cần
    cb(null, true);
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Memories API Server', version: '1.0.0' });
});

// API để upload file
app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file được upload' });
    }

    // Lưu vào database
    const fileId = await addFileToDb(
      req.file.filename,
      req.file.originalname,
      req.file.size,
      req.file.mimetype,
      `/uploads/${req.file.filename}`
    );

    res.json({
      success: true,
      message: 'Upload file thành công',
      file: {
        id: fileId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        path: `/uploads/${req.file.filename}`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// API để upload nhiều file
app.post('/api/upload-multiple', upload.array('files', 5), async (req: Request, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Không có file được upload' });
    }

    const uploadedFiles = [];
    
    for (const file of req.files as Express.Multer.File[]) {
      const fileId = await addFileToDb(
        file.filename,
        file.originalname,
        file.size,
        file.mimetype,
        `/uploads/${file.filename}`
      );
      
      uploadedFiles.push({
        id: fileId,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        path: `/uploads/${file.filename}`,
      });
    }

    res.json({
      success: true,
      message: 'Upload files thành công',
      files: uploadedFiles,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Endpoint kiểm tra server
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'Server is running' });
});

// API lấy danh sách tất cả uploads
app.get('/api/files', async (req: Request, res: Response) => {
  try {
    const files = await getAllFiles();
    res.json({
      success: true,
      total: files.length,
      files,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách file' });
  }
});

// API lấy thông tin file theo ID
app.get('/api/files/:id', async (req: Request, res: Response) => {
  try {
    const file = await getFileById(parseInt(req.params.id));
    if (!file) {
      return res.status(404).json({ error: 'File không tìm thấy' });
    }
    res.json({
      success: true,
      file,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin file' });
  }
});

// API xóa file
app.delete('/api/files/:id', async (req: Request, res: Response) => {
  try {
    const file = await getFileById(parseInt(req.params.id));
    if (!file) {
      return res.status(404).json({ error: 'File không tìm thấy' });
    }

    // Xóa file vật lý
    const filePath = path.join(uploadsDir, file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Xóa từ database
    await deleteFileFromDb(parseInt(req.params.id));

    res.json({
      success: true,
      message: 'Xóa file thành công',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi khi xóa file' });
  }
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Bắt đầu server
app.listen(PORT, async () => {
  console.log(`Server đang chạy tại port ${PORT}`);
  await initializeDatabase();
});

export default app;
