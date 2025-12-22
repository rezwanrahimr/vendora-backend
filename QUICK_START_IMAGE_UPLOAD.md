# Quick Start Guide - User Image Upload Feature

## ✅ What's Been Implemented

A complete user profile image upload system with:
- Upload endpoint for user images
- Delete endpoint for removing images  
- Automatic cleanup of old images
- Local file storage with well-structured directories
- File validation (type, size)
- JWT authentication protection
- Swagger documentation
- Static file serving

---

## 📁 Files Created/Modified

### New Files:
1. `src/common/utils/file-upload.utils.ts` - File upload utilities
2. `src/common/interceptors/file-size.interceptor.ts` - File size validation
3. `src/modules/users/dto/upload-image.dto.ts` - DTOs for image upload
4. `uploads/users/images/.gitkeep` - Directory structure
5. `uploads/README.md` - Storage documentation
6. `USER_IMAGE_UPLOAD_API.md` - Complete API documentation

### Modified Files:
1. `src/modules/users/users.controller.ts` - Added upload/delete endpoints
2. `src/modules/users/users.service.ts` - Added image handling logic
3. `src/main.ts` - Added static file serving
4. `.gitignore` - Added /uploads to ignore list

---

## 🚀 How to Test

### 1. Start the Server

```bash
npm run start:dev
```

### 2. Get a JWT Token

First, login to get your JWT token:

```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

Copy the token from the response.

### 3. Upload an Image

Using curl:
```bash
curl -X POST http://localhost:3000/api/v1/users/upload-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/your/image.jpg"
```

Using Postman:
1. Open Postman
2. Create a new POST request to: `http://localhost:3000/api/v1/users/upload-image`
3. In Headers tab, add: `Authorization: Bearer YOUR_JWT_TOKEN`
4. In Body tab:
   - Select `form-data`
   - Add key: `image` (change type to File)
   - Select an image file
5. Click Send

### 4. View Your Profile with Image

```bash
GET http://localhost:3000/api/v1/users/me
Authorization: Bearer YOUR_JWT_TOKEN
```

You'll see the `imageUrl` field populated with your uploaded image path.

### 5. Access the Image

Open in browser or curl:
```
http://localhost:3000/uploads/users/images/[filename-from-response]
```

### 6. Delete the Image

```bash
curl -X DELETE http://localhost:3000/api/v1/users/delete-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📝 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/users/upload-image` | Upload profile image | ✅ Yes |
| DELETE | `/api/v1/users/delete-image` | Delete profile image | ✅ Yes |
| GET | `/api/v1/users/me` | Get current user profile | ✅ Yes |
| GET | `/uploads/users/images/:filename` | Access uploaded image | ❌ No |

---

## 🔒 Security Features

- ✅ JWT authentication required for upload/delete
- ✅ File type validation (only images: jpg, jpeg, png, gif, webp)
- ✅ File size limit (5MB max)
- ✅ Unique filenames to prevent collisions
- ✅ Automatic cleanup of old images
- ✅ Sanitized file names

---

## 📦 File Storage Structure

```
yasminaarsic-server/
├── uploads/
│   └── users/
│       └── images/
│           ├── .gitkeep
│           └── [uploaded-images]
```

Images are stored with the format:
```
[original-name]-[timestamp]-[random-hash].[extension]
```

Example: `profile-1703145678901-a1b2c3d4e5f6g7h8.jpg`

---

## 🌐 VPS Deployment Checklist

When deploying to your VPS:

- [ ] Ensure Node.js is installed
- [ ] Run `npm install` to install dependencies
- [ ] Set up environment variables in `.env`
- [ ] Create uploads directory: `mkdir -p uploads/users/images`
- [ ] Set permissions: `chmod 755 uploads -R`
- [ ] Configure nginx/apache to serve static files (optional, but recommended)
- [ ] Set up PM2 for process management
- [ ] Configure firewall to allow HTTP/HTTPS traffic
- [ ] Set up SSL certificate with Let's Encrypt
- [ ] Configure regular backups of uploads directory

