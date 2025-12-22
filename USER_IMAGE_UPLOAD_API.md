# User Image Upload API Documentation

## Overview
This API allows authenticated users to upload, view, and delete their profile images. Images are stored locally on the server in a well-structured directory system.

## Endpoints

### 1. Upload User Profile Image

**Endpoint**: `POST /api/v1/users/upload-image`

**Authentication**: Required (JWT Token)

**Description**: Upload a profile image for the authenticated user. If a previous image exists, it will be automatically deleted.

**Request Headers**:
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

**Request Body** (form-data):
```
image: [File] (required) - Image file to upload
```

**Allowed Image Formats**:
- JPG/JPEG
- PNG
- GIF
- WEBP

**File Size Limit**: 5MB

**Success Response** (200 OK):
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "imageUrl": "/uploads/users/images/profile-1703145678901-a1b2c3d4e5f6g7h8.jpg",
    "updatedAt": "2024-12-21T10:30:00.000Z",
    "message": "Image uploaded successfully"
  }
}
```

**Error Responses**:

- **400 Bad Request** - Invalid file type:
```json
{
  "statusCode": 400,
  "message": "Only image files are allowed (jpg, jpeg, png, gif, webp)",
  "error": "Bad Request"
}
```

- **400 Bad Request** - File size too large:
```json
{
  "statusCode": 400,
  "message": "File size exceeds the limit of 5MB",
  "error": "Bad Request"
}
```

- **400 Bad Request** - No file provided:
```json
{
  "statusCode": 400,
  "message": "Please upload an image file",
  "error": "Bad Request"
}
```

- **401 Unauthorized** - No token or invalid token:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/v1/users/upload-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/your/image.jpg"
```

---

### 2. Delete User Profile Image

**Endpoint**: `DELETE /api/v1/users/delete-image`

**Authentication**: Required (JWT Token)

**Description**: Delete the profile image of the authenticated user.

**Request Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**Success Response** (200 OK):
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "imageUrl": null,
    "updatedAt": "2024-12-21T10:35:00.000Z"
  }
}
```

**Error Responses**:

- **404 Not Found** - No image to delete:
```json
{
  "statusCode": 404,
  "message": "User has no profile image",
  "error": "Not Found"
}
```

- **401 Unauthorized** - No token or invalid token:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**cURL Example**:
```bash
curl -X DELETE http://localhost:3000/api/v1/users/delete-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. Get Current User Profile

**Endpoint**: `GET /api/v1/users/me`

**Authentication**: Required (JWT Token)

**Description**: Get the profile of the authenticated user, including the image URL if available.

