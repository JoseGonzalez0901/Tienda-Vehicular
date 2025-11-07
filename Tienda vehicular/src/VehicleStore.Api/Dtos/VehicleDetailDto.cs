using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace VehicleStore.Core.Entities
{
    public sealed class VehicleDetailDto
    {
        public int Id { get; set; }
        public required string Title { get; set; }
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public int? Year { get; set; }
        public decimal Price { get; set; }

        public string Type { get; set; } = "carro";        // FE usa default "carro" si no llega
        public string Condition { get; set; } = "Usado";   // "Nuevo" | "Usado"

        public string? Fuel { get; set; }
        public string? Transmission { get; set; }
        public string? Color { get; set; }
        public string? Location { get; set; }

        public List<string> Gallery { get; set; } = new();
        public string? VideoUrl { get; set; }

        [JsonPropertyName("model3DUrl")]
        public string? Model3DUrl { get; set; } // nota: D mayúscula para coincidir con tu FE

        public VehicleSpecsDto Specs { get; set; } = new();
    }
}
