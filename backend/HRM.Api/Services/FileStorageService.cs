using Microsoft.AspNetCore.Http;

namespace HRM.Api.Services
{
    public interface IFileStorageService
    {
        Task<string> SaveFilesAsync(List<IFormFile> files, string folderPath);
        List<string> GetFiles(string folderPath);
    }

    public class FileStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _env;

        public FileStorageService(IWebHostEnvironment env)
        {
            _env = env;
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
