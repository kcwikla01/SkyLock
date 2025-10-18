using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Skylock.WEB.ApplicationServices.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Skylock.ApplicationServices.Base
{
    public interface IFileApplicationService : IApplicationService
    {
        Task<IActionResult> DownloadFile(string fileId);
        Task<IActionResult> GetFiles();
        Task<IActionResult> UploadFile(IFormFile file);
    }
}
