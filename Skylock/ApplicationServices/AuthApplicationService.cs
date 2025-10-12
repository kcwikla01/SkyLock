using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Skylock.Database.DbContext;
using Skylock.Database.Models;
using Skylock.UnitsOfWorks.Base;
using Skylock.WEB.ApplicationServices.Base;
using Skylock.WEB.Extensions;
using System.Text.Json;

namespace Skylock.ApplicationServices
{
    public class AuthApplicationService : IAuthApplicationService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IManageUserUoW _manageUserUoW;

        public AuthApplicationService(
            IHttpContextAccessor httpContextAccessor, IManageUserUoW manageUserUoW)
        {
            _httpContextAccessor = httpContextAccessor;
            _manageUserUoW = manageUserUoW;
        }

        public async Task<IActionResult> LoginOrRegister()
        {
            var userLoginDto = ClaimsPrincipalExtensions.ToUserLoginDto(_httpContextAccessor.HttpContext.User);

            var user = await _manageUserUoW.CheckIfUserExist(userLoginDto);

            if (user != null)
            {
                return new OkObjectResult(user);
            }

            user = await _manageUserUoW.CreateUser(userLoginDto);

            string json = JsonSerializer.Serialize(user);
            return new OkObjectResult(userLoginDto);
        }
    }
}
