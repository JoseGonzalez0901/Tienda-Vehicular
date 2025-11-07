using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VehicleStore.Core.Entities
{
    public class Brand
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public string? LogoUrl { get; set; }
        public ICollection<VehicleModel> Models { get; set; } = [];
    }
}
