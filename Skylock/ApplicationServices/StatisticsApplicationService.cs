using Microsoft.AspNetCore.Mvc;
using Skylock.ApplicationServices.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Skylock.ApplicationServices
{
    public class StatisticsApplicationService : IStatisticsApplicationService
    {
        public Task<IActionResult> GetStatistics()
        {
            throw new NotImplementedException();
        }
    }
}