### Quick VPS Setup Commands:

```bash
# Navigate to project
cd /path/to/yasminaarsic-server

# Install dependencies
npm install

# Build the project
npm run build

# Create uploads directory
mkdir -p uploads/users/images
chmod 755 uploads -R

# Start with PM2
npm install -g pm2
pm2 start dist/main.js --name yasminaarsic-server
pm2 save
pm2 startup
```

---

## 📖 Swagger Documentation

Access the interactive API documentation at:
```
http://localhost:3000/doc
```

The upload endpoint will be listed under the "Users" tag with:
- File upload form
- Try it out functionality
- Request/response examples

---

## 🧪 Testing Examples

### Frontend Testing (HTML)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Image Upload Test</title>
</head>
<body>
    <h1>Upload Profile Image</h1>
    <form id="uploadForm">
        <input type="file" id="imageInput" accept="image/*" required>
        <button type="submit">Upload</button>
    </form>
    <div id="result"></div>
    <img id="preview" style="max-width: 300px; display: none;">

    <script>
        const token = 'YOUR_JWT_TOKEN'; // Replace with actual token
        const form = document.getElementById('uploadForm');
        const resultDiv = document.getElementById('result');
        const preview = document.getElementById('preview');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = document.getElementById('imageInput').files[0];
            
            if (!file) {
                resultDiv.textContent = 'Please select a file';
                return;
            }

            const formData = new FormData();
            formData.append('image', file);

            try {
                const response = await fetch('http://localhost:3000/api/v1/users/upload-image', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const result = await response.json();
                
                if (response.ok) {
                    resultDiv.textContent = 'Upload successful!';
                    resultDiv.style.color = 'green';
                    preview.src = `http://localhost:3000${result.data.imageUrl}`;
                    preview.style.display = 'block';
                } else {
                    resultDiv.textContent = `Error: ${result.message}`;
                    resultDiv.style.color = 'red';
                }
            } catch (error) {
                resultDiv.textContent = `Error: ${error.message}`;
                resultDiv.style.color = 'red';
            }
        });
    </script>
</body>
</html>
```

---

## ❓ Common Issues & Solutions

### Issue 1: "Cannot find module" errors
**Solution**: Run `npm install` to ensure all dependencies are installed.

### Issue 2: Upload directory not writable
**Solution**: 
```bash
mkdir -p uploads/users/images
chmod 755 uploads -R
```

### Issue 3: Images not accessible via URL
**Solution**: Ensure static file serving is configured in `main.ts` (already done).

### Issue 4: "Only image files are allowed" error
**Solution**: Make sure you're uploading a valid image file (jpg, jpeg, png, gif, or webp).

### Issue 5: File size too large
**Solution**: Compress your image to be under 5MB, or modify `MAX_FILE_SIZE` in `file-upload.utils.ts`.

---

## 🔄 Next Steps

You may want to consider:

1. **Image Optimization**: Add image compression/resizing before storage
2. **Cloud Storage**: Integrate AWS S3, Cloudinary, or similar services
3. **Multiple Images**: Support for multiple profile images
4. **Image Cropping**: Add frontend image cropping functionality
5. **CDN Integration**: Use a CDN for better performance
6. **Thumbnail Generation**: Create thumbnails for faster loading
7. **Image Metadata**: Store additional info (dimensions, format, etc.)

---

## 📚 Additional Documentation

- Full API Documentation: See `USER_IMAGE_UPLOAD_API.md`
- Storage Structure: See `uploads/README.md`
- Project Structure: See `PROJECT_STRUCTURE.md`

---

## ✨ Features Summary

✅ **Implemented:**
- User image upload with validation
- Automatic old image deletion
- Local file storage with organized structure
- JWT-protected endpoints
- Swagger documentation
- File size and type validation
- Static file serving
- Error handling

🎉 **Ready to use!** Start your server and test the endpoints.
