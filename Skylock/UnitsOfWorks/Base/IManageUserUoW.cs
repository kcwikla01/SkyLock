using Skylock.Database.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Skylock.UnitsOfWorks.Base
{
    public interface IManageUserUoW : IUnitOfWork
    {
        Task<User?> CheckIfUserExist(UserLoginDto userLoginDto);
        Task<User?> CreateUser(UserLoginDto userLoginDto);
    }
}
