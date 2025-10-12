using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Skylock.Database.Models;
using Skylock.WEB.ApplicationServices.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http.Results;

namespace Skylock.ApplicationServices
{
    public class AuthApplicationService : IAuthApplicationService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly DbContext _context;
        private readonly IMapper _mapper;

        public AuthApplicationService(
            IHttpContextAccessor httpContextAccessor,
            DbContext context,
            IMapper mapper)
        {
            _httpContextAccessor = httpContextAccessor;
            _context = context;
            _mapper = mapper;
        }

        public Task<IActionResult> LoginOrRegister()
        {
            var userLoginDto = _httpContextAccessor.HttpContext.User;

            User user = _mapper.Map<User>(userLoginDto);

            _context.Users.Add(user);
            _context.SaveChanges();

            // You may want to return an appropriate IActionResult here
            return Task.FromResult<IActionResult>(new OkResult());
        }
    }
}
