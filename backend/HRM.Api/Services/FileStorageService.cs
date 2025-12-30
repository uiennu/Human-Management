using Microsoft.AspNetCore.Http;

namespace HRM.Api.Services
{
    public interface IFileStorageService
    {
        Task<string> SaveFilesAsync(List<IFormFile> files, string folderPath);
        List<string> GetFiles(string folderPath);
        Task<(string FilePath, string FileName)> SaveSensitiveDocumentAsync(IFormFile file, int employeeId, int? changeId = null);
        Task<List<(string FilePath, string FileName)>> SaveMultipleSensitiveDocumentsAsync(List<IFormFile> files, int employeeId);
        void DeleteFile(string filePath);
        bool ValidateFile(IFormFile file, out string errorMessage);
        bool ValidateMultipleFiles(List<IFormFile> files, out string errorMessage);
    }

    public class FileStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _env;
        
        // Allowed file types for sensitive documents
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".pdf" };
        private readonly string[] _allowedMimeTypes = { 
            "image/jpeg", "image/png", "image/jpg", 
            "application/pdf" 
        };
        private const long MaxFileSize = 5 * 1024 * 1024; // 5MB per file
        private const long MaxTotalSize = 10 * 1024 * 1024; // 10MB total
        private const int MaxFileCount = 5; // Maximum 5 files

        public FileStorageService(IWebHostEnvironment env)
        {
            _env = env;
        }

        /// <summary>
        /// Validate file type and size for security
        /// </summary>
        public bool ValidateFile(IFormFile file, out string errorMessage)
        {
            errorMessage = string.Empty;

            if (file == null || file.Length == 0)
            {
                errorMessage = "No file uploaded";
                return false;
            }

            // Check file size
            if (file.Length > MaxFileSize)
            {
                errorMessage = $"File size exceeds maximum allowed size of {MaxFileSize / (1024 * 1024)}MB";
                return false;
            }

            // Check file extension
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(extension))
            {
                errorMessage = $"File type not allowed. Allowed types: {string.Join(", ", _allowedExtensions)}";
                return false;
            }

            // Check MIME type
            if (!_allowedMimeTypes.Contains(file.ContentType.ToLowerInvariant()))
            {
                errorMessage = "Invalid file content type";
                return false;
            }

            return true;
        }

        /// <summary>
        /// Validate multiple files for upload
        /// </summary>
        public bool ValidateMultipleFiles(List<IFormFile> files, out string errorMessage)
        {
            errorMessage = string.Empty;

            if (files == null || files.Count == 0)
            {
                errorMessage = "No files uploaded";
                return false;
            }

            if (files.Count > MaxFileCount)
            {
                errorMessage = $"Maximum {MaxFileCount} files allowed";
                return false;
            }

            // Check total size
            var totalSize = files.Sum(f => f.Length);
            if (totalSize > MaxTotalSize)
            {
                errorMessage = $"Total file size exceeds maximum allowed size of {MaxTotalSize / (1024 * 1024)}MB";
                return false;
            }

            // Validate each file
            foreach (var file in files)
            {
                if (!ValidateFile(file, out var fileError))
                {
                    errorMessage = $"File '{file.FileName}': {fileError}";
                    return false;
                }
            }

            return true;
        }

        /// <summary>
        /// Save multiple sensitive documents with validation
        /// </summary>
        public async Task<List<(string FilePath, string FileName)>> SaveMultipleSensitiveDocumentsAsync(
            List<IFormFile> files, 
            int employeeId)
        {
            // Validate all files first
            if (!ValidateMultipleFiles(files, out var errorMessage))
            {
                throw new ArgumentException(errorMessage);
            }

            var results = new List<(string FilePath, string FileName)>();
            
            foreach (var file in files)
            {
                var result = await SaveSensitiveDocumentAsync(file, employeeId);
                results.Add(result);
            }

            return results;
        }

        /// <summary>
        /// Save a sensitive document with validation and secure naming
        /// </summary>
        public async Task<(string FilePath, string FileName)> SaveSensitiveDocumentAsync(
            IFormFile file, 
            int employeeId, 
            int? changeId = null)
        {
            // Validate file
            if (!ValidateFile(file, out var errorMessage))
            {
                throw new ArgumentException(errorMessage);
            }

            // Create secure folder path: uploads/sensitive-documents/{employeeId}/
            var folderPath = Path.Combine("uploads", "sensitive-documents", employeeId.ToString());
            var webRootPath = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var uploadPath = Path.Combine(webRootPath, folderPath);

            if (!Directory.Exists(uploadPath))
            {
                Directory.CreateDirectory(uploadPath);
            }

            // Generate unique filename to prevent overwriting and path traversal
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var originalFileName = Path.GetFileNameWithoutExtension(file.FileName);
            // Sanitize original filename - remove special characters
            var sanitizedName = System.Text.RegularExpressions.Regex.Replace(originalFileName, @"[^a-zA-Z0-9_-]", "_");
            var uniqueFileName = $"{sanitizedName}_{DateTime.Now:yyyyMMddHHmmss}_{Guid.NewGuid():N}{extension}";
            
            var filePath = Path.Combine(uploadPath, uniqueFileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return relative path for database storage
            var relativePath = $"/{folderPath}/{uniqueFileName}".Replace("\\", "/");
            return (relativePath, file.FileName);
        }

        /// <summary>
        /// Delete a file from storage
        /// </summary>
        public void DeleteFile(string filePath)
        {
            if (string.IsNullOrEmpty(filePath)) return;

            var webRootPath = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var fullPath = Path.Combine(webRootPath, filePath.TrimStart('/'));

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }

        public async Task<string> SaveFilesAsync(List<IFormFile> files, string folderPath)
        {
            if (files == null || !files.Any())
                return string.Empty;

            // Create directory if not exists
            var webRootPath = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var uploadPath = Path.Combine(webRootPath, folderPath);
            if (!Directory.Exists(uploadPath))
            {
                Directory.CreateDirectory(uploadPath);
            }

            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    // Use original filename
                    var filePath = Path.Combine(uploadPath, file.FileName);
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }
                }
            }

            // Return the folder path relative to wwwroot
            return folderPath.Replace("\\", "/");
        }

        public List<string> GetFiles(string folderPath)
        {
            if (string.IsNullOrEmpty(folderPath)) return new List<string>();

            var webRootPath = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var fullPath = Path.Combine(webRootPath, folderPath);
            if (!Directory.Exists(fullPath)) return new List<string>();

            var files = Directory.GetFiles(fullPath);
            // Return relative paths
            return files.Select(f => Path.Combine(folderPath, Path.GetFileName(f)).Replace("\\", "/")).ToList();
        }
    }
}
