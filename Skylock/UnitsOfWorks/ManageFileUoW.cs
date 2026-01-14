using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.Extensions.Configuration;
using Skylock.Database.DbContext;
using Skylock.Database.Models;
using Skylock.UnitsOfWorks.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Skylock.UnitsOfWorks
{
    public class ManageFileUoW : IManageFileUoW
    {
        private readonly SkylockDbContext _dbContext;
        private readonly IMapper _mapper;
        private readonly string _storagePath;
        public ManageFileUoW(SkylockDbContext dbContext, IMapper mapper, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _mapper = mapper;
            _storagePath = configuration["LocalStorage:BasePath"];
        }
        public async Task<Skylock.Database.Models.File> AddFileToDB(string keycloakId, string originalFilename, string localFileName, string storageAggregateType, string? storagePath)
        {
            Skylock.Database.Models.File file = new Skylock.Database.Models.File
            {
                OwnerId = keycloakId,
                OriginalFileName = originalFilename,
                FileName = localFileName,
                StorageType = storageAggregateType,
                UploadedAt = DateTime.UtcNow,
                FilePath = storagePath??string.Empty,
                IsDirectory = false
            };

            await _dbContext.AddAsync(file);
            await _dbContext.SaveChangesAsync();

            return file;
        }

        public async Task<bool> DeleteFileDb(FileDTO fileInfo)
        {
            var file = await _dbContext.Files.FirstOrDefaultAsync(f => f.FileName == fileInfo.FileId);

            if (file == null) return false;

            try
            {
                _dbContext.Remove(file);
                await _dbContext.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<FileDTO?> GetFileInfo(string fileId)
        {
           var file =  await _dbContext.Files.FirstOrDefaultAsync(file => file.FileName == fileId);

            if( file == null)
            {
                return null;
            }
            var fileDto = _mapper.Map<FileDTO>(file); 
            return fileDto;
        }

        public IEnumerable<FileDTO> GetFiles(User user, string? path)
        {
            var targetPath = path ?? string.Empty;
            var rootPath = Path.Combine(_storagePath, user.KeycloakId.ToString(), targetPath);

            var searchPath = rootPath.EndsWith(Path.DirectorySeparatorChar.ToString())
                 ? rootPath
                 : rootPath + Path.DirectorySeparatorChar;

            var files = _dbContext.Files
                .Where(file => file.OwnerId == user.KeycloakId
                               && file.FilePath.StartsWith(searchPath)
                               && !file.IsDirectory)
                .AsEnumerable() // Przechodzimy do pamięci, aby móc wykonać bardziej złożone operacje na stringach
                .Where(file => {
                    var relativePath = file.FilePath.Substring(searchPath.Length);
                    // Jeśli w pozostałej części ścieżki nie ma ukośnika, plik jest bezpośrednio w tym folderze
                    return !relativePath.Contains(Path.DirectorySeparatorChar);
                })
                .ToList();

            return _mapper.Map<List<FileDTO>>(files);
        }
    }
}

