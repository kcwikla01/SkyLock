using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Skylock.Aggregate;
using Skylock.ApplicationServices.Base;
using Skylock.UnitsOfWorks.Base;
using Skylock.WEB.Extensions;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Skylock.ApplicationServices
{
    public class FileApplicationService : IFileApplicationService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IManageUserUoW _manageUserUoW;
        private readonly IConfiguration _configuration;
        private readonly string StorageAggregateType;
        private readonly IManageFileUoW _manageFileUoW;
        public FileApplicationService(
            IHttpContextAccessor httpContextAccessor, IManageUserUoW manageUserUoW, IConfiguration configuration, IManageFileUoW manageFileUoW)
        {
            _httpContextAccessor = httpContextAccessor;
            _manageUserUoW = manageUserUoW;
            if (configuration == null)
            {
                throw new ArgumentNullException(nameof(configuration));
            }
            _configuration = configuration;
            StorageAggregateType = _configuration["StorageType"];
            _manageFileUoW = manageFileUoW;
        }

        public async Task<IActionResult> DownloadFile(string fileId)
        {
            var userLoginDto = ClaimsPrincipalExtensions.ToUserLoginDto(_httpContextAccessor.HttpContext.User);
            var user = await _manageUserUoW.CheckIfUserExist(userLoginDto);
            if(user == null)
            {
                return new NotFoundObjectResult("File not exist");
            }

            var fileInfo = await _manageFileUoW.GetFileInfo(fileId);

            if(fileInfo == null)
            {
                return new NotFoundObjectResult("File not exist");
            }

            if(!fileInfo.StorageType.Equals( StorageAggregateType))
            {
                return new BadRequestObjectResult("Not access to the storage");
            }

            var storageAggregate = StorageAggregateFactory.CreateStorageAggregate(StorageAggregateType, _configuration);
            var fileStream = storageAggregate.DownloadFile(fileInfo, user);

            return new FileStreamResult(fileStream, "application/octet-stream")
            {
                FileDownloadName = fileInfo.OriginalFileName
            };
        }

        public async Task<IActionResult> GetFiles()
        {
            var userLoginDto = ClaimsPrincipalExtensions.ToUserLoginDto(_httpContextAccessor.HttpContext.User);
            var user = await _manageUserUoW.CheckIfUserExist(userLoginDto);
            if (user == null)
            {
                return new NotFoundObjectResult("User not exist");
            }

            var fileList = _manageFileUoW.GetFiles(user);

            return new OkObjectResult(fileList);
        }

        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return new BadRequestObjectResult("File is empty.");

            var userLoginDto = ClaimsPrincipalExtensions.ToUserLoginDto(_httpContextAccessor.HttpContext.User);

            var user = await _manageUserUoW.CheckIfUserExist(userLoginDto);

            var storageAggregate = StorageAggregateFactory.CreateStorageAggregate(StorageAggregateType, _configuration);

            var fileName = Guid.NewGuid().ToString();
            var storagePath = storageAggregate.SaveFile(file, fileName, user);

            var addedFile = await _manageFileUoW.AddFileToDB(userLoginDto.KeycloakId, file.FileName, fileName, StorageAggregateType);

            return new OkObjectResult(new { Message = $"File uploaded successfully - {addedFile.Id}" });
        }
    }
}
