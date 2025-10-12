namespace Skylock.Database.Models
{
    public class UserLoginDto
    {
        public string KeycloakId { get; set; }
        public string Email { get; set; }
        public string UserName { get; set; }
    }
}