using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Skylock.WEB.Controllers
{
    [ApiController]
    [Route("/api/System")]
    public class SystemController
    {
        [HttpGet("HealthCheck")]
        public async Task<IActionResult> Ping()
        {
            return new OkObjectResult("Pong");
        }
    }
}
