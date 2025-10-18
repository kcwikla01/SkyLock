using Skylock.Database.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Skylock.UnitsOfWorks.Base
{
    public interface IManageFileUoW : IUnitOfWork
    {
        Task<Skylock.Database.Models.File> AddFileToDB(string keycloakId, string originalFilename, string localFileName, string storageAggregateType);
        Task<FileDTO?> GetFileInfo(string fileId);
        IEnumerable<FileDTO> GetFiles(User user);
    }
}
