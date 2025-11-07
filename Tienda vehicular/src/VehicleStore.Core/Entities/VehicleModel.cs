using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VehicleStore.Core.Entities
{
    public class VehicleModel
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public int BrandId { get; set; }
        public Brand Brand { get; set; } = null!;
        public ICollection<Vehicle> Vehicles { get; set; } = [];
    }
}
