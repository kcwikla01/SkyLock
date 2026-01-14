using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Skylock.ApplicationServices.Base;
using Skylock.Database.DbContext;
using Skylock.Database.Models;
using Skylock.UnitsOfWorks.Base;
using Skylock.WEB.Extensions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Skylock.ApplicationServices
{
    public class DirectoryApplicationService : IDirectoryApplicationService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IManageUserUoW _manageUserUoW;
        private readonly SkylockDbContext _dbContext;
        private readonly string _storagePath;

        public DirectoryApplicationService(
            IHttpContextAccessor httpContextAccessor, IManageUserUoW manageUserUoW, SkylockDbContext dbContext, IConfiguration configuration)
        {
            _httpContextAccessor = httpContextAccessor;
            _manageUserUoW = manageUserUoW;
            _dbContext = dbContext;
            _storagePath = configuration["LocalStorage:BasePath"];
        }

        public async Task<IActionResult> CreateFolder(string? folderPath)
        {
            var userLoginDto = ClaimsPrincipalExtensions.ToUserLoginDto(_httpContextAccessor.HttpContext.User);
            var user = await _manageUserUoW.CheckIfUserExist(userLoginDto);
            var keycloakId = user.KeycloakId;

            if (string.IsNullOrEmpty(folderPath))
                folderPath = string.Empty;
            
            var rootPath = Path.Combine(_storagePath, keycloakId.ToString(), folderPath);
            if (!Directory.Exists(rootPath))
                Directory.CreateDirectory(rootPath);

            var file = new Database.Models.File
            {
                OwnerId = keycloakId,
                FilePath = rootPath,
                UploadedAt = DateTime.Now,
                IsDirectory = true,
                StorageType = "0",
                FileName = folderPath.Split("/").Last(),
                OriginalFileName = folderPath.Split("\\").Last()
            };

            _dbContext.Add(file);
            _dbContext.SaveChanges();

            return new OkObjectResult("Folder created successfully.");
        }

        public async Task<IActionResult> GetDirectories(string? folderPath)
        {
            var userLoginDto = ClaimsPrincipalExtensions.ToUserLoginDto(_httpContextAccessor.HttpContext.User);
            var user = await _manageUserUoW.CheckIfUserExist(userLoginDto);
            var keycloakId = user.KeycloakId;

            var userRoot = Path.Combine(_storagePath, keycloakId);
            if (!userRoot.EndsWith(Path.DirectorySeparatorChar))
                userRoot += Path.DirectorySeparatorChar;

            // 2. Budujemy konkretną ścieżkę, w której szukamy
            var currentSearchPath = string.IsNullOrEmpty(folderPath)
                ? userRoot
                : Path.Combine(userRoot, folderPath.TrimStart('\\', '/'));

            // Kluczowe: upewniamy się, że ścieżka kończy się separatorem, 
            // aby nie dopasować folderów o podobnych nazwach (np. "test" i "test-nowy")
            if (!currentSearchPath.EndsWith(Path.DirectorySeparatorChar))
                currentSearchPath += Path.DirectorySeparatorChar;

            var directories = await _dbContext.Files
                .AsNoTracking()
                .Where(f => f.OwnerId == keycloakId
                         && f.IsDirectory
                         && f.FilePath.StartsWith(currentSearchPath))
                .ToListAsync();

            // 3. Filtrowanie "tylko bezpośrednie dzieci" w pamięci
            var result = directories
                .Where(f => {
                    // Wycinamy ścieżkę rodzica
                    var relativePath = f.FilePath.Substring(currentSearchPath.Length).TrimEnd(Path.DirectorySeparatorChar);

                    // Jeśli po wycięciu rodzica w nazwie nie ma separatora, to jest to bezpośredni podfolder
                    return !string.IsNullOrEmpty(relativePath) && !relativePath.Contains(Path.DirectorySeparatorChar);
                })
                .Select(f => f.OriginalFileName)
                .ToList();

            return new OkObjectResult(result);
        }
    }
}
