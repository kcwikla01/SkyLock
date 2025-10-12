using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Skylock.Database.DbContext;
using Skylock.WEB.ApplicationServices.Base;

namespace Skylock.WEB.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : Controller
    {
        private readonly IConfiguration _config;
        private readonly IAuthApplicationService _authApplicationService;
        private readonly SkylockDbContext _context;
        private readonly IMapper _mapper;

        public AuthController(IConfiguration config, SkylockDbContext context, IMapper mapper, IAuthApplicationService authApplicationService)
        {
            _config = config;
            _context =context;
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
