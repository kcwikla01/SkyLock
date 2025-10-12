using Skylock.Database.Models;
using System.Security.Claims;

namespace Skylock.WEB.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static UserLoginDto ToUserLoginDto(this ClaimsPrincipal principal)
        {
            return new UserLoginDto
            {
                KeycloakId = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new ArgumentNullException(nameof(principal), "sub claim is missing"),
                Email = principal.FindFirstValue(ClaimTypes.Email) ?? throw new ArgumentNullException(nameof(principal), "email claim is missing"),
                UserName = principal.FindFirstValue("preferred_username") ?? principal.FindFirstValue(ClaimTypes.Name) ?? throw new ArgumentNullException(nameof(principal), "preferred_username or name claim is missing")
            };
        }

        public static string? FindFirstValue(this ClaimsPrincipal principal, string claimType)
        {
            return principal.Claims.FirstOrDefault(c => c.Type == claimType)?.Value;
        }
    }
}
