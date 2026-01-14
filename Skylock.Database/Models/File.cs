using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Skylock.Database.Models
{
    public class File
    {
        [Key]
        public int Id { get; set; }
        public string OwnerId { get; set; }
        public string OriginalFileName { get; set; }
        public string FileName { get; set; }
        public string StorageType { get; set; }
        public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;
        public string FilePath { get; set; }
        public User User { get; set; }
        public bool IsDirectory { get; set; } = false;
    }
}
