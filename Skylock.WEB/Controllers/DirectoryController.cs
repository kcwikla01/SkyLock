using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Skylock.ApplicationServices.Base;

namespace Skylock.WEB.Controllers
{
    [ApiController]
    [Route("api/Directory")]
    public class DirectoryController : Controller
    {
        private readonly IDirectoryApplicationService _directoryApplicationService;

        public DirectoryController(IDirectoryApplicationService directoryApplicationService)
        {
            _directoryApplicationService = directoryApplicationService;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetDirectories(string? FolderPath)
        {
            return await _directoryApplicationService.GetDirectories(FolderPath);
        }

        [Authorize]
        [HttpPost("CreateFolder")]
        public async Task<IActionResult> CreateFolder(string? FolderPath)
        {
            return await _directoryApplicationService.CreateFolder(FolderPath);
        }
    }
}
