using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Skylock.WEB.ApplicationServices.Base;

namespace Skylock.WEB.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : Controller
    {
        private readonly IAuthApplicationService _authApplicationService;
        public AuthController(IAuthApplicationService authApplicationService)
        {
            _authApplicationService = authApplicationService;
        }

        [Authorize]
        [HttpGet("login")]
        public async Task<IActionResult> AllRegister()
        {
            return await _authApplicationService.LoginOrRegister();
        }

        [Authorize]
        [HttpGet]
        public IActionResult test()
        {
            return Ok();
        }

        [Authorize(Roles = "admin")]
        [HttpGet("testAdmin")]
        public IActionResult testAdmin()
        {
            return Ok();
        }
    }
}
