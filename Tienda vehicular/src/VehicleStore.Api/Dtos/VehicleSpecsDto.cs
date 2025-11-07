using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VehicleStore.Core.Entities
{
    public sealed class VehicleSpecsDto
    {
        public string? Engine { get; set; }
        public string? Drive { get; set; }        // FWD|RWD|AWD|4x4
        public int? PowerHp { get; set; }
        public int? TorqueNm { get; set; }
        public string? Consumption { get; set; }
        public int? Doors { get; set; }
        public int? Seats { get; set; }
        public int? MileageKm { get; set; }
        public string? Description { get; set; }
        public List<string>? Accessories { get; set; }
        public List<string>? Features { get; set; }

    }
}
