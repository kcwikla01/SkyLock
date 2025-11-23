using Microsoft.Extensions.Configuration;
using Skylock.Aggregate.Base;
using Skylock.UnitsOfWorks.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Skylock.Aggregate
{
    public class StorageAggregateFactory : IAggregateFactory
    {
       
        public static StorageAggregate? CreateStorageAggregate(string StorageAggregateType, IConfiguration configuration)
        {
            return (StorageAggregate?)(LocalStorageAggregate.CreateOrDefault(StorageAggregateType, configuration) ??
                   AmazonStorageAggregate.CreateOrDefault(StorageAggregateType, configuration) ??
                   AzureStorageAggregate.CreateOrDefault(StorageAggregateType, configuration));
        }
    }
}
