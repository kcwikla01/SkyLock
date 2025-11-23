using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Skylock.Database.Models
{
    public class FileDTO
    {
        public string FileId { get; set; }
        public string OriginalFileName { get; set; }
        public string StorageType { get; set; }
        public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;
        public string Path { get; set; }
    }
}
