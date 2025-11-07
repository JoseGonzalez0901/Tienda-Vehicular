using System;
using System.Collections.Generic;
using System.Linq;
using System.Security;
using System.Text;
using System.Threading.Tasks;

namespace VehicleStore.Core.Entities
{
    public class VehicleSpec
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public Vehicle Vehicle { get; set; } = null!;
        public required string Key { get; set; }
        public required string Value { get; set; }
    }
}
