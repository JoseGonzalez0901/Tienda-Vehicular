using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleStore.Infrastructure.Data;

namespace VehicleStore.Api.Controllers;

[ApiController]
[Route("api/vehicles/facets")]
public class VehiclesFacetsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var byBrand = await db.Vehicles
            .Include(v => v.Model).ThenInclude(m => m.Brand)
            .GroupBy(v => v.Model.Brand.Name)
            .Select(g => new { brand = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count).ToListAsync();

        var byFuel = await db.Vehicles
            .GroupBy(v => v.Fuel)
            .Select(g => new { fuel = g.Key, count = g.Count() })
            .ToListAsync();

        var byTransmission = await db.Vehicles
            .GroupBy(v => v.Transmission)
            .Select(g => new { transmission = g.Key, count = g.Count() })
            .ToListAsync();

        return Ok(new { byBrand, byFuel, byTransmission });
    }
}
