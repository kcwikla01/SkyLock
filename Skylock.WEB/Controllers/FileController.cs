using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Skylock.ApplicationServices.Base;

namespace Skylock.WEB.Controllers
{
    [ApiController]
    [Route("api/File")]
    public class FileController : Controller
    {
        private readonly IFileApplicationService _fileApplicationService;
        public FileController(IFileApplicationService fileApplicationService)
        {
            _fileApplicationService = fileApplicationService;
        }

        [Authorize]
        [HttpPost("upload")]
        public async Task<IActionResult> UploadFile(IFormFile file, string path)
        {
            if (file == null || file.Length == 0)
                return BadRequest("File is empty.");

            return await _fileApplicationService.UploadFile(file, path);
        }

        [Authorize]
        [HttpGet("download/{fileId}")]
        public async Task<IActionResult> DownloadFile(string fileId)
        {
            return await _fileApplicationService.DownloadFile(fileId);
        }

        [Authorize]
        [HttpDelete("delete/{fileId}")]
        public async Task<IActionResult> DeleteFile(string fileId)
        {
            return await _fileApplicationService.DeleteFile(fileId);
        }

        [Authorize]
        [HttpGet("GetFiles")]
        public async Task<IActionResult> GetFiles()
        {
            return await _fileApplicationService.GetFiles();
        }

        [Authorize]
        [HttpGet("GetFileMetadata/{fileId}")]
        public async Task<IActionResult> GetFileMetadata(string fileId)
        {
            return Ok();
        }

        [Authorize(Roles = "admin")]
        [HttpGet("GetAllFiles")]
        public async Task<IActionResult> GetAllFiles()
        {
            return Ok();
        }
    }
}
