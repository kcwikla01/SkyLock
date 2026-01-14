using Microsoft.AspNetCore.Mvc;
using Skylock.ApplicationServices.Base;
using System.Web.Http;
using HttpGetAttribute = Microsoft.AspNetCore.Mvc.HttpGetAttribute;
using RouteAttribute = Microsoft.AspNetCore.Mvc.RouteAttribute;

namespace Skylock.WEB.Controllers
{
    [ApiController]
    [Route("api/statistics")]
    public class StatisticsController
    {
        private readonly IStatisticsApplicationService _statisticsApplicationService;
        public StatisticsController(IStatisticsApplicationService statisticsApplicationService)
        {
            _statisticsApplicationService = statisticsApplicationService;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> getStatistics()
        {
            return await _statisticsApplicationService.GetStatistics();
        }
    }
}
