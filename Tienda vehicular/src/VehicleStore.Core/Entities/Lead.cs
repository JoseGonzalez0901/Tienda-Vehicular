using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VehicleStore.Core.Entities
{
    public class Lead
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public required string Name { get; set; }
        public required string Phone { get; set; }
        public string? Address { get; set; }
        public string? UnionOrStop { get; set; }
        public string Intention { get; set; } = "financed"; // cash|financed
        public int? VehicleId { get; set; }
        public string Source { get; set; } = "VehicleDetail";
    }
}
