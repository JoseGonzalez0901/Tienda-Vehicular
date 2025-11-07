using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VehicleStore.Core.Entities
{
    public class User
    {
        public int Id { get; set; }
        public required string Email { get; set; }
        public required string PasswordHash { get; set; }
        public string Role { get; set; } = "Agent"; // Admin | Agent
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