**Request Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**Success Response** (200 OK):
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-12-01T10:00:00.000Z",
    "updatedAt": "2024-12-21T10:30:00.000Z",
    "role": "USER",
    "dateOfBirth": null,
    "location": null,
    "imageUrl": "/uploads/users/images/profile-1703145678901-a1b2c3d4e5f6g7h8.jpg",
    "phone": null,
    "status": "ACTIVE",
    "isEmailVerified": true,
    "verificationCode": null,
    "verificationCodeExpiry": null,
    "notifications": []
  }
}
```

---

### 4. Access Uploaded Images

**Endpoint**: `GET /uploads/users/images/{filename}`

**Authentication**: Not Required (Public)

**Description**: Access uploaded user images directly via URL.

**Example**:
```
http://localhost:3000/uploads/users/images/profile-1703145678901-a1b2c3d4e5f6g7h8.jpg
```

---

## Frontend Implementation Examples

### JavaScript/Fetch API

```javascript
// Upload image
async function uploadUserImage(file, token) {
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
      console.log('Image uploaded:', result.data.imageUrl);
      return result.data;
    } else {
      console.error('Upload failed:', result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Delete image
async function deleteUserImage(token) {
  try {
    const response = await fetch('http://localhost:3000/api/v1/users/delete-image', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Image deleted successfully');
      return result.data;
    } else {
      console.error('Delete failed:', result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

// Usage in HTML form
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById('imageInput');
  const file = fileInput.files[0];
  const token = localStorage.getItem('authToken');
  
  if (file && token) {
    await uploadUserImage(file, token);
  }
});
```

### React Example

```jsx
import React, { useState } from 'react';

function ProfileImageUpload({ token }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

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
        setImageUrl(result.data.imageUrl);
        setSelectedFile(null);
        alert('Image uploaded successfully!');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!imageUrl) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/v1/users/delete-image', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        setImageUrl(null);
        alert('Image deleted successfully!');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to delete image. Please try again.');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Profile Image Upload</h2>
      
      {imageUrl && (
        <div>
          <img 
            src={`http://localhost:3000${imageUrl}`} 
            alt="Profile" 
            style={{ maxWidth: '200px', marginBottom: '10px' }}
          />
          <button onClick={handleDelete} disabled={loading}>
            Delete Image
          </button>
        </div>
      )}

      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileSelect}
        disabled={loading}
      />
      
      {selectedFile && (
        <p>Selected: {selectedFile.name}</p>
      )}

      <button 
        onClick={handleUpload} 
        disabled={!selectedFile || loading}
      >
        {loading ? 'Uploading...' : 'Upload Image'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default ProfileImageUpload;
```

---

## Testing with Postman

### Setup
1. Create a new request in Postman
2. Set the method to `POST`
3. Enter URL: `http://localhost:3000/api/v1/users/upload-image`

### Headers Tab
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Body Tab
1. Select `form-data`
2. Add a new key: `image`
3. Change type from "Text" to "File"
4. Click "Select Files" and choose an image
5. Click "Send"

---

## File Storage Structure

```
yasminaarsic-server/
├── uploads/
│   ├── users/
│   │   └── images/
│   │       ├── .gitkeep
│   │       ├── profile-1703145678901-a1b2c3d4e5f6g7h8.jpg
│   │       └── avatar-1703145789012-b2c3d4e5f6g7h8i9.png
│   └── README.md
```

---

## VPS Deployment Guide

### 1. Set Up Directory Permissions

After deploying to VPS, ensure proper permissions:

```bash
cd /path/to/yasminaarsic-server
mkdir -p uploads/users/images
chmod 755 uploads
chmod 755 uploads/users
chmod 755 uploads/users/images
chown -R www-data:www-data uploads  # For nginx
# OR
chown -R apache:apache uploads      # For Apache
```

### 2. Nginx Configuration (Recommended)

Add to your nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # API requests
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Increase body size for file uploads
        client_max_body_size 10M;
    }

    # Serve static files directly
    location /uploads/ {
        alias /path/to/yasminaarsic-server/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
```

### 3. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'yasminaarsic-server',
    script: 'dist/main.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Backup Strategy

Set up a cron job for regular backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * rsync -av /path/to/yasminaarsic-server/uploads/ /backup/location/uploads/
```

---

## Security Best Practices

1. **File Validation**: All files are validated for type and size
2. **Unique Filenames**: Random hashes prevent file overwriting
3. **JWT Authentication**: Only authenticated users can upload/delete
4. **Automatic Cleanup**: Old images are deleted when new ones are uploaded
5. **Size Limits**: 5MB maximum file size
6. **Type Restrictions**: Only image files (jpg, jpeg, png, gif, webp) allowed

---

## Troubleshooting

### Issue: "File size exceeds the limit"
**Solution**: Ensure your file is less than 5MB. Compress the image before uploading.

### Issue: "Only image files are allowed"
**Solution**: Make sure you're uploading a valid image file (jpg, jpeg, png, gif, or webp).

### Issue: "Please upload an image file"
**Solution**: Ensure the form field name is `image` and you're sending the file correctly.

### Issue: Images not accessible after upload
**Solution**: Check that:
- The uploads directory has correct permissions (755)
- Static file serving is configured in main.ts
- The server is running and accessible

### Issue: Permission denied when creating directories
**Solution**: Ensure the Node.js process has write permissions:
```bash
sudo chown -R $USER:$USER /path/to/yasminaarsic-server/uploads
```

---

## API Response Format

All API responses follow this format:

**Success Response**:
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```

**Error Response**:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Error type"
}
```

---

## Environment Variables

Make sure your `.env` file includes:

```env
PORT=3000
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
```

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API documentation
3. Check server logs for detailed error messages
4. Ensure all dependencies are installed correctly
