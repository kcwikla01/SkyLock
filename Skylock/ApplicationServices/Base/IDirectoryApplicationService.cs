using Microsoft.AspNetCore.Mvc;
using Skylock.WEB.ApplicationServices.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Skylock.ApplicationServices.Base
{
    public interface IDirectoryApplicationService : IApplicationService
    {
        Task<IActionResult> CreateFolder(string? folderPath);
        Task<IActionResult> GetDirectories(string? folderPath);
    }
}
