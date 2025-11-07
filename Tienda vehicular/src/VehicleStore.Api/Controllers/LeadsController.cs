using Microsoft.AspNetCore.Mvc;
using VehicleStore.Infrastructure.Data;
using VehicleStore.Core.Entities;

namespace VehicleStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeadsController(AppDbContext db) : ControllerBase
{
    public record CreateLeadDto(string Name, string Phone, string? Address, string? UnionOrStop, string Intention, int? VehicleId);

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] CreateLeadDto dto)
    {
        var lead = new Lead
        {
            Name = dto.Name,
            Phone = dto.Phone,
            Address = dto.Address,
            UnionOrStop = dto.UnionOrStop,
            Intention = dto.Intention,
            VehicleId = dto.VehicleId
        };
        db.Leads.Add(lead);
        await db.SaveChangesAsync();
        return Created($"/api/leads/{lead.Id}", new { lead.Id });
    }
}
