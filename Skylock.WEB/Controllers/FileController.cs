using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Skylock.WEB.Controllers
{
    [ApiController]
    [Route("api/File")]
    public class FileController : Controller
    {

        [Authorize]
        [HttpPost("upload")]
        public async Task<IActionResult> UploadFile()
        {
            return Ok();
        }

        [Authorize]
        [HttpGet("download/{fileId}")]
        public async Task<IActionResult> DownloadFile(string fileId)
        {
            return Ok();
        }

        [Authorize]
        [HttpDelete("delete/{fileId}")]
        public async Task<IActionResult> DeleteFile(string fileId)
        {
            return Ok();
        }

        [Authorize]
        [HttpGet("GetFiles")]
        public async Task<IActionResult> GetFiles()
        {
            return Ok();
        }

        [Authorize]
        [HttpGet("GetFileMetadata/{fileId}")]
        public async Task<IActionResult> GetFileMetadata(string fileId)
        {
            return Ok();
        }

        [Authorize]
        [HttpGet("GetAllFiles")]
        public async Task<IActionResult> GetAllFiles()
        {
            return Ok();
        }
    }
}
