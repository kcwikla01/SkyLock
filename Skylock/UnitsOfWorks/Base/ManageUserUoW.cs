using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Skylock.Database.DbContext;
using Skylock.Database.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Skylock.UnitsOfWorks.Base
{
    public class ManageUserUoW : IManageUserUoW
    {
        private readonly IMapper _mapper;
        private readonly SkylockDbContext _dbContext;

        public ManageUserUoW(IMapper mapper, SkylockDbContext dbContext)
        {
            _mapper = mapper;
            _dbContext = dbContext;
        }   
        public async Task<User?> CheckIfUserExist(UserLoginDto userLoginDto)
        {
            return await _dbContext.Users.FirstOrDefaultAsync(u => u.KeycloakId == userLoginDto.KeycloakId);
        }

        public async Task<User?> CreateUser(UserLoginDto userLoginDto)
        {
            var userEntry = _dbContext.Users.Add(_mapper.Map<User>(userLoginDto));
            await _dbContext.SaveChangesAsync();
            return userEntry.Entity;
        }
    }
}
