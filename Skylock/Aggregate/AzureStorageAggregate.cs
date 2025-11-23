using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Skylock.Aggregate.Base;
using Skylock.Database.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Skylock.Aggregate
{
    public class AzureStorageAggregate : StorageAggregate
    {
        internal static object? CreateOrDefault(string storageAggregateType, IConfiguration configuration)
        {
            throw new NotImplementedException();
        }

        public override bool DeleteFile(FileDTO fileInfo, User user)
        {
            throw new NotImplementedException();
        }

        public override Stream DownloadFile(FileDTO fileInfo, User user)
        {
            throw new NotImplementedException();
        }

        public override string SaveFile(IFormFile file, string targetFileName, User user)
        {
            throw new NotImplementedException();
        }
    }
}
