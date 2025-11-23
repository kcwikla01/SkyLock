using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
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
        public ManageFileUoW(SkylockDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }
        public async Task<Skylock.Database.Models.File> AddFileToDB(string keycloakId, string originalFilename, string localFileName, string storageAggregateType, string filePath)
        {
            Skylock.Database.Models.File file = new Skylock.Database.Models.File
            {
                OwnerId = keycloakId,
                OriginalFileName = originalFilename,
                FileName = localFileName,
                StorageType = storageAggregateType,
                UploadedAt = DateTime.UtcNow,
                
            };

            await _dbContext.AddAsync(file);
            await _dbContext.SaveChangesAsync();

            return file;
        }

        public async Task<bool> DeleteFileDb(FileDTO fileInfo)
        {
            var file = await _dbContext.Files.FirstOrDefaultAsync(file => file.FileName.Equals(fileInfo.FileId));

            try
            {
                _dbContext.Remove(file);
                await _dbContext.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
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

        public IEnumerable<FileDTO> GetFiles(User user)
        {
            var files = _dbContext.Files.Where(file => file.OwnerId == user.KeycloakId);
            var FilesList = _mapper.Map<List<FileDTO>>(files);
            return FilesList;
        }
    }
}

