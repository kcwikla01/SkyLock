using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Skylock.Database.Models
{
    public class User
    {
        [Key]
        public string KeycloakId { get; set; }
        public string Email { get; set; }
        public string UserName { get; set; }
    }
}
