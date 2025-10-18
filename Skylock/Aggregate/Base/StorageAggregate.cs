using Microsoft.AspNetCore.Http;
using Skylock.Database.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Skylock.Aggregate.Base
{
    public abstract class StorageAggregate : IAggregate
    {
        public abstract string SaveFile(IFormFile file, string targetFileName, User user);
        public abstract Stream DownloadFile(FileDTO fileInfo, User user);
    }
}
