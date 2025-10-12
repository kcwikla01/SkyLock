using Microsoft.AspNetCore.Mvc;

namespace Skylock.WEB.ApplicationServices.Base
{
    public interface IAuthApplicationService : IApplicationService
    {
        Task<IActionResult> LoginOrRegister();
    }
}
